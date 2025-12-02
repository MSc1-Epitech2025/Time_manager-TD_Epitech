import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError, forkJoin, of } from 'rxjs';
import { environment } from '@environments/environment';

const GRAPHQL_ENDPOINT = environment.GRAPHQL_ENDPOINT;

type GraphqlError = {
  message: string;
  extensions?: {
    code?: string;
    classification?: string;
    errorType?: string;
    [key: string]: unknown;
  };
};

type GraphqlResponse<T> = {
  data: T;
  errors?: GraphqlError[];
};

const AUTH_ERROR_PATTERNS = [
  /forbidden/i,
  /unauthori[sz]ed/i,
  /access denied/i,
  /not allowed/i,
  /requires .*admin/i,
  /requires .*manager/i,
];

const AUTH_ERROR_CODES = new Set(['FORBIDDEN', 'UNAUTHORIZED', 'ACCESS_DENIED', 'UNAUTHENTICATED', 'ACCESSDENIED']);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const looksLikeAuthorizationError = (error: GraphqlError): boolean => {
  if (!error) return false;
  if (AUTH_ERROR_PATTERNS.some((pattern) => pattern.test(error.message ?? ''))) {
    return true;
  }

  const extensions = error.extensions;
  if (!extensions || typeof extensions !== 'object') return false;

  const extensionRecord = extensions as Record<string, unknown>;
  const extensionValues = ['code', 'classification', 'errorType', 'error_code']
    .map((key) => extensionRecord[key])
    .filter(isNonEmptyString);

  return extensionValues.some((value) => AUTH_ERROR_CODES.has(value.toUpperCase()));
};

const isAuthorizationGraphqlResponse = (errors: GraphqlError[]): boolean =>
  errors.length > 0 && errors.every(looksLikeAuthorizationError);

export class GraphqlRequestError extends Error {
  constructor(
    public readonly operationName: string | undefined,
    public readonly errors: GraphqlError[],
    public readonly isAuthorizationError: boolean
  ) {
    super(GraphqlRequestError.composeMessage(operationName, errors));
    this.name = 'GraphqlRequestError';
  }

  private static composeMessage(operationName: string | undefined, errors: GraphqlError[]): string {
    const prefix = `[GraphQL:${operationName ?? 'unknown'}]`;
    const message = errors
      .map((error) => error.message)
      .filter(isNonEmptyString)
      .join(', ');
    return `${prefix} ${message || 'Unexpected error'}`;
  }
}

export const isGraphqlAuthorizationError = (error: unknown): boolean =>
  error instanceof GraphqlRequestError && error.isAuthorizationError;

type GraphqlUser = {
  id: string | number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

type GraphqlTeam = {
  id: string | number;
  name: string;
  description?: string | null;
  members?: GraphqlUser[] | null;
};

type AllTeamsQueryPayload = { allTeams: GraphqlTeam[] };
type TeamsQueryPayload = { teams: GraphqlTeam[] };
type GetTeamPayload = { team: GraphqlTeam | null };
type TeamMembersPayload = { teamMembers: GraphqlUser[] };
type CreateTeamPayload = { createTeam: GraphqlTeam };
type UpdateTeamPayload = { updateTeam: GraphqlTeam };
type DeleteTeamPayload = { deleteTeam: boolean };
type AddMemberPayload = { addTeamMember: boolean };
type RemoveMemberPayload = { removeTeamMember: boolean };
type MyManagedTeamsPayload = { myManagedTeams: GraphqlTeam[] };
type MyTeamsPayload = { myTeams: GraphqlTeam[] };
type AllUsersPayload = { users: GraphqlUser[] };

type TeamMembersGroup = {
  teamId: string | number;
  teamName: string;
  members: GraphqlUser[];
};

type MyTeamMembersPayload = { myTeamMembers: TeamMembersGroup[] };

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
}

export interface CreateTeamInput {
  name: string;
  description?: string | null;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  constructor(private readonly http: HttpClient) {}

  listAllTeams(): Observable<Team[]> {
    return this.requestGraphql<AllTeamsQueryPayload>(ALL_TEAMS_QUERY, undefined, 'AllTeams').pipe(
      tap((payload) => {
        console.debug('[TeamService] allTeams payload', payload);
      }),
      map((payload) => {
        const teams = payload?.allTeams ?? [];
        return teams.map((team) => this.mapTeam(team));
      })
    );
  }

  listTeams(): Observable<Team[]> {
    return this.requestGraphql<TeamsQueryPayload>(TEAMS_QUERY, undefined, 'Teams').pipe(
      tap((payload) => {
        console.debug('[TeamService] teams payload', payload);
      }),
      map((payload) => {
        const teams = payload?.teams ?? [];
        return teams.map((team) => this.mapTeam(team));
      })
    );
  }

