import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import { GraphqlPayload, ClockRecord } from '@shared/models/graphql.types';

@Injectable({
  providedIn: 'root'
})
export class ClockService {
  private readonly GRAPHQL_ENDPOINT = environment.GRAPHQL_ENDPOINT;

  constructor(private http: HttpClient) {}

  getClocks(from?: string, to?: string): Observable<ClockRecord[]> {
    const query = `
      query MyClocks($from: String, $to: String) {
        myClocks(from: $from, to: $to) {
          id
          kind
          at
        }
      }
    `;

    return this.http.post<GraphqlPayload<{ myClocks: ClockRecord[] }>>(
      this.GRAPHQL_ENDPOINT,
      { query, variables: { from, to } },
      { withCredentials: true }
    ).pipe(
      map(response => {
        if (response.errors?.length) {
          throw new Error(response.errors.map(e => e.message).join(', '));
        }
        return response.data?.myClocks ?? [];
      })
    );
  }

  getClocksForUser(userId: string, from?: string, to?: string): Observable<ClockRecord[]> {
    const query = `
      query ClocksForUser($userId: ID!, $from: String, $to: String) {
        clocksForUser(userId: $userId, from: $from, to: $to) {
          id
          kind
          at
        }
      }
    `;

    return this.http.post<GraphqlPayload<{ clocksForUser: ClockRecord[] }>>(
      this.GRAPHQL_ENDPOINT,
      { query, variables: { userId, from, to } },
      { withCredentials: true }
    ).pipe(
      map(response => {
        if (response.errors?.length) {
          throw new Error(response.errors.map(e => e.message).join(', '));
        }
        return response.data?.clocksForUser ?? [];
      })
    );
  }

  createClock(kind: 'IN' | 'OUT'): Observable<ClockRecord> {
    const mutation = `
      mutation CreateClockForMe($input: ClockCreateInput!) {
        createClockForMe(input: $input) {
          id
          kind
          at
        }
      }
    `;

    return this.http.post<GraphqlPayload<{ createClockForMe: ClockRecord }>>(
      this.GRAPHQL_ENDPOINT,
      { query: mutation, variables: { input: { kind } } },
      { withCredentials: true }
    ).pipe(
      map(response => {
        if (response.errors?.length) {
          throw new Error(response.errors.map(e => e.message).join(', '));
        }
        if (!response.data?.createClockForMe) {
          throw new Error('No data returned from clock mutation');
        }
        return response.data.createClockForMe;
      })
    );
  }
}
