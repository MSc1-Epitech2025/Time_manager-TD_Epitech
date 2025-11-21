import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ManagerService } from '../../core/services/manager';
import { ReportService } from '../../core/services/report';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { PlanningService, PlanningEvent } from '../../core/services/planning';
import { NotificationService } from '../../core/services/notification';

type ClockKind = 'IN' | 'OUT';

interface ClockRecord {
  id: string;
  kind: ClockKind;
  at: string;
}

interface GraphqlPayload<T> {
  data: T;
  errors?: { message: string }[];
}

interface MyClocksResponse {
  myClocks: ClockRecord[];
}

interface ClockMutationResponse {
  createClockForMe: ClockRecord;
}

const GRAPHQL_ENDPOINT = 'http://localhost:8030/graphql';

const MY_CLOCKS_QUERY = `
  query MyClocks($from: String!, $to: String!) {
    myClocks(from: $from, to: $to) {
      id
      kind
      at
    }
  }
`;

const CLOCK_MUTATION = `
  mutation Punch($input: ClockCreateInput!) {
    createClockForMe(input: $input) {
      id
      kind
      at
    }
  }
`;

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  templateUrl: './employee-dashboard.html',
  styleUrls: ['./employee-dashboard.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    NgChartsModule,
  ],
})
export class EmployeeDashboard implements OnInit, OnDestroy {
  isWorking = false;
  statusLabel: 'Demarrer' | 'Pause' = 'Demarrer';
  private tickerId: number | null = null;
  private currentSessionStart: Date | null = null;
  private baseTodaySeconds = 0;
  private weekRange = currentWeekRange();
  private clockEvents: ClockRecord[] = [];
  private absenceEvents: PlanningEvent[] = [];
  private tickCounter = 0;
  actionPending = false;

  user = {
    name: '',
    poste: '',
    email: '',
  };

