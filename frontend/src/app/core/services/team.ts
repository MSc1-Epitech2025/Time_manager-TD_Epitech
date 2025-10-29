import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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
    return this.requestGraphql<AllTeamsQueryPayload>(ALL_TEAMS_QUERY).pipe(
      map((payload) => {
        const teams = payload?.allTeams ?? [];
        return teams.map((team) => this.mapTeam(team));
      })
    );
  }

  listTeams(): Observable<Team[]> {
    return this.requestGraphql<TeamsQueryPayload>(TEAMS_QUERY).pipe(
      map((payload) => {
        const teams = payload?.teams ?? [];
        return teams.map((team) => this.mapTeam(team));
      })
    );
  }

  listManagedTeams(): Observable<Team[]> {
    return this.requestGraphql<MyManagedTeamsPayload>(MY_MANAGED_TEAMS_QUERY).pipe(
      map((payload) => {
        const teams = payload?.myManagedTeams ?? [];
        return teams.map((team) => this.mapTeam(team));
      })
    );
  }

  listMyTeams(): Observable<Team[]> {
    return this.requestGraphql<MyTeamsPayload>(MY_TEAMS_QUERY).pipe(
      map((payload) => {
        const teams = payload?.myTeams ?? [];
        return teams.map((team) => this.mapTeam(team));
      })
    );
  }

  getTeam(id: string): Observable<Team> {
    return this.requestGraphql<GetTeamPayload>(TEAM_QUERY, { id }).pipe(
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
    return this.requestGraphql<TeamMembersPayload>(TEAM_MEMBERS_QUERY, { teamId }).pipe(
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
    return this.requestGraphql<CreateTeamPayload>(CREATE_TEAM_MUTATION, {
      input: {
        name: input.name,
        description: input.description ?? null,
      },
    }).pipe(map((payload) => this.mapTeam(payload.createTeam)));
  }

  updateTeam(id: string, input: UpdateTeamInput): Observable<Team> {
    return this.requestGraphql<UpdateTeamPayload>(UPDATE_TEAM_MUTATION, {
      input: {
        id,
        name: input.name,
        description: input.description ?? null,
      },
    }).pipe(map((payload) => this.mapTeam(payload.updateTeam)));
  }

  deleteTeam(id: string): Observable<boolean> {
    return this.requestGraphql<DeleteTeamPayload>(DELETE_TEAM_MUTATION, { id }).pipe(
      map((payload) => payload?.deleteTeam ?? false)
    );
  }

  addTeamMember(teamId: string, userId: string): Observable<boolean> {
    return this.requestGraphql<AddMemberPayload>(ADD_TEAM_MEMBER_MUTATION, {
      teamId,
      input: { userId },
    }).pipe(map((payload) => payload?.addTeamMember ?? false));
  }

  removeTeamMember(teamId: string, userId: string): Observable<boolean> {
    return this.requestGraphql<RemoveMemberPayload>(REMOVE_TEAM_MEMBER_MUTATION, {
      teamId,
      input: { userId },
    }).pipe(map((payload) => payload?.removeTeamMember ?? false));
  }

  private requestGraphql<T>(query: string, variables?: Record<string, unknown>): Observable<T> {
    return this.http
      .post<GraphqlResponse<T>>(
        GRAPHQL_ENDPOINT,
        { query, variables },
        { withCredentials: true }
      )
      .pipe(
        map((response) => {
          if (response.errors?.length) {
            const message = response.errors.map((error) => error.message).join(', ');
            throw new Error(message);
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
      members {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

const TEAMS_QUERY = `
  query Teams {
    teams {
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
