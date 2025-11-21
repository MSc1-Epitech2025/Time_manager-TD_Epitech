import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';

const GRAPHQL_ENDPOINT = 'http://localhost:8030/graphql';

// ----------- Interfaces finales envoyées au dashboard -----------
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

// ----------- Interfaces brutes GraphQL -----------
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
          schedules { userId date }
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

          const usersMap: Record<string, Utilisateur> = {};

          data.users.forEach((u: KpiUser) => {
            usersMap[u.id] = {
              id: u.id,
              nom: `${u.firstName} ${u.lastName}`,
              equipe: u.team ?? 'Non affectée',
              historique: []
            };
          });

          // --- Map clocks
          const clockMap: Record<string, Record<string, KpiClock[]>> = {};
          data.clocks.forEach((c: KpiClock) => {
            const dateStr = new Date(c.at).toDateString();

            if (!clockMap[c.userId]) clockMap[c.userId] = {};
            if (!clockMap[c.userId][dateStr]) clockMap[c.userId][dateStr] = [];

            clockMap[c.userId][dateStr].push(c);
          });

          // --- Map absences
          const absenceMap: Record<string, Record<string, KpiAbsenceDay>> = {};
          data.absences.forEach((a: KpiAbsence) => {
            if (!a.days) return;
            if (!absenceMap[a.userId]) absenceMap[a.userId] = {};

            a.days.forEach((d: KpiAbsenceDay) => {
              const dateStr = new Date(d.absenceDate).toDateString();
              absenceMap[a.userId][dateStr] = d;
            });
          });

          data.schedules.forEach((s: KpiSchedule) => {
            const user = usersMap[s.userId];
            if (!user) return;

            const dateObj = new Date(s.date);
            const dateStr = dateObj.toDateString();

            const day: PresenceDuJour = {
              date: dateObj,
              presence: true,
              absences: 0,
              pointage: null,
              tempsTravail: '0h 0m'
            };

            // Clock -> pointage + temps de travail auto
            const dayClocks = clockMap[s.userId]?.[dateStr] ?? [];
            const clockIn = dayClocks.find((c) => c.kind === 'IN');
            const clockOut = dayClocks.find((c) => c.kind === 'OUT');

            if (clockIn) {
              day.pointage = new Date(clockIn.at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });
            }

            if (clockIn && clockOut) {
              const diffMs =
                new Date(clockOut.at).getTime() -
                new Date(clockIn.at).getTime();

              const minutes = Math.max(0, Math.floor(diffMs / 1000 / 60));
              const h = Math.floor(minutes / 60);
              const m = minutes % 60;

              day.tempsTravail = `${h}h ${m}m`;
            }

            // Absences
            const absence = absenceMap[s.userId]?.[dateStr];
            if (absence) {
              day.presence = false;
              day.absences = 1;
              day.pointage = null;
              day.tempsTravail = '0h 0m';
            }

            user.historique.push(day);
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
