import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError, of } from 'rxjs';

const GRAPHQL_ENDPOINT = 'http://localhost:8030/graphql';

type GraphqlError = {
  message: string;
  extensions?: {
    code?: string;
    classification?: string;
    [key: string]: unknown;
  };
};

type GraphqlResponse<T> = {
  data: T;
  errors?: GraphqlError[];
};

export class GraphqlRequestError extends Error {
  constructor(
    public readonly operationName: string | undefined,
    public readonly errors: GraphqlError[]
  ) {
    super(GraphqlRequestError.composeMessage(operationName, errors));
    this.name = 'GraphqlRequestError';
  }

  private static composeMessage(operationName: string | undefined, errors: GraphqlError[]): string {
    const prefix = `[GraphQL:${operationName ?? 'unknown'}]`;
    const message = errors
      .map((error) => error.message)
      .filter((msg) => typeof msg === 'string' && msg.trim().length > 0)
      .join(', ');
    return `${prefix} ${message || 'Unexpected error'}`;
  }
}

export type AbsenceType = 'SICK' | 'VACATION' | 'PERSONAL' | 'FORMATION' | 'OTHER' | 'RTT';
export type AbsenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AbsencePeriod = 'AM' | 'PM' | 'FULL_DAY';

export interface AbsenceDay {
  id: string;
  absenceDate: string;
  period: AbsencePeriod;
  startTime?: string;
  endTime?: string;
}

