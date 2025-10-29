import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError, forkJoin, of } from 'rxjs';

const GRAPHQL_ENDPOINT = 'http://localhost:8030/graphql';

type GraphqlError = { message: string };

type GraphqlResponse<T> = {
  data: T;
  errors?: GraphqlError[];
};

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
  constructor(private http: HttpClient) {}

  listAllTeams(): Observable<Team[]> {
    return this.requestGraphql<AllTeamsQueryPayload>(ALL_TEAMS_QUERY, undefined, 'AllTeams').pipe(
      tap((payload) => {
        // DEBUG allTeams: inspection du payload brut
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
        // DEBUG teams: inspection du payload brut
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
        // DEBUG myManagedTeams: inspection du payload brut
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
        // DEBUG myTeams: inspection du payload brut
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
        // DEBUG team: inspection du payload brut
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
        // DEBUG teamMembers: inspection du payload brut
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
        // DEBUG createTeam: inspection du payload brut
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
        // DEBUG updateTeam: inspection du payload brut
        console.debug('[TeamService] updateTeam payload', payload);
      }),
      map((payload) => this.mapTeam(payload.updateTeam))
    );
  }

  deleteTeam(id: string): Observable<boolean> {
    return this.requestGraphql<DeleteTeamPayload>(DELETE_TEAM_MUTATION, { id }, 'DeleteTeam').pipe(
      tap((payload) => {
        // DEBUG deleteTeam: inspection du payload brut
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
        // DEBUG addTeamMember: inspection du payload brut
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
        // DEBUG removeTeamMember: inspection du payload brut
        console.debug('[TeamService] removeTeamMember payload', payload);
      }),
      map((payload) => payload?.removeTeamMember ?? false)
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
          if (response.errors?.length) {
            console.error(
              '[TeamService] GraphQL errors',
              { operationName, variables, errors: response.errors, query }
            );
            if (response.data) {
              console.warn(
                '[TeamService] GraphQL returned partial data',
                { operationName, variables, data: response.data }
              );
              return response.data;
            }
            const message = response.errors.map((error) => error.message).join(', ');
            throw new Error(`[GraphQL:${operationName ?? 'unknown'}] ${message}`);
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
