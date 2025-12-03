import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AbsenceRequestModal } from '@modal/absence-request-modal/absence-request-modal';

// Services
import { AuthService } from '@core/services/auth';
import { PlanningService, PlanningEvent } from '@core/services/planning';
import { NotificationService } from '@core/services/notification';
import { WeatherService, WeatherSnapshot } from '@core/services/weather';
import { AbsenceService, Absence } from '@core/services/absence';
import { ClockService } from '@core/services/clock';
import { LeaveAccountService, LeaveAccountDto } from '@core/services/leave-account';
import { KpiService } from '@core/services/kpi';

// Models & Utils
import { ClockRecord, UserKpiSummary } from '@shared/models/graphql.types';
import { currentWeekRange, formatDate, getCurrentQuarter, formatDateToYYYYMMDD } from '@shared/utils/date.utils';
import { 
  buildSessions, 
  computeTimeMetrics, 
  normalizeChartData,
  SessionAnalysis 
} from '@shared/business-logic/time-tracking.logic';
import { 
  formatAbsenceType, 
  formatTimeHHMM, 
  formatHoursMinutes,
  getWeatherIcon 
} from '@shared/utils/formatting.utils';

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
    MatChipsModule,
    MatProgressBarModule,
    MatListModule,
    MatDividerModule,
    NgChartsModule,
    MatDialogModule,
  ],
})
export class EmployeeDashboard implements OnInit, OnDestroy {
  Math = Math;
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
  loadingAbsences = false;
  loadingLeaveBalance = false;
  loadingKpi = false;
  weather: WeatherSnapshot | null = null;
  recentAbsences: Absence[] = [];
  leaveAccounts: LeaveAccountDto[] = [];
  expandedLeaveItems = new Set<number>();
  kpiData: UserKpiSummary | null = null;

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Presence', 'Delays', 'Absence'],
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
    private clockService: ClockService,
    private planningService: PlanningService,
    private notify: NotificationService,
    private weatherService: WeatherService,
    private absenceService: AbsenceService,
    private leaveAccountService: LeaveAccountService,
    private kpiService: KpiService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.populateUser();
    this.refreshDashboard();
    this.initWeather();
    this.loadRecentAbsences();
    this.loadLeaveBalance();
    this.loadMyKpi();
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
    return formatHoursMinutes(this.todayTotalSeconds);
  }

  get formattedTimer(): string {
    return formatTimeHHMM(this.timer);
  }

  async toggleWorkStatus() {
    if (this.actionPending) return;
    if (this.isWorking) {
      await this.stopWork();
    } else {
      await this.startWork();
    }
    // 3 second cooldown to prevent spam
    setTimeout(() => {
      this.actionPending = false;
    }, 3000);
  }

  private async startWork() {
    this.actionPending = true;
    try {
      const result = await firstValueFrom(this.clockService.createClock('IN'));
      console.log('Clock in result:', result);
      this.notify.success('Clock in recorded');
      await this.refreshDashboard();
    } catch (err: any) {
      console.error('Start work error:', err);
      this.notify.error(err.message || 'Unable to start work session');
      this.actionPending = false;
    }
  }

  private async stopWork() {
    this.actionPending = true;
    try {
      const result = await firstValueFrom(this.clockService.createClock('OUT'));
      console.log('Clock out result:', result);
      this.notify.success('Clock out recorded');
      await this.refreshDashboard();
    } catch (err: any) {
      console.error('Stop work error:', err);
      this.notify.error(err.message || 'Unable to pause the session');
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
        firstValueFrom(this.clockService.getClocks(
          this.weekRange.from.toISOString(),
          this.weekRange.to.toISOString()
        )),
        firstValueFrom(this.planningService.getEmployeePlanning()),
      ]);

      this.clockEvents = clocks;
      this.absenceEvents = planning.events;

      this.computeMetrics();
    } catch (err) {
      console.error(err);
      this.notify.error('Impossible to get your work data');
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

    const { sessions, openSession } = buildSessions(this.clockEvents);
    const todayKey = new Date().toISOString().split('T')[0];

    const metrics = computeTimeMetrics(
      sessions,
      this.absenceEvents,
      this.weekRange,
      todayKey
    );

    this.baseTodaySeconds = metrics.baseTodaySeconds;

    if (openSession) {
      this.currentSessionStart = openSession.start;
      this.isWorking = true;
      this.statusLabel = 'Pause';
      this.startTicker(openSession.start);
    }

    const [adjPresence, adjLate, adjAbsence] = normalizeChartData(
      metrics.presencePct,
      metrics.absencePct,
      metrics.latenessPct
    );

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
  goToTeams(){
    this.router.navigate(['/planning']);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private initWeather() {
    this.weatherService.weather$().subscribe((weather) => {
      this.weather = weather;
    });
    this.weatherService.startPolling();
  }

  private async loadRecentAbsences() {
    this.loadingAbsences = true;
    try {
      const absences = await firstValueFrom(this.absenceService.myAbsences());
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      this.recentAbsences = absences
        .filter(absence => {
          const endDate = new Date(absence.endDate);
          endDate.setHours(0, 0, 0, 0);
          return endDate >= today;
        })
        .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
        .slice(0, 5);
    } catch (err) {
      console.error('Failed to load absences:', err);
    } finally {
      this.loadingAbsences = false;
    }
  }

  private async loadLeaveBalance() {
    this.loadingLeaveBalance = true;
    try {
      const session = this.auth.session;
      if (!session?.user.id) return;

      this.leaveAccounts = await firstValueFrom(
        this.leaveAccountService.getLeaveAccountsByUser(session.user.id)
      );
    } catch (err) {
      console.error('Failed to load leave balance:', err);
    } finally {
      this.loadingLeaveBalance = false;
    }
  }

  private async loadMyKpi() {
    this.loadingKpi = true;
    try {
      const quarter = getCurrentQuarter();
      const startDate = formatDateToYYYYMMDD(quarter.start);
      const endDate = formatDateToYYYYMMDD(quarter.end);

      this.kpiData = await firstValueFrom(
        this.kpiService.getMyKpi(startDate, endDate)
      );
    } catch (err) {
      console.error('Failed to load KPI data:', err);
    } finally {
      this.loadingKpi = false;
    }
  }

  requestAbsence() {
    const today = new Date();
    const dialogRef = this.dialog.open(AbsenceRequestModal, {
      width: '500px',
      data: {
        startDate: today,
        endDate: today,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.createAbsenceRequest(result);
      }
    });
  }

  private async createAbsenceRequest(data: any) {
    try {
      await firstValueFrom(this.absenceService.createAbsence(data));
      this.notify.success('Absence request submitted successfully');
      await this.loadRecentAbsences();
      await this.loadLeaveBalance();
      await this.refreshDashboard();
    } catch (err) {
      console.error('Failed to create absence', err);
      this.notify.error('Failed to submit absence request');
    }
  }

  toggleLeaveItem(index: number) {
    if (this.expandedLeaveItems.has(index)) {
      this.expandedLeaveItems.delete(index);
    } else {
      this.expandedLeaveItems.add(index);
    }
  }

  isLeaveItemExpanded(index: number): boolean {
    return this.expandedLeaveItems.has(index);
  }

  viewReports() {
    this.router.navigate(['/log-history']);
  }

  viewProfile() {
    this.notify.info('Profile page coming soon');
  }

  getWeatherIcon(): string {
    if (!this.weather) return 'wb_sunny';
    return getWeatherIcon(this.weather.code, this.weather.isDay);
  }

  formatAbsenceType(type: string): string {
    return formatAbsenceType(type);
  }

  formatDate(dateStr: string): string {
    return formatDate(dateStr);
  }
}
