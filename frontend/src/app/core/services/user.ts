import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

const GRAPHQL_ENDPOINT = 'http://localhost:8030/graphql';

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

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  poste?: string;
};

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
  poste?: string;
};

export type UpdateUserInput = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  poste?: string;
  password?: string;
};

type AllUsersPayload = { users: User[] };
type RegisterPayload = { register: User };
type UpdateUserPayload = { updateUser: User };
type DeleteUserPayload = { deleteUser: boolean };

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    const query = `
      query AllUsers {
        users {
          id
          firstName
          lastName
          email
          phone
          role
          poste
        }
      }
    `;

    return this.http
      .post<GraphqlResponse<AllUsersPayload>>(
        GRAPHQL_ENDPOINT,
        { query, operationName: 'AllUsers' },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          console.debug('[UserService] getAllUsers response', response);
        }),
        map((response) => {
          if (response.errors?.length) {
            throw new Error(response.errors.map((e: GraphqlError) => e.message).join(', '));
          }
          return response.data?.users ?? [];
        })
      );
  }

  createUser(input: CreateUserInput): Observable<User> {
    const mutation = `
      mutation Register($input: CreateUserInput!) {
        register(input: $input) {
          id
          firstName
          lastName
          email
          phone
          role
          poste
        }
      }
    `;

    return this.http
      .post<GraphqlResponse<RegisterPayload>>(
        GRAPHQL_ENDPOINT,
        {
          query: mutation,
          variables: { input },
          operationName: 'Register',
        },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          console.debug('[UserService] createUser response', response);
        }),
        map((response) => {
          if (response.errors?.length) {
            throw new Error(response.errors.map((e: GraphqlError) => e.message).join(', '));
          }
          if (!response.data?.register) {
            throw new Error('Failed to create user');
          }
          return response.data.register;
        })
      );
  }

  updateUser(input: UpdateUserInput): Observable<User> {
    const mutation = `
      mutation UpdateUser($input: UpdateUserInput!) {
        updateUser(input: $input) {
          id
          firstName
          lastName
          email
          phone
          role
          poste
        }
      }
    `;

    return this.http
      .post<GraphqlResponse<UpdateUserPayload>>(
        GRAPHQL_ENDPOINT,
        {
          query: mutation,
          variables: { input },
          operationName: 'UpdateUser',
        },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          console.debug('[UserService] updateUser response', response);
        }),
        map((response) => {
          if (response.errors?.length) {
            throw new Error(response.errors.map((e: GraphqlError) => e.message).join(', '));
          }
          if (!response.data?.updateUser) {
            throw new Error('Failed to update user');
          }
          return response.data.updateUser;
        })
      );
  }

  deleteUser(userId: string): Observable<boolean> {
    const mutation = `
      mutation DeleteUser($id: ID!) {
        deleteUser(id: $id)
      }
    `;

    return this.http
      .post<GraphqlResponse<DeleteUserPayload>>(
        GRAPHQL_ENDPOINT,
        {
          query: mutation,
          variables: { id: userId },
          operationName: 'DeleteUser',
        },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          console.debug('[UserService] deleteUser response', response);
        }),
        map((response) => {
          if (response.errors?.length) {
            throw new Error(response.errors.map((e: GraphqlError) => e.message).join(', '));
          }
          return response.data?.deleteUser ?? false;
        })
      );
  }
}