  populateTeamsWithMembers(teams: Team[]): Observable<Team[]> {
    if (!teams.length) return of([]);

    const requests = teams.map((team) =>
      this.getTeamMembers(team.id).pipe(
        catchError((error) => {
          if (isGraphqlAuthorizationError(error)) {
            console.info('[TeamService] Team members not accessible with current permissions', {
              teamId: team.id,
            });
            return of<TeamMember[]>([]);
          }
          console.warn('[TeamService] Failed to load members for team', team.id, error);
          return of<TeamMember[]>([]);
        }),
        map((members) => ({
          ...team,
          members,
        }))
      )
    );

    return forkJoin(requests);
  }

  listManagedTeams(): Observable<Team[]> {
    return this.requestGraphql<MyManagedTeamsPayload>(MY_MANAGED_TEAMS_QUERY, undefined, 'MyManagedTeams').pipe(
      tap((payload) => {
        console.debug('[TeamService] myManagedTeams payload', payload);
      }),
      map((payload) => {
        const teams = payload?.myManagedTeams ?? [];
        return teams.map((team) => this.mapTeam(team));
      })
    );
  }

  listMyTeams(): Observable<Team[]> {
    return this.requestGraphql<MyTeamsPayload>(MY_TEAMS_QUERY, undefined, 'MyTeams').pipe(
      tap((payload) => {
        console.debug('[TeamService] myTeams payload', payload);
      }),
      map((payload) => {
        const teams = payload?.myTeams ?? [];
        return teams.map((team) => this.mapTeam(team));
      })
    );
  }

  getTeam(id: string): Observable<Team> {
    return this.requestGraphql<GetTeamPayload>(TEAM_QUERY, { id }, 'Team').pipe(
      tap((payload) => {
        console.debug('[TeamService] team payload', payload);
      }),
      map((payload) => {
        const team = payload?.team;
        if (!team) {
          throw new Error('Equipe introuvable');
        }
        return this.mapTeam(team);
      })
    );
  }

  getTeamMembers(teamId: string): Observable<TeamMember[]> {
    return this.requestGraphql<TeamMembersPayload>(TEAM_MEMBERS_QUERY, { teamId }, 'TeamMembers').pipe(
      tap((payload) => {
        console.debug('[TeamService] teamMembers payload', payload);
      }),
      map((payload) => {
        const members = payload?.teamMembers ?? [];
        return members.map((member) => ({
          id: String(member.id),
          name: this.buildMemberName(member),
          email: member.email ?? undefined,
        }));
      })
    );
  }

  createTeam(input: CreateTeamInput): Observable<Team> {
    return this.requestGraphql<CreateTeamPayload>(
      CREATE_TEAM_MUTATION,
      {
        input: {
          name: input.name,
          description: input.description ?? null,
        },
      },
      'CreateTeam'
    ).pipe(
      tap((payload) => {
        console.debug('[TeamService] createTeam payload', payload);
      }),
      map((payload) => this.mapTeam(payload.createTeam))
    );
  }

  updateTeam(id: string, input: UpdateTeamInput): Observable<Team> {
    return this.requestGraphql<UpdateTeamPayload>(
      UPDATE_TEAM_MUTATION,
      {
        input: {
          id,
          name: input.name,
          description: input.description ?? null,
        },
      },
      'UpdateTeam'
    ).pipe(
      tap((payload) => {
        console.debug('[TeamService] updateTeam payload', payload);
      }),
      map((payload) => this.mapTeam(payload.updateTeam))
    );
  }

  deleteTeam(id: string): Observable<boolean> {
    return this.requestGraphql<DeleteTeamPayload>(DELETE_TEAM_MUTATION, { id }, 'DeleteTeam').pipe(
      tap((payload) => {
        console.debug('[TeamService] deleteTeam payload', payload);
      }),
      map((payload) => payload?.deleteTeam ?? false)
    );
  }

  addTeamMember(teamId: string, userId: string): Observable<boolean> {
    return this.requestGraphql<AddMemberPayload>(
      ADD_TEAM_MEMBER_MUTATION,
      {
        teamId,
        input: { userId },
      },
      'AddTeamMember'
    ).pipe(
      tap((payload) => {
        console.debug('[TeamService] addTeamMember payload', payload);
      }),
      map((payload) => payload?.addTeamMember ?? false)
    );
  }

  removeTeamMember(teamId: string, userId: string): Observable<boolean> {
    return this.requestGraphql<RemoveMemberPayload>(
      REMOVE_TEAM_MEMBER_MUTATION,
      {
        teamId,
        input: { userId },
      },
      'RemoveTeamMember'
    ).pipe(
      tap((payload) => {
        console.debug('[TeamService] removeTeamMember payload', payload);
      }),
      map((payload) => payload?.removeTeamMember ?? false)
    );
  }

