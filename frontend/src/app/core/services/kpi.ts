import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface KpiAssiduite {
  tauxAssiduite: number;
  joursTravailles: number;
  joursOuvres: number;
  periode: string;
}

export interface KpiAbsenteisme {
  tauxGlobal: number;
  parEquipe: { equipe: string; taux: number }[];
}

export interface KpiProductivite {
  periodes: string[];
  valeurs: number[];
}

export interface KpiComparatif {
  equipes: string[];
  productivite: number[];
  assiduite: number[];
}

export interface KpiConges {
  type: string;
  jours: number;
}

export interface KpiAlerte {
  type: string;
  message: string;
  niveau: 'warning' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class KpiService {
  getAssiduite(): Observable<KpiAssiduite> {
    return of({
      tauxAssiduite: 92.5,
      joursTravailles: 185,
      joursOuvres: 200,
      periode: 'Janvier - Septembre 2025'
    });
  }

  getAbsenteisme(): Observable<KpiAbsenteisme> {
    return of({
      tauxGlobal: 7.5,
      parEquipe: [
        { equipe: 'Development', taux: 6.2 },
        { equipe: 'Marketing', taux: 8.5 },
        { equipe: 'Support', taux: 9.3 }
      ]
    });
  }

  getProductivite(): Observable<KpiProductivite> {
    return of({
      periodes: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      valeurs: [85, 88, 90, 84, 92, 95]
    });
  }

  getComparatif(): Observable<KpiComparatif> {
    return of({
      equipes: ['Dev', 'Marketing', 'Support'],
      productivite: [90, 85, 88],
      assiduite: [95, 91, 89]
    });
  }

  getConges(): Observable<KpiConges[]> {
    return of([
      { type: 'Paid Leave', jours: 120 },
      { type: 'Compensatory Time', jours: 45 },
      { type: 'Sick Leave', jours: 30 }
    ]);
  }

  getAlertes(): Observable<KpiAlerte[]> {
    return of([
      { type: 'Absenteeism', message: 'High rate (> 10%) in Support team', niveau: 'danger' },
      { type: 'Productivity', message: 'Decreased by 5% compared to previous month', niveau: 'warning' }
    ]);
  }
}
