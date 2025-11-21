import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  catchError,
  forkJoin,
  map,
  of,
  switchMap,
} from 'rxjs';
import { AuthService } from './auth';

const GRAPHQL_ENDPOINT = 'http://localhost:8030/graphql';

type ClockKind = 'IN' | 'OUT';

type GraphqlError = { message: string };

type GraphqlResponse<T> = {
  data?: T;
  errors?: GraphqlError[];
};

type GraphqlUser = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  poste?: string | null;
};

type GraphqlTeam = {
  id: string;
  name: string;
  members?: { id: string }[] | null;
};

type GraphqlClock = {
  id: string;
  kind: ClockKind;
  at: string;
};

type GraphqlAbsenceDay = {
  absenceDate: string;
  period: 'FULL_DAY' | 'AM' | 'PM';
};

type GraphqlAbsence = {
  id: string;
  userId: string;
  startDate?: string | null;
  endDate?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  type?: string;
  reason?: string | null;
  days?: GraphqlAbsenceDay[] | null;
};

type UsersPayload = { users: GraphqlUser[] };
type TeamsPayload = { teams: GraphqlTeam[] };
type ClocksPayload = { clocksForUser: GraphqlClock[] };
type AbsencesPayload = { absencesByUser: GraphqlAbsence[] };

export interface CompanySummary {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  totalHoursThisWeek: number;
  averageHoursPerEmployee: number;
  productivityRate: number;
  presencePct: number;
  absencePct: number;
  latePct: number;
}

export interface EmployeeSimple {
  id: string;
  name: string;
  email: string;
  poste?: string | null;
  team?: string | null;
}

export interface EmployeeDetail {
  id: string;
  name: string;
  email: string;
  poste?: string | null;
  team?: string | null;
  hoursThisWeek: number;
  presenceToday: boolean;
  absentToday: boolean;
  lateDaysThisWeek: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class EnterpriseService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private requestGraphql<T>(query: string, variables?: Record<string, unknown>): Observable<T> {
    return this.http
      .post<GraphqlResponse<T>>(GRAPHQL_ENDPOINT, { query, variables }, { withCredentials: true })
      .pipe(
        map((resp) => {
          if (resp.errors && resp.errors.length) {
            const m = resp.errors.map((e) => e.message).join(', ');
            throw new Error(m);
          }
          return (resp.data as T);
        })
      );
  }

  private USERS_QUERY = `
    query AllUsers {
      users {
        id
        firstName
        lastName
        email
        poste
      }
    }
  `;

  private TEAMS_QUERY = `
    query AllTeams {
      teams {
        id
        name
        members {
          id
        }
      }
    }
  `;

  private CLOCKS_QUERY = `
    query ClocksForUser($userId: ID!, $from: String!, $to: String!) {
      clocksForUser(userId: $userId, from: $from, to: $to) {
        id
        kind
        at
      }
    }
  `;

