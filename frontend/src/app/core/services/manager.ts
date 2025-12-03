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
import { environment } from '@environments/environment';
import { currentWeekRange } from '@shared/utils/date.utils';

const GRAPHQL_ENDPOINT = environment.GRAPHQL_ENDPOINT;
type ClockKind = 'IN' | 'OUT';

type GraphqlError = { message: string };

type GraphqlResponse<T> = {
  data: T;
  errors?: GraphqlError[];
};

type GraphqlUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  poste?: string;
};

type GraphqlTeam = {
  id: string;
  name: string;
  members: GraphqlUser[];
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
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  type: string;
  reason?: string;
  days?: GraphqlAbsenceDay[] | null;
};

type ClockQueryPayload = { clocksForUser: GraphqlClock[] };
type AbsenceQueryPayload = { absencesByUser: GraphqlAbsence[] };
type MyTeamMembersPayload = { myTeamMembers: GraphqlUser[] };
type MyTeamsPayload = { myTeams: GraphqlTeam[] };

export interface EmployeeSummary {
  id: string;
  name: string;
  email: string;
  poste?: string;
  team?: string;
  hoursThisWeek: number;
  status: string;
  presence: number;
  late: number;
  absence: number;
}

export interface EmployeeKpi {
  id: string;
  name: string;
  team?: string;
  presence: number;
  late: number;
  absent: number;
  hours: number;
}

interface TeamMemberEntry {
  member: GraphqlUser;
  teamName?: string;
}

@Injectable({ providedIn: 'root' })
export class ManagerService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  getTeamEmployees(): Observable<EmployeeSummary[]> {
    return this.loadManagedMembers().pipe(
      switchMap((members) => {
        if (!members.length) return of<EmployeeSummary[]>([]);
        const summaries = members.map((entry) =>
          this.buildEmployeeSummary(entry).pipe(
            catchError((err) => {
              console.warn('Unable to load employee data', err);
              return of<EmployeeSummary | null>(null);
            })
          )
        );
        return forkJoin(summaries).pipe(
          map((rows) =>
            rows.filter((row): row is EmployeeSummary => !!row)
          )
        );
      })
    );
  }

  getTeamEmployeesByTeamId(teamId: string): Observable<EmployeeSummary[]> {
    return this.requestGraphql<{ team: GraphqlTeam | null }>(TEAM_MEMBERS_BY_ID_QUERY, {
      teamId,
    }).pipe(
      switchMap((payload) => {
        const team = payload?.team;
        if (!team || !team.members?.length) return of<EmployeeSummary[]>([]);

        const members = team.members;
        const teamName = team.name;
        const entries: TeamMemberEntry[] = members.map((member) => ({
          member,
          teamName,
        }));

        const summaries = entries.map((entry) =>
          this.buildEmployeeSummary(entry).pipe(
            catchError((err) => {
              console.warn('Unable to load employee data', err);
              return of<EmployeeSummary | null>(null);
            })
          )
        );

        return forkJoin(summaries).pipe(
          map((rows) =>
            rows.filter((row): row is EmployeeSummary => !!row)
          )
        );
      }),
      catchError((err) => {
        console.error('Error loading team members', err);
        return of<EmployeeSummary[]>([]);
      })
    );
  }

  getEmployeeKpi(userId: string): Observable<EmployeeKpi | null> {
    return this.findMemberEntry(userId).pipe(
      switchMap((entry) => {
        if (!entry) return of<EmployeeKpi | null>(null);
        return this.buildEmployeeSummary(entry).pipe(
          map((summary) => ({
            id: summary.id,
            name: summary.name,
            team: summary.team,
            presence: summary.presence,
            late: summary.late,
            absent: summary.absence,
            hours: summary.hoursThisWeek,
          })),
          catchError(() => of<EmployeeKpi | null>(null))
        );
      })
    );
  }

  listManagedMembers(): Observable<Array<{ id: string; name: string; team?: string }>> {
    return this.loadManagedMembers().pipe(
      map((entries) =>
        entries.map((entry) => ({
          id: entry.member.id,
          name: buildDisplayName(entry.member),
          team: entry.teamName,
        }))
      )
    );
  }

  private findMemberEntry(userId: string): Observable<TeamMemberEntry | null> {
    return this.loadManagedMembers().pipe(
      map((entries) => entries.find((entry) => entry.member.id === userId)),
      switchMap((entry) => (entry ? of(entry) : of<TeamMemberEntry | null>(null)))
    );
  }

  private buildEmployeeSummary(entry: TeamMemberEntry): Observable<EmployeeSummary> {
    const { member, teamName } = entry;
    const { from, to } = currentWeekRange();
    return forkJoin({
      clocks: this.loadClocks(member.id, from, to),
      absences: this.loadAbsences(member.id),
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
        const scale =
          sumPct > 100 && sumPct > 0 ? 100 / sumPct : 1;

        const adjustedPresence = Math.round(presencePct * scale);
        const adjustedAbsence = Math.round(absencePct * scale);
        const adjustedLate = Math.max(0, 100 - adjustedPresence - adjustedAbsence);

        const status = deriveStatus({
          hasApprovedAbsenceToday: absenceInfo.absentToday,
          totalSeconds: stats.totalSeconds,
          expectedSeconds,
        });

        return {
          id: member.id,
          name: buildDisplayName(member),
          email: member.email,
          poste: member.poste,
          team: teamName,
          hoursThisWeek: Math.round(stats.totalSeconds / 3600),
          status,
          presence: adjustedPresence,
          late: adjustedLate,
          absence: adjustedAbsence,
        };
      })
    );
  }

  private loadManagedMembers(): Observable<TeamMemberEntry[]> {
    const mapToEntries = (members: GraphqlUser[], teamNames?: Map<string, string>) => {
      const currentId = this.currentUserId();
      return dedupeById(
        members.map((member) => ({
          member,
          teamName: teamNames?.get(member.id),
        })),
        (entry) => entry.member.id
      ).filter((entry) => !currentId || entry.member.id !== currentId);
    };

    const fallback$ = of<TeamMemberEntry[]>([]);

    return this.requestGraphql<MyTeamMembersPayload>(MY_TEAM_MEMBERS_QUERY).pipe(
      switchMap((payload) => {
        const members = payload?.myTeamMembers ?? [];
        if (!members.length) {
          return fallback$;
        }

        return this.requestGraphql<MyTeamsPayload>(MY_TEAMS_QUERY).pipe(
          map((teamsPayload) => {
            const teams = teamsPayload?.myTeams ?? [];
            const teamNames = new Map<string, string>();

            for (const team of teams) {
              const teamMembers = team.members ?? [];
              for (const member of teamMembers) {
                if (!teamNames.has(member.id)) {
                  teamNames.set(member.id, team.name);
                }
              }
            }

            return mapToEntries(members, teamNames);
          }),
          catchError(() => of(mapToEntries(members)))
        );
      }),
      catchError(() => fallback$)
    );
  }

  private loadClocks(userId: string, from: Date, to: Date): Observable<GraphqlClock[]> {
    return this.requestGraphql<ClockQueryPayload>(CLOCKS_QUERY, {
      userId,
      from: from.toISOString(),
      to: to.toISOString(),
    }).pipe(
      map((payload) => payload?.clocksForUser ?? []),
      catchError((err) => {
        console.warn('Error retrieving clocks', err);
        return of<GraphqlClock[]>([]);
      })
    );
  }

  private loadAbsences(userId: string): Observable<GraphqlAbsence[]> {
    return this.requestGraphql<AbsenceQueryPayload>(ABSENCES_QUERY, { userId }).pipe(
      map((payload) => payload?.absencesByUser ?? []),
      catchError((err) => {
        console.warn('Error retrieving absences', err);
        return of<GraphqlAbsence[]>([]);
      })
    );
  }

  private requestGraphql<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Observable<T> {
    return this.http
      .post<GraphqlResponse<T>>(GRAPHQL_ENDPOINT, { query, variables }, { withCredentials: true })
      .pipe(
        map((response) => {
          if (response.errors?.length) {
            const message = response.errors.map((e) => e.message).join(', ');
            throw new Error(message);
          }
          return response.data;
        })
      );
  }

  private currentUserId(): string | null {
    return this.auth.session?.user?.id ?? null;
  }
}