  loadingStats = false;

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Presence', 'Retards', 'Absence'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#A78BFA', '#F472B6', '#C084FC'],
      },
    ],
  };

  chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#F9FAFB' },
      },
    },
  };

  constructor(
    private router: Router,
    private auth: AuthService,
    private http: HttpClient,
    private planningService: PlanningService,
    private notify: NotificationService,
  ) {}

  ngOnInit() {
    this.populateUser();
    this.refreshDashboard();
  }

  ngOnDestroy(): void {
    this.stopTicker();
  }

  get timer(): number {
    void this.tickCounter;
    if (!this.isWorking || !this.currentSessionStart) return 0;
    return Math.floor((Date.now() - this.currentSessionStart.getTime()) / 1000);
  }

  get todayTotalSeconds(): number {
    return this.baseTodaySeconds + this.timer;
  }

  get todayHoursMinutes(): { hours: number; minutes: number } {
    const total = this.todayTotalSeconds;
    return {
      hours: Math.floor(total / 3600),
      minutes: Math.floor((total % 3600) / 60),
    };
  }

  get formattedTimer(): string {
    const seconds = this.timer;
    const minutes = Math.floor(seconds / 60) % 60;
    const hours = Math.floor(seconds / 3600);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  async toggleWorkStatus() {
    if (this.actionPending) return;
    if (this.isWorking) {
      await this.stopWork();
    } else {
      await this.startWork();
    }
  }

  private async startWork() {
    this.actionPending = true;
    try {
      await this.sendClockMutation('IN');
      this.notify.success('Clock in recorded');
      await this.refreshDashboard();
    } catch (err) {
      console.error(err);
      this.notify.error('Unable to start work session');
    } finally {
      this.actionPending = false;
    }
  }

  private async stopWork() {
    this.actionPending = true;
    try {
      await this.sendClockMutation('OUT');
      this.notify.success('Clock out recorded');
      await this.refreshDashboard();
    } catch (err) {
      console.error(err);
      this.notify.error('Unable to pause the session');
    } finally {
      this.actionPending = false;
    }
  }

  private async refreshDashboard() {
    this.loadingStats = true;
    try {
      await this.auth.refreshProfile();
      this.populateUser();

      this.weekRange = currentWeekRange();
      const [clocks, planning] = await Promise.all([
        this.fetchClocks(this.weekRange),
        firstValueFrom(this.planningService.getEmployeePlanning()),
      ]);

      this.clockEvents = clocks;
      this.absenceEvents = planning.events;

      this.computeMetrics();
    } catch (err) {
      console.error(err);
      this.notify.error('Unable to retrieve work data');
    } finally {
      this.loadingStats = false;
    }
  }

  private computeMetrics() {
    this.stopTicker();
    this.baseTodaySeconds = 0;
    this.currentSessionStart = null;
    this.isWorking = false;
    this.statusLabel = 'Demarrer';

    const { sessions, openSession, firstInPerDay } = buildSessions(this.clockEvents);
    const todayKey = toDayKey(new Date());

    this.baseTodaySeconds = sessions.reduce((acc, session) => {
      return acc + overlapSeconds(session.start, session.end, dayRange(todayKey));
    }, 0);

    if (openSession) {
      this.currentSessionStart = openSession.start;
      this.isWorking = true;
      this.statusLabel = 'Pause';
      this.startTicker(openSession.start);
    }

    const totalWorkedSeconds = sessions.reduce((acc, session) => {
      return acc + overlapSeconds(session.start, session.end, this.weekRange);
    }, 0);

    const lateDays = countLateDays(firstInPerDay);
    const absenceHours = computeAbsenceHours(this.absenceEvents, this.weekRange);
    const totalWeekDays = countWeekdays(this.weekRange.from, this.weekRange.to);
    const expectedHours = totalWeekDays * 8;
    const expectedSeconds = expectedHours * 3600;

    const presencePct = expectedHours
      ? clampPct((totalWorkedSeconds / 3600 / expectedHours) * 100)
      : 0;
    const absencePct = expectedHours
      ? clampPct((absenceHours / expectedHours) * 100)
      : 0;
    const latenessPct = totalWeekDays
      ? clampPct((lateDays / totalWeekDays) * 100)
      : 0;

    const sum = presencePct + absencePct + latenessPct;
    const scale = sum > 100 && sum > 0 ? 100 / sum : 1;
    const adjPresence = Math.round(presencePct * scale);
    const adjAbsence = Math.round(absencePct * scale);
    const adjLate = Math.max(0, 100 - adjPresence - adjAbsence);

    this.pieChartData = {
      ...this.pieChartData,
      datasets: [
        {
          ...this.pieChartData.datasets[0],
          data: [adjPresence, adjLate, adjAbsence],
        },
      ],
    };
  }

  private async fetchClocks(range: { from: Date; to: Date }): Promise<ClockRecord[]> {
    const response = await firstValueFrom(
      this.http.post<GraphqlPayload<MyClocksResponse>>(
        GRAPHQL_ENDPOINT,
        {
          query: MY_CLOCKS_QUERY,
          variables: {
            from: range.from.toISOString(),
            to: range.to.toISOString(),
          },
        },
        { withCredentials: true }
      )
    );

    if (response.errors?.length) {
      throw new Error(response.errors.map((e) => e.message).join(', '));
    }

    return response.data?.myClocks ?? [];
  }

  private async sendClockMutation(kind: ClockKind): Promise<ClockRecord> {
    const response = await firstValueFrom(
      this.http.post<GraphqlPayload<ClockMutationResponse>>(
        GRAPHQL_ENDPOINT,
        {
          query: CLOCK_MUTATION,
          variables: { input: { kind } },
        },
        { withCredentials: true }
      )
    );

    if (response.errors?.length) {
      throw new Error(response.errors.map((e) => e.message).join(', '));
    }

    return response.data!.createClockForMe;
  }

  private startTicker(start: Date) {
    this.stopTicker();
    this.tickerId = window.setInterval(() => {
      this.tickCounter++;
    }, 1000);
  }

  private stopTicker() {
    if (this.tickerId !== null) {
      clearInterval(this.tickerId);
      this.tickerId = null;
    }
    this.tickCounter = 0;
  }

  private populateUser() {
    const session = this.auth.session;
    if (!session) return;
    this.user = {
      name: session.user.fullName ?? session.user.email ?? '',
      poste: session.user.poste ?? '',
      email: session.user.email ?? '',
    };
  }

  goToPlanning() {
    this.router.navigate(['/planning']);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

interface ClockSession {
  start: Date;
  end: Date;
}

function buildSessions(clocks: ClockRecord[]): {
  sessions: ClockSession[];
  openSession: { start: Date } | null;
  firstInPerDay: Map<string, Date>;
} {
  const sorted = [...clocks].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const sessions: ClockSession[] = [];
  const firstInPerDay = new Map<string, Date>();
  let currentStart: Date | null = null;
  for (const clock of sorted) {
    const at = new Date(clock.at);
    const dayKey = toDayKey(at);
    if (clock.kind === 'IN') {
      currentStart = at;
      if (!firstInPerDay.has(dayKey) || at < firstInPerDay.get(dayKey)!) {
        firstInPerDay.set(dayKey, at);
      }
    } else if (clock.kind === 'OUT' && currentStart) {
      sessions.push({ start: currentStart, end: at });
      currentStart = null;
    }
  }
  const openSession = currentStart ? { start: currentStart } : null;
  return { sessions, openSession, firstInPerDay };
}

function overlapSeconds(start: Date, end: Date, range: { from: Date; to: Date }): number {
  const rangeStart = range.from.getTime();
  const rangeEnd = range.to.getTime();
  const s = Math.max(start.getTime(), rangeStart);
  const e = Math.min(end.getTime(), rangeEnd);
  return e > s ? Math.floor((e - s) / 1000) : 0;
}

function dayRange(dayKey: string): { from: Date; to: Date } {
  const [y, m, d] = dayKey.split('-').map((value) => Number(value));
  const from = new Date(y, m - 1, d, 0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(from.getDate() + 1);
  return { from, to };
}

function currentWeekRange(): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(now);
  const day = from.getDay() === 0 ? 7 : from.getDay();
  from.setDate(from.getDate() - day + 1);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(from.getDate() + 7);
  return { from, to };
}

function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function countWeekdays(from: Date, to: Date): number {
  const cursor = new Date(from);
  let count = 0;
  while (cursor < to) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function countLateDays(firstInPerDay: Map<string, Date>): number {
  const thresholdMinutes = 9 * 60 + 5;
  let late = 0;
  for (const value of firstInPerDay.values()) {
    const minutes = value.getHours() * 60 + value.getMinutes();
    if (minutes > thresholdMinutes) late += 1;
  }
  return late;
}

function computeAbsenceHours(events: PlanningEvent[], range: { from: Date; to: Date }): number {
  const rangeStart = range.from.getTime();
  const rangeEnd = range.to.getTime();
  let units = 0;
  for (const event of events) {
    const date = parseDate(event.date);
    if (!date) continue;
    const time = date.getTime();
    if (time < rangeStart || time >= rangeEnd) continue;
    if (event.status && event.status !== 'APPROVED') continue;
    if (event.period === 'AM' || event.period === 'PM') units += 0.5;
    else units += 1;
  }
  return units * 8;
}

function parseDate(value: string): Date | null {
  const [y, m, d] = value.split('-').map((v) => Number(v));
  if ([y, m, d].some((v) => Number.isNaN(v))) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