  private ABSENCES_QUERY = `
    query AbsencesByUser($userId: ID!) {
      absencesByUser(userId: $userId) {
        id
        userId
        startDate
        endDate
        status
        type
        reason
        days {
          absenceDate
          period
        }
      }
    }
  `;

  
  getAllEmployees(): Observable<EmployeeSimple[]> {
    return forkJoin({
      users: this.requestGraphql<UsersPayload>(this.USERS_QUERY).pipe(map(p => p?.users ?? []), catchError(() => of<GraphqlUser[]>([]))),
      teams: this.requestGraphql<TeamsPayload>(this.TEAMS_QUERY).pipe(map(p => p?.teams ?? []), catchError(() => of<GraphqlTeam[]>([]))),
    }).pipe(
      map(({ users, teams }) => {
        const teamMap = new Map<string, string>();
        for (const t of teams) {
          (t.members ?? []).forEach(m => {
            if (m?.id && !teamMap.has(m.id)) teamMap.set(m.id, t.name);
          });
        }
        return (users ?? []).map(u => ({
          id: u.id,
          name: buildDisplayName(u),
          email: u.email,
          poste: u.poste ?? undefined,
          team: teamMap.get(u.id) ?? undefined,
        }));
      }),
      catchError((err) => {
        console.warn('Erreur getAllEmployees', err);
        return of<EmployeeSimple[]>([]);
      })
    );
  }

  
  getCompanySummary(): Observable<CompanySummary> {
    const { from, to } = currentWeekRange();

    return this.getAllEmployees().pipe(
      switchMap((employees) => {
        if (!employees.length) {
          return of<CompanySummary>({
            totalEmployees: 0,
            presentToday: 0,
            absentToday: 0,
            lateToday: 0,
            totalHoursThisWeek: 0,
            averageHoursPerEmployee: 0,
            productivityRate: 0,
            presencePct: 0,
            absencePct: 0,
            latePct: 0,
          });
        }

        const loaders = employees.map((e) =>
          forkJoin({
            clocks: this.loadClocks(e.id, from, to),
            absences: this.loadAbsences(e.id),
          }).pipe(
            map(({ clocks, absences }) => {
              const clockStats = computeClockStats(clocks);
              const absenceStats = computeAbsenceStats(absences, from, to);
              return {
                id: e.id,
                name: e.name,
                hoursThisWeek: Math.round(clockStats.totalSeconds / 3600 * 100) / 100,
                presenceToday: absenceStats.absentToday ? false : clockStats.perDay.has(toDayKey(new Date())),
                absentToday: absenceStats.absentToday,
                lateDaysThisWeek: clockStats.lateDays.size,
                totalSeconds: clockStats.totalSeconds,
                absenceHours: absenceStats.absenceHours,
              };
            }),
            catchError((err) => {
              console.warn('Erreur load employee data', e.id, err);
              return of(null);
            })
          )
        );

        return forkJoin(loaders).pipe(
          map((rows) => {
            const valid = rows.filter(r => !!r) as Array<any>;
            const totalEmployees = valid.length;
            const presentToday = valid.filter(r => r.presenceToday).length;
            const absentToday = valid.filter(r => r.absentToday).length;
            const lateToday = valid.filter(r => r.lateDaysThisWeek > 0 && r.presenceToday).length;
            const totalHoursThisWeek = valid.reduce((s, r) => s + (r.hoursThisWeek || 0), 0);
            const averageHoursPerEmployee = totalEmployees ? +(totalHoursThisWeek / totalEmployees).toFixed(2) : 0;
            const totalWeekDays = countWeekdays(from, to);
            const totalPlannedHours = totalEmployees * totalWeekDays * 8;
            const productivityRate = totalPlannedHours ? Math.round((totalHoursThisWeek / totalPlannedHours) * 100) : 0;

            const presencePct = totalEmployees ? Math.round((presentToday / totalEmployees) * 100) : 0;
            const absencePct = totalEmployees ? Math.round((absentToday / totalEmployees) * 100) : 0;
            const latePct = totalEmployees ? Math.round((lateToday / totalEmployees) * 100) : 0;

            return {
              totalEmployees,
              presentToday,
              absentToday,
              lateToday,
              totalHoursThisWeek: Math.round(totalHoursThisWeek),
              averageHoursPerEmployee,
              productivityRate,
              presencePct,
              absencePct,
              latePct,
            } as CompanySummary;
          }),
          catchError((err) => {
            console.warn('Erreur agrégation company summary', err);
            return of<CompanySummary>({
              totalEmployees: employees.length,
              presentToday: 0,
              absentToday: 0,
              lateToday: 0,
              totalHoursThisWeek: 0,
              averageHoursPerEmployee: 0,
              productivityRate: 0,
              presencePct: 0,
              absencePct: 0,
              latePct: 0,
            });
          })
        );
      }),
      catchError((err) => {
        console.warn('Erreur getCompanySummary', err);
        return of<CompanySummary>({
          totalEmployees: 0,
          presentToday: 0,
          absentToday: 0,
          lateToday: 0,
          totalHoursThisWeek: 0,
          averageHoursPerEmployee: 0,
          productivityRate: 0,
          presencePct: 0,
          absencePct: 0,
          latePct: 0,
        });
      })
    );
  }

  
  getTeamComparative(kpi: 'absenteeism' | 'attendance' | 'productivity', months = 12): Observable<{ months: string[]; teams: string[]; data: Record<string, number[]> }> {
    return forkJoin({
      users: this.requestGraphql<UsersPayload>(this.USERS_QUERY).pipe(map(p => p?.users ?? []), catchError(() => of<GraphqlUser[]>([]))),
      teams: this.requestGraphql<TeamsPayload>(this.TEAMS_QUERY).pipe(map(p => p?.teams ?? []), catchError(() => of<GraphqlTeam[]>([]))),
    }).pipe(
      map(({ users, teams }) => {
        const teamNames = [...new Set(teams.map(t => t.name))];
        const monthsLabels = buildLastNMonths(months);
        const data: Record<string, number[]> = {};
        const teamMap = new Map<string, string>();
        for (const t of teams) {
          (t.members ?? []).forEach(m => {
            if (m?.id && !teamMap.has(m.id)) teamMap.set(m.id, t.name);
          });
        }

        teamNames.forEach(team => {
          data[team] = monthsLabels.map((label, idx) => {
            const monthIndex = (new Date().getMonth() - (months - 1 - idx) + 12) % 12;
            const teamUsers = users.filter(u => teamMap.get(u.id) === team);

            if (kpi === 'absenteeism') {
              const totalAbsences = teamUsers.reduce((sum, u) => {
                const userDays = (u as any).__historicPlaceholder ?? []; 
                return sum + 0;
              }, 0);
              return totalAbsences;
            }

            if (kpi === 'attendance') return 0;
            

            if (kpi === 'productivity') return 0;
            

            return 0;
          });
        });

        return { months: monthsLabels, teams: teamNames, data };
      }),
      catchError((err) => {
        console.warn('Erreur getTeamComparative', err);
        return of({ months: [], teams: [], data: {} });
      })
    );
  }

