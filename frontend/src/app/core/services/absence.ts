import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError, of } from 'rxjs';
import { environment } from '@environments/environment';
import { GraphqlError, GraphqlResponse, GraphqlRequestError } from '@shared/utils/graphql.utils';

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

const MY_TEAM_MEMBERS_QUERY = `
  query MyTeamMembers {
    myTeamMembers {
      teamId
      teamName
      members {
        id
        firstName
        lastName
        email
      }
    }
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

  private readonly GRAPHQL_ENDPOINT = environment.GRAPHQL_ENDPOINT;
  
  myAbsences(): Observable<Absence[]> {
    return this.graphql<MyAbsencesPayload>(MY_ABSENCES_QUERY).pipe(
      map((payload) => payload.myAbsences ?? [])
    );
  }

  myTeamAbsences(teamId?: string): Observable<Absence[]> {
    return this.graphql<MyTeamAbsencesPayload>(MY_TEAM_ABSENCES_QUERY, { teamId }).pipe(
      map((payload) => payload.myTeamAbsences ?? [])
    );
  }

  teamAbsences(teamId: string): Observable<Absence[]> {
    return this.graphql<TeamAbsencesPayload>(TEAM_ABSENCES_QUERY, { teamId }).pipe(
      map((payload) => payload.teamAbsences ?? [])
    );
  }

  createAbsence(input: AbsenceCreateInput): Observable<Absence> {
    return this.graphql<CreateAbsencePayload>(CREATE_ABSENCE_MUTATION, { input }).pipe(
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
      map((payload) => payload.deleteAbsence ?? false)
    );
  }

  getAllUsers(): Observable<Map<string, { firstName?: string; lastName?: string; email?: string }>> {
    if (this.usersCache) {
      return of(this.usersCache);
    }

    type MyTeamMembersPayload = {
      myTeamMembers: Array<{
        teamId: string;
        teamName: string;
        members: Array<{
          id: string;
          firstName?: string;
          lastName?: string;
          email?: string;
        }>;
      }>;
    };

    return this.graphql<MyTeamMembersPayload>(MY_TEAM_MEMBERS_QUERY).pipe(
      map((payload) => {
        const groups = payload?.myTeamMembers ?? [];
        const userMap = new Map<string, { firstName?: string; lastName?: string; email?: string }>();
        
        for (const group of groups) {
          for (const user of group.members) {
            userMap.set(user.id, {
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
            });
          }
        }
        
        this.usersCache = userMap;
        return userMap;
      })
    );
  }

  getAllUsersForAdmin(): Observable<Map<string, { firstName?: string; lastName?: string; email?: string }>> {
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
        this.GRAPHQL_ENDPOINT,
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
