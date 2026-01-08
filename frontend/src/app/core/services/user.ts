import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '@environments/environment';
import { GraphqlRequestError } from '@shared/utils/graphql.utils';

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
};

type AllUsersPayload = { users: User[] };
type RegisterPayload = { register: User };
type UpdateUserPayload = { updateUser: User };
type DeleteUserPayload = { deleteUser: boolean };

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}
  
  private readonly GRAPHQL_ENDPOINT = environment.GRAPHQL_ENDPOINT;

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
        this.GRAPHQL_ENDPOINT,
        { query, operationName: 'AllUsers' },
        { withCredentials: true }
      )
      .pipe(
        map((response) => {
          if (response.errors?.length) {
            throw new GraphqlRequestError('AllUsers', response.errors);
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
        this.GRAPHQL_ENDPOINT,
        {
          query: mutation,
          variables: { input },
          operationName: 'Register',
        },
        { withCredentials: true }
      )
      .pipe(
        map((response) => {
          if (response.errors?.length) {
            throw new GraphqlRequestError('Register', response.errors);
          }
          if (!response.data?.register) {
            throw new GraphqlRequestError('Register', [{ message: 'Failed to create user' }]);
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
        this.GRAPHQL_ENDPOINT,
        {
          query: mutation,
          variables: { input },
          operationName: 'UpdateUser',
        },
        { withCredentials: true }
      )
      .pipe(
        map((response) => {
          if (response.errors?.length) {
            throw new GraphqlRequestError('UpdateUser', response.errors);
          }
          if (!response.data?.updateUser) {
            throw new GraphqlRequestError('UpdateUser', [{ message: 'Failed to update user' }]);
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
        this.GRAPHQL_ENDPOINT,
        {
          query: mutation,
          variables: { id: userId },
          operationName: 'DeleteUser',
        },
        { withCredentials: true }
      )
      .pipe(
        map((response) => {
          if (response.errors?.length) {
            throw new GraphqlRequestError('DeleteUser', response.errors);
          }
          return response.data?.deleteUser ?? false;
        })
      );
  }
}
