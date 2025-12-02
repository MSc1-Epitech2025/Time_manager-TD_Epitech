import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GraphqlPayload, LeaveAccount } from '../../shared/models/graphql.types';

export interface LeaveAccountDto {
  leaveType: string;
  balance: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeaveAccountService {
  private readonly GRAPHQL_ENDPOINT = environment.GRAPHQL_ENDPOINT;

  constructor(private http: HttpClient) {}

  getLeaveAccountsByUser(userId: string): Observable<LeaveAccountDto[]> {
    const query = `
      query LeaveAccountsByUser($userId: ID!) {
        leaveAccountsByUser(userId: $userId) {
          id
          currentBalance
          leaveType {
            code
            label
          }
        }
      }
    `;

    return this.http.post<GraphqlPayload<{ leaveAccountsByUser: LeaveAccount[] }>>(
      this.GRAPHQL_ENDPOINT,
      { query, variables: { userId } },
      { withCredentials: true }
    ).pipe(
      map(response => {
        if (response.errors?.length) {
          throw new Error(response.errors.map(e => e.message).join(', '));
        }
        
        if (!response.data?.leaveAccountsByUser) {
          return [];
        }

        return response.data.leaveAccountsByUser.map(acc => ({
          leaveType: acc.leaveType?.label || acc.leaveType?.code || 'Unknown',
          balance: acc.currentBalance || 0
        }));
      })
    );
  }
}
