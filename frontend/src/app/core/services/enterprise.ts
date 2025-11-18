// frontend/src/app/core/services/enterprise.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

const GRAPHQL_ENDPOINT = 'http://localhost:8030/graphql';

// Interfaces
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string[];
  poste?: string;
  avatarUrl?: string;
}

export interface Clock {
  id: number;
  userId: string;
  kind: 'IN' | 'OUT';
  at: string;
}

export interface Absence {
  id: number;
  userId: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
}

export interface LeaveAccount {
  id: number;
  userId: string;
  leaveType: string;
  openingBalance: number;
  accrualPerMonth: number;
}

@Injectable({ providedIn: 'root' })
export class EnterpriseService {
  constructor(private http: HttpClient) {}

  // -------------------- UTILISATEURS --------------------
  getUsers(): Observable<User[]> {
    const query = `
      query {
        users {
          id
          firstName
          lastName
          email
          role
          poste
          avatarUrl
        }
      }
    `;
    return this.http.post<any>(GRAPHQL_ENDPOINT, { query })
      .pipe(map(res => res.data?.users || []));
  }

  // -------------------- HORAIRES (Clocks) --------------------
  getClocks(userId?: string): Observable<Clock[]> {
    const variables: any = {};
    let query = '';

    if (userId) {
      query = `
        query getUserClocks($userId: ID!) {
          clocks(userId: $userId) {
            id
            userId
            kind
            at
          }
        }
      `;
      variables.userId = userId;
    } else {
      query = `
        query {
          clocks {
            id
            userId
            kind
            at
          }
        }
      `;
    }

    return this.http.post<any>(GRAPHQL_ENDPOINT, { query, variables })
      .pipe(map(res => res.data?.clocks || []));
  }

  // -------------------- ABSENCES --------------------
  getAbsences(userId?: string): Observable<Absence[]> {
    const variables: any = {};
    let query = '';

    if (userId) {
      query = `
        query getUserAbsences($userId: ID!) {
          absences(userId: $userId) {
            id
            userId
            startDate
            endDate
            type
            status
          }
        }
      `;
      variables.userId = userId;
    } else {
      query = `
        query {
          absences {
            id
            userId
            startDate
            endDate
            type
            status
          }
        }
      `;
    }

    return this.http.post<any>(GRAPHQL_ENDPOINT, { query, variables })
      .pipe(map(res => res.data?.absences || []));
  }

  // -------------------- COMPTE DE CONGÉS --------------------
  getLeaveAccounts(userId?: string): Observable<LeaveAccount[]> {
    const variables: any = {};
    let query = '';

    if (userId) {
      query = `
        query getUserLeaveAccounts($userId: ID!) {
          leaveAccounts(userId: $userId) {
            id
            userId
            leaveType
            openingBalance
            accrualPerMonth
          }
        }
      `;
      variables.userId = userId;
    } else {
      query = `
        query {
          leaveAccounts {
            id
            userId
            leaveType
            openingBalance
            accrualPerMonth
          }
        }
      `;
    }

    return this.http.post<any>(GRAPHQL_ENDPOINT, { query, variables })
      .pipe(map(res => res.data?.leaveAccounts || []));
  }
}
