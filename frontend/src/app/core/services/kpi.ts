import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';

const GRAPHQL_ENDPOINT = 'http://localhost:8030/graphql';

export interface KpiUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  poste?: string;
  team?: string;
}

export interface KpiClock {
  id: string;
  userId: string;
  kind: 'IN' | 'OUT';
  at: string;
}

export interface KpiAbsenceDay {
  absenceDate: string;
  period: 'FULL_DAY' | 'AM' | 'PM';
}

export interface KpiAbsence {
  id: string;
  userId: string;
  startDate?: string;
  endDate?: string;
  status: string;
  type: string;
  days?: KpiAbsenceDay[];
}

export interface KpiSchedule {
  userId: string;
  date: string;
}

export interface KpiFullData {
  users: KpiUser[];
  clocks: KpiClock[];
  absences: KpiAbsence[];
  schedules: KpiSchedule[];
}

@Injectable({ providedIn: 'root' })
export class KpiService {

  constructor(private http: HttpClient) {}

  /** Charge toutes les données d'un coup */
  loadFullData() {
    const query = `
      query {
        kpiFullData {
          users {
            id firstName lastName email poste team
          }
          clocks {
            id userId kind at
          }
          absences {
            id userId startDate endDate status type
            days { absenceDate period }
          }
          schedules {
            userId date
          }
        }
      }
    `;

    return this.http
      .post<{ data: { kpiFullData: KpiFullData } }>(
        GRAPHQL_ENDPOINT,
        { query },
        { withCredentials: true }
      )
      .pipe(
        map((res) => {
          console.log('Brut response :', res);
          return res.data.kpiFullData
        }),
        catchError((err) => {
          console.error('Erreur chargement KPI', err);
          return of({
            users: [],
            clocks: [],
            absences: [],
            schedules: []
          } as KpiFullData);
        })
      );
  }
}