const MY_TEAM_MEMBERS_QUERY = `
  query MyTeamMembers {
    myTeamMembers {
      id
      firstName
      lastName
      email
      poste
    }
  }
`;

const MY_TEAMS_QUERY = `
  query MyTeams {
    myTeams {
      id
      name
      members {
        id
      }
    }
  }
`;

const CLOCKS_QUERY = `
  query ClocksForUser($userId: ID!, $from: String!, $to: String!) {
    clocksForUser(userId: $userId, from: $from, to: $to) {
      id
      kind
      at
    }
  }
`;

const ABSENCES_QUERY = `
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

const TEAM_MEMBERS_BY_ID_QUERY = `
  query Team($teamId: ID!) {
    team(id: $teamId) {
      id
      name
      members {
        id
        firstName
        lastName
        email
        poste
      }
    }
  }
`;

function buildDisplayName(user: GraphqlUser ): string {
  const first = user.firstName?.trim() ?? '';
  const last = user.lastName?.trim() ?? '';
  const full = `${first} ${last}`.trim();
  return full || user.email?.split('@')[0] || user.id;
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
  const sorted = [...clocks].sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at)
  );
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

  const totalSeconds = Array.from(perDay.values()).reduce(
    (acc, seconds) => acc + seconds,
    0
  );

  return { totalSeconds, perDay, lateDays };
}

function computeAbsenceStats(
  absences: GraphqlAbsence[],
  from: Date,
  to: Date
) {
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

        const units =
          day.period === 'FULL_DAY'
            ? 1
            : day.period === 'AM' || day.period === 'PM'
              ? 0.5
              : 0;
        absenceUnits += units;
        if (toDayKey(date) === todayKey && units >= 0.5) {
          absentToday = true;
        }
      }
      continue;
    }

    const start = parseDateOnly(absence.startDate);
    const end = parseDateOnly(absence.endDate);
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

function deriveStatus(input: {
  hasApprovedAbsenceToday: boolean;
  totalSeconds: number;
  expectedSeconds: number;
}): string {
  if (input.hasApprovedAbsenceToday) return 'Absent';
  if (!input.expectedSeconds) return 'Under Review';
  if (input.totalSeconds >= input.expectedSeconds * 1.1) return 'Overtime';
  if (input.totalSeconds >= input.expectedSeconds * 0.8) return 'On Track';
  return 'Needs Attention';
}

function clampPct(value: number, min = 0, max = 100): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}