export interface Absence {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: AbsenceType;
  reason?: string;
  supportingDocumentUrl?: string;
  status: AbsenceStatus;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  days: AbsenceDay[];
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface PeriodByDateInput {
  date: string;
  period: AbsencePeriod;
}

export interface AbsenceCreateInput {
  startDate: string;
  endDate: string;
  type: AbsenceType;
  reason?: string;
  supportingDocumentUrl?: string;
  periodByDate?: PeriodByDateInput[];
}

export interface AbsenceUpdateInput {
  startDate?: string;
  endDate?: string;
  type?: AbsenceType;
  reason?: string;
  supportingDocumentUrl?: string;
  periodByDate?: PeriodByDateInput[];
}

export interface AbsenceStatusUpdateInput {
  status: AbsenceStatus;
}

type MyAbsencesPayload = { myAbsences: Absence[] };
type MyTeamAbsencesPayload = { myTeamAbsences: Absence[] };
type TeamAbsencesPayload = { teamAbsences: Absence[] };
type CreateAbsencePayload = { createAbsence: Absence };
type UpdateAbsencePayload = { updateAbsence: Absence };
type SetAbsenceStatusPayload = { setAbsenceStatus: Absence };
type DeleteAbsencePayload = { deleteAbsence: boolean };

const MY_ABSENCES_QUERY = `
  query MyAbsences {
    myAbsences {
      id
      userId
      startDate
      endDate
      type
      reason
      supportingDocumentUrl
      status
      approvedBy
      approvedAt
      createdAt
      updatedAt
      days {
        id
        absenceDate
        period
        startTime
        endTime
      }
    }
  }
`;

const MY_TEAM_ABSENCES_QUERY = `
  query MyTeamAbsences($teamId: ID) {
    myTeamAbsences(teamId: $teamId) {
      id
      userId
      startDate
      endDate
      type
      reason
      supportingDocumentUrl
      status
      approvedBy
      approvedAt
      createdAt
      updatedAt
      days {
        id
        absenceDate
        period
        startTime
        endTime
      }
    }
  }
`;

const TEAM_ABSENCES_QUERY = `
  query TeamAbsences($teamId: ID!) {
    teamAbsences(teamId: $teamId) {
      id
      userId
      startDate
      endDate
      type
      reason
      supportingDocumentUrl
      status
      approvedBy
      approvedAt
      createdAt
      updatedAt
      days {
        id
        absenceDate
        period
        startTime
        endTime
      }
    }
  }
`;

const CREATE_ABSENCE_MUTATION = `
  mutation CreateAbsence($input: AbsenceCreateInput!) {
    createAbsence(input: $input) {
      id
      userId
      startDate
      endDate
      type
      reason
      supportingDocumentUrl
      status
      createdAt
      updatedAt
      days {
        id
        absenceDate
        period
        startTime
        endTime
      }
    }
  }
`;

const UPDATE_ABSENCE_MUTATION = `
  mutation UpdateAbsence($id: ID!, $input: AbsenceUpdateInput!) {
    updateAbsence(id: $id, input: $input) {
      id
      userId
      startDate
      endDate
      type
      reason
      supportingDocumentUrl
      status
      updatedAt
      days {
        id
        absenceDate
        period
        startTime
        endTime
      }
    }
  }
`;

const SET_ABSENCE_STATUS_MUTATION = `
  mutation SetAbsenceStatus($id: ID!, $input: AbsenceStatusUpdateInput!) {
    setAbsenceStatus(id: $id, input: $input) {
      id
      status
      approvedBy
      approvedAt
      updatedAt
    }
  }
`;

const DELETE_ABSENCE_MUTATION = `
  mutation DeleteAbsence($id: ID!) {
    deleteAbsence(id: $id)
  }
`;

const ALL_USERS_QUERY = `
  query AllUsers {
    users {
      id
      firstName
      lastName
      email
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class AbsenceService {
  private usersCache: Map<string, { firstName?: string; lastName?: string; email?: string }> | null = null;

  constructor(private readonly http: HttpClient) {}

  myAbsences(): Observable<Absence[]> {
    return this.graphql<MyAbsencesPayload>(MY_ABSENCES_QUERY).pipe(
      tap((payload) => console.debug('[AbsenceService] myAbsences payload', payload)),
      map((payload) => payload.myAbsences ?? [])
    );
  }

  myTeamAbsences(teamId?: string): Observable<Absence[]> {
    return this.graphql<MyTeamAbsencesPayload>(MY_TEAM_ABSENCES_QUERY, { teamId }).pipe(
      tap((payload) => console.debug('[AbsenceService] myTeamAbsences payload', payload)),
      map((payload) => payload.myTeamAbsences ?? [])
    );
  }

  teamAbsences(teamId: string): Observable<Absence[]> {
    return this.graphql<TeamAbsencesPayload>(TEAM_ABSENCES_QUERY, { teamId }).pipe(
      tap((payload) => console.debug('[AbsenceService] teamAbsences payload', payload)),
      map((payload) => payload.teamAbsences ?? [])
    );
  }

  createAbsence(input: AbsenceCreateInput): Observable<Absence> {
    return this.graphql<CreateAbsencePayload>(CREATE_ABSENCE_MUTATION, { input }).pipe(
      tap((payload) => console.debug('[AbsenceService] createAbsence payload', payload)),
      map((payload) => {
        if (!payload.createAbsence) {
          throw new Error('Create absence returned no data');
        }
        return payload.createAbsence;
      })
    );
  }

  updateAbsence(id: string, input: AbsenceUpdateInput): Observable<Absence> {
    return this.graphql<UpdateAbsencePayload>(UPDATE_ABSENCE_MUTATION, { id, input }).pipe(
      tap((payload) => console.debug('[AbsenceService] updateAbsence payload', payload)),
      map((payload) => {
        if (!payload.updateAbsence) {
          throw new Error('Update absence returned no data');
        }
        return payload.updateAbsence;
      })
    );
  }

  setAbsenceStatus(id: string, input: AbsenceStatusUpdateInput): Observable<Absence> {
    return this.graphql<SetAbsenceStatusPayload>(SET_ABSENCE_STATUS_MUTATION, { id, input }).pipe(
      tap((payload) => console.debug('[AbsenceService] setAbsenceStatus payload', payload)),
      map((payload) => {
        if (!payload.setAbsenceStatus) {
          throw new Error('Set absence status returned no data');
        }
        return payload.setAbsenceStatus;
      })
    );
  }

  deleteAbsence(id: string): Observable<boolean> {
    return this.graphql<DeleteAbsencePayload>(DELETE_ABSENCE_MUTATION, { id }).pipe(
      tap((payload) => console.debug('[AbsenceService] deleteAbsence payload', payload)),
      map((payload) => payload.deleteAbsence ?? false)
    );
  }

  getAllUsers(): Observable<Map<string, { firstName?: string; lastName?: string; email?: string }>> {
    if (this.usersCache) {
      return of(this.usersCache);
    }

    type AllUsersPayload = {
      users: Array<{
        id: string;
        firstName?: string;
        lastName?: string;
        email?: string;
      }>;
    };

    return this.graphql<AllUsersPayload>(ALL_USERS_QUERY).pipe(
      map((payload) => {
        const users = payload?.users ?? [];
        const userMap = new Map<string, { firstName?: string; lastName?: string; email?: string }>();
        for (const user of users) {
          userMap.set(user.id, {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          });
        }
        this.usersCache = userMap;
        return userMap;
      })
    );
  }

  getUserById(userId: string): Observable<{ firstName?: string; lastName?: string; email?: string } | null> {
    return this.getAllUsers().pipe(
      map((userMap) => userMap.get(userId) ?? null)
    );
  }

  private graphql<T>(query: string, variables?: Record<string, unknown>): Observable<T> {
    return this.http
      .post<GraphqlResponse<T>>(
        GRAPHQL_ENDPOINT,
        { query, variables },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          if (response.errors?.length) {
            console.error('[AbsenceService] GraphQL errors', {
              errors: response.errors,
              query,
              variables,
            });
          }
        }),
        catchError((httpError) => {
          console.error('[AbsenceService] GraphQL HTTP error', { httpError, query, variables });
          return throwError(() => httpError);
        }),
        map((response) => {
          if (response.errors?.length) {
            throw new GraphqlRequestError(undefined, response.errors);
          }
          if (!response.data) {
            throw new GraphqlRequestError(undefined, [
              { message: 'GraphQL response without data' },
            ]);
          }
          return response.data;
        })
      );
  }
}
