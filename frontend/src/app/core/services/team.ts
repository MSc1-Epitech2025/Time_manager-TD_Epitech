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

type TeamsQueryPayload = { teams: GraphqlTeam[] };
type CreateTeamPayload = { createTeam: GraphqlTeam };
type UpdateTeamPayload = { updateTeam: GraphqlTeam };
type DeleteTeamPayload = { deleteTeam: boolean };

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

  listTeams(): Observable<Team[]> {
    return this.requestGraphql<TeamsQueryPayload>(LIST_TEAMS_QUERY).pipe(
      map((payload) => {
        const teams = payload?.teams ?? [];
        return teams.map((team) => this.mapTeam(team));
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

const LIST_TEAMS_QUERY = `
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
