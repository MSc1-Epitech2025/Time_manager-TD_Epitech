import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError, forkJoin, of } from 'rxjs';
import { environment } from '@environments/environment';
import { formatUserName } from '@shared/utils/formatting.utils';
import { GraphqlError, GraphqlResponse, GraphqlRequestError, isGraphqlAuthorizationError } from '@shared/utils/graphql.utils';

const GRAPHQL_ENDPOINT = environment.GRAPHQL_ENDPOINT;

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
      map((payload) => {
        const teams = payload?.allTeams ?? [];
        return teams.map((team) => this.mapTeam(team));
      })
    );
  }

  listTeams(): Observable<Team[]> {
    return this.requestGraphql<TeamsQueryPayload>(TEAMS_QUERY, undefined, 'Teams').pipe(
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
      map((payload) => {
        const teams = payload?.myManagedTeams ?? [];
        return teams.map((team) => this.mapTeam(team));
      })
    );
  }

  listMyTeams(): Observable<Team[]> {
    return this.requestGraphql<MyTeamsPayload>(MY_TEAMS_QUERY, undefined, 'MyTeams').pipe(
      map((payload) => {
        const teams = payload?.myTeams ?? [];
        return teams.map((team) => this.mapTeam(team));
      })
    );
  }

  getTeam(id: string): Observable<Team> {
    return this.requestGraphql<GetTeamPayload>(TEAM_QUERY, { id }, 'Team').pipe(
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
      map((payload) => {
        const members = payload?.teamMembers ?? [];
        return members.map((member) => ({
          id: String(member.id),
          name: formatUserName(member),
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
      map((payload) => this.mapTeam(payload.updateTeam))
    );
  }

  deleteTeam(id: string): Observable<boolean> {
    return this.requestGraphql<DeleteTeamPayload>(DELETE_TEAM_MUTATION, { id }, 'DeleteTeam').pipe(
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
      map((payload) => payload?.removeTeamMember ?? false)
    );
  }

  getAllUsers(): Observable<TeamMember[]> {
    return this.requestGraphql<AllUsersPayload>(ALL_USERS_QUERY, undefined, 'AllUsers').pipe(
      map((payload) => {
        const users = payload?.users ?? [];
        return users.map((user) => ({
          id: String(user.id),
          name: formatUserName(user),
          email: user.email ?? undefined,
        }));
      })
    );
  }

  listMyTeamMembers(): Observable<Team[]> {
    return this.requestGraphql<MyTeamMembersPayload>(MY_TEAM_MEMBERS_QUERY, undefined, 'MyTeamMembers').pipe(
      map((payload) => {
        const groups = payload?.myTeamMembers ?? [];
        return groups.map((group) => ({
          id: String(group.teamId),
          name: group.teamName,
          description: undefined,
          members: (group.members || []).map((member) => ({
            id: String(member.id),
            name: formatUserName(member),
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
            const graphqlError = new GraphqlRequestError(operationName, errors);
            const logPayload = { operationName, variables, errors, query };
            if (graphqlError.isAuthorizationError) {
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
            throw graphqlError;
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
        name: formatUserName(member),
        email: member.email ?? undefined,
      })),
    };
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
