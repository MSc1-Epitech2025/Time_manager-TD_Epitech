import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

import { AuthService } from './auth';
import { environment } from '@environments/environment';

const GRAPHQL_ENDPOINT = environment.GRAPHQL_ENDPOINT;

type GraphqlError = { message: string };

type AbsenceResponse = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: string;
  type: string;
  reason?: string;
  days?: { absenceDate: string; period: 'FULL_DAY' | 'AM' | 'PM' }[] | null;
};

type TeamResponse = {
  id: string;
  name: string;
  members: { id: string; firstName: string; lastName: string }[];
};

type GraphqlPayload<T> = { data: T; errors?: GraphqlError[] };

type MyAbsencesPayload = { myAbsences: AbsenceResponse[] };
type MyTeamAbsencesPayload = { myTeamAbsences: AbsenceResponse[] };
type ManagedTeamsPayload = { myManagedTeams: TeamResponse[] };

export interface PlanningPerson {
  id: string;
  name: string;
  teamId?: string;
  teamName?: string;
}

export interface PlanningEvent {
  id: string;
  userId: string;
  userName: string;
  date: string;
  period: 'FULL_DAY' | 'AM' | 'PM';
  status: string;
  type: string;
  reason?: string;
}

export interface PlanningPayload {
  people: PlanningPerson[];
  events: PlanningEvent[];
}

@Injectable({ providedIn: 'root' })
export class PlanningService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  getEmployeePlanning(): Observable<PlanningPayload> {
    return this.request<MyAbsencesPayload>(MY_ABSENCES_QUERY).pipe(
      map((payload) => payload?.myAbsences ?? []),
      map((absences) => {
        const session = this.auth.session;
        const person: PlanningPerson = {
          id: session?.user.id ?? '',
          name: session?.user.fullName ?? session?.user.email ?? 'Moi',
        };
        const events = absences.flatMap((absence) =>
          expandAbsence(absence, person.name)
        );
        return { people: [person], events };
      }),
      catchError((err) => {
        console.warn('Unable to load employee planning', err);
        const session = this.auth.session;
        const person: PlanningPerson = {
          id: session?.user.id ?? '',
          name: session?.user.fullName ?? session?.user.email ?? 'Moi',
        };
        return of({ people: [person], events: [] });
      })
    );
  }

  getManagerPlanning(teamId?: number | null): Observable<PlanningPayload> {
    const variables = { teamId: teamId ?? null };

    return forkJoin({
      teams: this.request<ManagedTeamsPayload>(MY_MANAGED_TEAMS_QUERY).pipe(
        map((payload) => payload?.myManagedTeams ?? []),
        catchError((err) => {
          console.warn('Unable to load teams', err);
          return of<TeamResponse[]>([]);
        })
      ),
      absences: this.request<MyTeamAbsencesPayload>(MY_TEAM_ABSENCES_QUERY, variables).pipe(
        map((payload) => payload?.myTeamAbsences ?? []),
        catchError((err) => {
          console.warn('Unable to load team absences', err);
          return of<AbsenceResponse[]>([]);
        })
      ),
    }).pipe(
      map(({ teams, absences }) => {
        const memberMap = new Map<string, PlanningPerson>();

        for (const team of teams) {
          for (const member of team.members ?? []) {
            if (!memberMap.has(member.id)) {
              memberMap.set(member.id, {
                id: member.id,
                name: buildDisplayName(member.firstName, member.lastName, member.id),
                teamId: team.id,
                teamName: team.name,
              });
            }
          }
        }

        const events: PlanningEvent[] = absences.flatMap((absence) => {
          const person = memberMap.get(absence.userId);
          const name = person?.name ?? absence.userId;
          return expandAbsence(absence, name);
        });

        const people = Array.from(memberMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        return { people, events };
      })
    );
  }

  private request<T>(query: string, variables?: Record<string, unknown>): Observable<T> {
    return this.http
      .post<GraphqlPayload<T>>(GRAPHQL_ENDPOINT, { query, variables }, { withCredentials: true })
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
}

const MY_ABSENCES_QUERY = `
  query MyAbsences {
    myAbsences {
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

const MY_MANAGED_TEAMS_QUERY = `
  query MyManagedTeams {
    myManagedTeams {
      id
      name
      members {
        id
        firstName
        lastName
      }
    }
  }
`;

const MY_TEAM_ABSENCES_QUERY = `
  query MyTeamAbsences($teamId: Long) {
    myTeamAbsences(teamId: $teamId) {
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

function expandAbsence(absence: AbsenceResponse, userName: string): PlanningEvent[] {
  const days = absence.days ?? [];
  if (days.length) {
    return days.map((day) => ({
      id: `${absence.id}_${day.absenceDate}`,
      userId: absence.userId,
      userName,
      date: day.absenceDate,
      period: day.period ?? 'FULL_DAY',
      status: absence.status,
      type: absence.type,
      reason: absence.reason ?? undefined,
    }));
  }

  const start = parseDate(absence.startDate) ?? new Date();
  const end = parseDate(absence.endDate) ?? start;
  const events: PlanningEvent[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    events.push({
      id: `${absence.id}_${toDateKey(cursor)}`,
      userId: absence.userId,
      userName,
      date: toDateKey(cursor),
      period: 'FULL_DAY',
      status: absence.status,
      type: absence.type,
      reason: absence.reason ?? undefined,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return events;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parts = value.split('-').map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildDisplayName(first: string | undefined, last: string | undefined, fallback: string): string {
  const fn = first?.trim() ?? '';
  const ln = last?.trim() ?? '';
  const full = `${fn} ${ln}`.trim();
  return full || fallback;
}