  getEmployeeDetail(userId: string): Observable<EmployeeDetail | null> {
    const { from, to } = currentWeekRange();

    return forkJoin({
      users: this.requestGraphql<UsersPayload>(this.USERS_QUERY).pipe(map(p => p?.users ?? []), catchError(() => of<GraphqlUser[]>([]))),
    }).pipe(
      switchMap(({ users }) => {
        const u = users.find(x => x.id === userId);
        if (!u) return of<EmployeeDetail | null>(null);

        return forkJoin({
          clocks: this.loadClocks(userId, from, to),
          absences: this.loadAbsences(userId),
        }).pipe(
          map(({ clocks, absences }) => {
            const stats = computeClockStats(clocks);
            const absenceInfo = computeAbsenceStats(absences, from, to);
            const totalWeekDays = countWeekdays(from, to);
            const expectedHours = totalWeekDays * 8;
            const expectedSeconds = expectedHours * 3600;

            const presencePct = expectedHours
              ? clampPct((stats.totalSeconds / 3600 / expectedHours) * 100)
              : 0;

            const absencePct = expectedHours
              ? clampPct((absenceInfo.absenceHours / expectedHours) * 100)
              : 0;

            const latenessPct = totalWeekDays
              ? clampPct((stats.lateDays.size / totalWeekDays) * 100, 0, 100)
              : 0;

            const sumPct = presencePct + absencePct + latenessPct;
            const scale = sumPct > 100 && sumPct > 0 ? 100 / sumPct : 1;

            const adjustedPresence = Math.round(presencePct * scale);
            const adjustedAbsence = Math.round(absencePct * scale);
            const adjustedLate = Math.max(0, 100 - adjustedPresence - adjustedAbsence);

            const status = deriveStatus({
              hasApprovedAbsenceToday: absenceInfo.absentToday,
              totalSeconds: stats.totalSeconds,
              expectedSeconds,
            });

            return {
              id: u.id,
              name: buildDisplayName(u),
              email: u.email,
              poste: u.poste,
              team: undefined,
              hoursThisWeek: Math.round(stats.totalSeconds / 3600),
              presenceToday: !absenceInfo.absentToday && stats.perDay.has(toDayKey(new Date())),
              absentToday: absenceInfo.absentToday,
              lateDaysThisWeek: stats.lateDays.size,
              status,
            } as EmployeeDetail;
          }),
          catchError((err) => {
            console.warn('Erreur getEmployeeDetail', err);
            return of<EmployeeDetail | null>(null);
          })
        );
      }),
      catchError((err) => {
        console.warn('Erreur getEmployeeDetail outer', err);
        return of<EmployeeDetail | null>(null);
      })
    );
  }

  private loadClocks(userId: string, from: Date, to: Date): Observable<GraphqlClock[]> {
    return this.requestGraphql<ClocksPayload>(this.CLOCKS_QUERY, {
      userId,
      from: from.toISOString(),
      to: to.toISOString(),
    }).pipe(
      map((payload) => (payload?.clocksForUser ?? [])),
      catchError((err) => {
        console.warn('Erreur récupération clocks', err);
        return of<GraphqlClock[]>([]);
      })
    );
  }

  private loadAbsences(userId: string): Observable<GraphqlAbsence[]> {
    return this.requestGraphql<AbsencesPayload>(this.ABSENCES_QUERY, { userId }).pipe(
      map((payload) => (payload?.absencesByUser ?? [])),
      catchError((err) => {
        console.warn('Erreur récupération absences', err);
        return of<GraphqlAbsence[]>([]);
      })
    );
  }
}


function buildDisplayName(user: GraphqlUser): string {
  const first = (user.firstName ?? '').trim();
  const last = (user.lastName ?? '').trim();
  const full = `${first} ${last}`.trim();
  return full || (user.email?.split('@')[0]) || user.id;
}