  getAllUsers(): Observable<TeamMember[]> {
    return this.requestGraphql<AllUsersPayload>(ALL_USERS_QUERY, undefined, 'AllUsers').pipe(
      tap((payload) => {
        console.debug('[TeamService] allUsers payload', payload);
      }),
      map((payload) => {
        const users = payload?.users ?? [];
        return users.map((user) => ({
          id: String(user.id),
          name: this.buildMemberName(user),
          email: user.email ?? undefined,
        }));
      })
    );
  }

  listMyTeamMembers(): Observable<Team[]> {
    return this.requestGraphql<MyTeamMembersPayload>(MY_TEAM_MEMBERS_QUERY, undefined, 'MyTeamMembers').pipe(
      tap((payload) => {
        console.debug('[TeamService] myTeamMembers payload', payload);
      }),
      map((payload) => {
        const groups = payload?.myTeamMembers ?? [];
        return groups.map((group) => ({
          id: String(group.teamId),
          name: group.teamName,
          description: undefined,
          members: (group.members || []).map((member) => ({
            id: String(member.id),
            name: this.buildMemberName(member),
            email: member.email ?? undefined,
          })),
        }));
      })
    );
  }

  private requestGraphql<T>(
    query: string,
    variables?: Record<string, unknown>,
    operationName?: string
  ): Observable<T> {
    return this.http
      .post<GraphqlResponse<T>>(
        GRAPHQL_ENDPOINT,
        { query, variables, operationName },
        { withCredentials: true }
      )
      .pipe(
        catchError((httpError) => {
          console.error(
            '[TeamService] GraphQL HTTP error',
            { operationName, variables, httpError, query }
          );
          return throwError(() => httpError);
        }),
        map((response) => {
          const errors = response.errors ?? [];
          if (errors.length) {
            const authorizationIssue = isAuthorizationGraphqlResponse(errors);
            const logPayload = { operationName, variables, errors, query };
            if (authorizationIssue) {
              console.warn('[TeamService] GraphQL authorization error', logPayload);
            } else {
              console.error('[TeamService] GraphQL errors', logPayload);
            }
            if (response.data) {
              console.warn(
                '[TeamService] GraphQL returned partial data',
                { operationName, variables, data: response.data }
              );
              return response.data;
            }
            throw new GraphqlRequestError(operationName, errors, authorizationIssue);
          }
          if (!response.data) {
            console.warn(
              '[TeamService] GraphQL response without data',
              { operationName, variables, response }
            );
          }
          return response.data;
        })
      );
  }

  private mapTeam(team: GraphqlTeam): Team {
    const members = team.members ?? [];
    return {
      id: String(team.id),
      name: team.name,
      description: team.description ?? undefined,
      members: members.map((member) => ({
        id: String(member.id),
        name: this.buildMemberName(member),
        email: member.email ?? undefined,
      })),
    };
  }

  private buildMemberName(member: GraphqlUser): string {
    const first = member.firstName?.trim() ?? '';
    const last = member.lastName?.trim() ?? '';
    const full = `${first} ${last}`.trim();
    if (full) return full;

    const email = member.email ?? '';
    if (email.includes('@')) {
      return email.split('@')[0] ?? email;
    }
    return String(member.id);
  }
}

const ALL_TEAMS_QUERY = `
  query AllTeams {
    allTeams {
      id
      name
      description
    }
  }
`;

const TEAMS_QUERY = `
  query Teams {
    teams {
      id
      name
      description
    }
  }
`;

const TEAM_QUERY = `
  query Team($id: ID!) {
    team(id: $id) {
      id
      name
      description
      members {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

const TEAM_MEMBERS_QUERY = `
  query TeamMembers($teamId: ID!) {
    teamMembers(teamId: $teamId) {
      id
      firstName
      lastName
      email
    }
  }
`;

const MY_MANAGED_TEAMS_QUERY = `
  query MyManagedTeams {
    myManagedTeams {
      id
      name
      description
      members {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

const MY_TEAMS_QUERY = `
  query MyTeams {
    myTeams {
      id
      name
      description
      members {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

const CREATE_TEAM_MUTATION = `
  mutation CreateTeam($input: TeamInput!) {
    createTeam(input: $input) {
      id
      name
      description
      members {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

const UPDATE_TEAM_MUTATION = `
  mutation UpdateTeam($input: TeamUpdateInput!) {
    updateTeam(input: $input) {
      id
      name
      description
      members {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

const DELETE_TEAM_MUTATION = `
  mutation DeleteTeam($id: ID!) {
    deleteTeam(id: $id)
  }
`;

const ADD_TEAM_MEMBER_MUTATION = `
  mutation AddTeamMember($teamId: ID!, $input: MemberChangeInput!) {
    addTeamMember(teamId: $teamId, input: $input)
  }
`;

const REMOVE_TEAM_MEMBER_MUTATION = `
  mutation RemoveTeamMember($teamId: ID!, $input: MemberChangeInput!) {
    removeTeamMember(teamId: $teamId, input: $input)
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
