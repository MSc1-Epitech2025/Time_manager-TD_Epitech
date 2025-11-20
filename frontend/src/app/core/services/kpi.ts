import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

const GRAPHQL_ENDPOINT = 'http://localhost:8030/graphql';

export interface PresenceDay {
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
  historique: PresenceDay[];
}

@Injectable({ providedIn: 'root' })
export class KpiService {
  constructor(private http: HttpClient) {}

  loadFullData(): Observable<Utilisateur[]> {
    return this.http.get<any>(GRAPHQL_ENDPOINT).pipe(
      map((response) => this.transform(response)),
      catchError((error) => {
        console.error('Error loading KPI data', error);
        return of([]);  
      })
    );
  }
  

   private transform(raw: any): Utilisateur[] {
    const users = raw.users;
    const clocks = raw.clocks;
    const absences = raw.absences;
    const schedules = raw.schedules;

    return users.map((u: any) => {
      const historique = this.buildHistory(
        clocks.filter((c: any) => c.userId === u.id),
        absences.filter((a: any) => a.userId === u.id),
        schedules.filter((s: any) => s.userId === u.id)
      );

      return {
        id: u.id,
        nom: `${u.firstName} ${u.lastName}`,
        equipe: u.team ?? 'Aucune équipe',
        historique
      };
    });
  }

  private buildHistory(clocks: any[], absences: any[], schedules: any[]): PresenceDay[] {
     const mapDays = new Map<string, PresenceDay>();

    schedules.forEach(s => {
      const d = new Date(s.date);
      mapDays.set(d.toDateString(), {
        date: d,
        presence: false,
        absences: 0,
        pointage: null,
        tempsTravail: '0h 0m'
      });
    });

    clocks.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    let lastIn: Date | null = null;

    clocks.forEach(c => {
      const d = new Date(c.at);
      const key = d.toDateString();

      if (!mapDays.has(key)) {
        mapDays.set(key, {
          date: d,
          presence: false,
          absences: 0,
          pointage: null,
          tempsTravail: '0h 0m'
        });
      }

      const entry = mapDays.get(key)!;

      if (c.kind === 'IN') {
        entry.presence = true;
        entry.pointage = this.formatHHMM(d);
        lastIn = d;
      } else if (c.kind === 'OUT' && lastIn) {
        const secs = (d.getTime() - lastIn.getTime()) / 1000;
        const hours = secs / 3600;
        entry.tempsTravail = this.workTime(hours);
        lastIn = null;
      }
    });

    absences.forEach(a => {
      a.days?.forEach((day: any) => {
        const d = new Date(day.absenceDate);
        const key = d.toDateString();

        if (!mapDays.has(key)) {
          mapDays.set(key, {
            date: d,
            presence: false,
            absences: 0,
            pointage: null,
            tempsTravail: '0h 0m'
          });
        }

        const entry = mapDays.get(key)!;

        entry.presence = false;
        entry.pointage = null;
        entry.tempsTravail = '0h 0m';

        entry.absences += (day.period === 'FULL_DAY' ? 1 : 0.5);
      });
    });

    return Array.from(mapDays.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private formatHHMM(d: Date): string {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  private workTime(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }
}