function dedupeById<T>(items: T[], pickId: (item: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    const id = pickId(item);
    if (!map.has(id)) {
      map.set(id, item);
    }
  }
  return Array.from(map.values());
}

function currentWeekRange(): { from: Date; to: Date } {
  const now = new Date();
  const from = startOfWeek(now);
  const to = new Date(from);
  to.setDate(from.getDate() + 7);
  return { from, to };
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay() || 7;
  if (day !== 1) d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function countWeekdays(from: Date, to: Date): number {
  const start = new Date(from);
  const end = new Date(to);
  let count = 0;
  while (start < end) {
    const day = start.getDay();
    if (day !== 0 && day !== 6) count += 1;
    start.setDate(start.getDate() + 1);
  }
  return count;
}

function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map((part) => Number(part));
  if ([y, m, d].some((part) => Number.isNaN(part))) return null;
  return new Date(y!, m! - 1, d!, 0, 0, 0, 0);
}

function computeClockStats(clocks: GraphqlClock[]) {
  const sorted = [...clocks].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const perDay = new Map<string, number>();
  const firstInPerDay = new Map<string, Date>();
  const lateDays = new Set<string>();
  let lastIn: Date | null = null;
  let lastInDay: string | null = null;

  for (const item of sorted) {
    const at = new Date(item.at);
    const dayKey = toDayKey(at);

    if (item.kind === 'IN') {
      lastIn = at;
      lastInDay = dayKey;
      if (!firstInPerDay.has(dayKey) || at < firstInPerDay.get(dayKey)!) {
        firstInPerDay.set(dayKey, at);
      }
    } else if (item.kind === 'OUT' && lastIn) {
      const duration = Math.max(0, at.getTime() - lastIn.getTime()) / 1000;
      const key = lastInDay ?? dayKey;
      perDay.set(key, (perDay.get(key) ?? 0) + duration);
      lastIn = null;
      lastInDay = null;
    }
  }

  const lateThresholdMinutes = 9 * 60 + 5;
  for (const [dayKey, firstIn] of firstInPerDay.entries()) {
    const minutes = firstIn.getHours() * 60 + firstIn.getMinutes();
    if (minutes > lateThresholdMinutes) {
      lateDays.add(dayKey);
    }
  }

  const totalSeconds = Array.from(perDay.values()).reduce((acc, seconds) => acc + seconds, 0);

  return { totalSeconds, perDay, lateDays };
}

function computeAbsenceStats(absences: GraphqlAbsence[], from: Date, to: Date) {
  const allowedStatuses = new Set(['APPROVED']);
  const windowStart = from.getTime();
  const windowEnd = to.getTime();
  let absenceUnits = 0;
  let absentToday = false;
  const todayKey = toDayKey(new Date());

  for (const absence of absences) {
    if (!allowedStatuses.has(absence.status)) continue;

    if (absence.days && absence.days.length) {
      for (const day of absence.days) {
        const date = parseDateOnly(day.absenceDate);
        if (!date) continue;
        const time = date.getTime();
        if (time < windowStart || time >= windowEnd) continue;

        const units = day.period === 'FULL_DAY' ? 1 : (day.period === 'AM' || day.period === 'PM' ? 0.5 : 0);
        absenceUnits += units;
        if (toDayKey(date) === todayKey && units >= 0.5) {
          absentToday = true;
        }
      }
      continue;
    }

    const start = parseDateOnly(absence.startDate ?? null);
    const end = parseDateOnly(absence.endDate ?? null);
    if (!start) continue;
    const last = end ?? start;
    const cursor = new Date(start);
    while (cursor <= last) {
      const time = cursor.getTime();
      if (time >= windowStart && time < windowEnd) {
        const isWeekend = cursor.getDay() === 0 || cursor.getDay() === 6;
        if (!isWeekend) {
          absenceUnits += 1;
          if (toDayKey(cursor) === todayKey) absentToday = true;
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const absenceHours = absenceUnits * 8;
  return { absenceHours, absentToday };
}

function deriveStatus(input: { hasApprovedAbsenceToday: boolean; totalSeconds: number; expectedSeconds: number; }): string {
  if (input.hasApprovedAbsenceToday) return 'Absent';
  if (!input.expectedSeconds) return 'En suivi';
  if (input.totalSeconds >= input.expectedSeconds * 1.1) return 'En depassement';
  if (input.totalSeconds >= input.expectedSeconds * 0.8) return 'A jour';
  return 'A surveiller';
}

function clampPct(value: number, min = 0, max = 100): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function buildLastNMonths(n: number): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString('fr-FR', { month: 'short' }));
  }
  return labels;
}
