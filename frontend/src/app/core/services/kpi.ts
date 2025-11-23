import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';

const GRAPHQL_ENDPOINT = 'http://localhost:8030/graphql';

export type WorkDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type WorkPeriod = 'AM' | 'PM';

const DAYS_MAP: Record<WorkDay, number> = {
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
  SUN: 0
};

export interface PresenceDuJour {
  date: Date;
  presence: boolean;
  absences: number;
  pointage: string | null;
  tempsTravail: string;
}

export interface Utilisateur {
  id: string;
  nom: string;
  equipe: string;
  historique: PresenceDuJour[];
}

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
  dayOfWeek: WorkDay;
  period: WorkPeriod;
  startTime: string;
  endTime: string;
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

  loadFullData() {
    const query = `
      query {
        kpiFullData {
          users { id firstName lastName email poste team }
          clocks { id userId kind at }
          absences {
            id userId startDate endDate status type
            days { absenceDate period }
          }
          schedules { 
            userId
            dayOfWeek
            period
            startTime
            endTime
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
          const data = res.data.kpiFullData;
          console.log('Data Brut', data);

          const usersMap: Record<string, Utilisateur> = {};

          data.users.forEach((u: KpiUser) => {
            usersMap[u.id] = {
              id: u.id,
              nom: `${u.firstName} ${u.lastName}`,
              equipe: u.team ?? 'Not affected',
              historique: []
            };
          });

          function toIsoDateString(dateStr: string | Date): string {
            const d = new Date(dateStr);
            return d.getFullYear() + '-' +
                   (d.getMonth() + 1).toString().padStart(2, '0') + '-' +
                   d.getDate().toString().padStart(2, '0');
          }

          const absenceMap: Record<string, Record<string, KpiAbsenceDay>> = {};
          data.absences.forEach((a: KpiAbsence) => {
            if (!a.days) return;
            if (!absenceMap[a.userId]) absenceMap[a.userId] = {};
            a.days.forEach((d: KpiAbsenceDay) => {
              const dateStr = toIsoDateString(d.absenceDate);
              absenceMap[a.userId][dateStr] = d;
            });
          });

          data.users.forEach((u: KpiUser) => {
            const user = usersMap[u.id];
            if (!user) return;

            const userClocks = data.clocks.filter(c => c.userId === u.id);

            const clocksByDate: Record<string, KpiClock[]> = {};
            userClocks.forEach(c => {
              const dateKey = toIsoDateString(c.at);
              if (!clocksByDate[dateKey]) clocksByDate[dateKey] = [];
              clocksByDate[dateKey].push(c);
            });

            Object.entries(clocksByDate).forEach(([dateKey, clocks]) => {
              const clockIns = clocks.filter(c => c.kind === 'IN').sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
              const clockOuts = clocks.filter(c => c.kind === 'OUT').sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

              if (clockIns.length === 0 || clockOuts.length === 0) return;

              const firstIn = clockIns[0];
              let totalMinutes = 0;

              for (let i = 0; i < Math.min(clockIns.length, clockOuts.length); i++) {
                const diffMs = new Date(clockOuts[i].at).getTime() - new Date(clockIns[i].at).getTime();
                totalMinutes += Math.max(0, Math.floor(diffMs / 1000 / 60));
              }

              const h = Math.floor(totalMinutes / 60);
              const m = totalMinutes % 60;

              const day: PresenceDuJour = {
                date: new Date(dateKey),
                presence: true,
                absences: 0,
                pointage: new Date(firstIn.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                tempsTravail: `${h}h ${m}m`
              };

              const absence = absenceMap[u.id]?.[dateKey];
              if (absence) {
                day.presence = false;
                day.absences = 1;
                day.pointage = null;
                day.tempsTravail = '0h 0m';
              }

              user.historique.push(day);
            });
          });

          return Object.values(usersMap);
        }),

        catchError((err) => {
          console.error('Erreur chargement KPI', err);
          return of([]);
        })
      );
  }
}
