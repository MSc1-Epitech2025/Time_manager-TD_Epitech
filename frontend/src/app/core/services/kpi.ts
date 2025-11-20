import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

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
    return this.http.get<any>('http://localhost:8030/kpi/fullData').pipe(
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
    const historyMap: { [date: string]: PresenceDay } = {};
  }
}
