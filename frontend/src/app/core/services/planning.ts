import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlanningService {
  getPlanning() {
    return of([
      { title: 'Alice - Présente', date: '2025-10-10', color: '#A78BFA' },
      { title: 'Paul - Absent', date: '2025-10-12', color: '#F472B6' },
    ]);
  }
}
