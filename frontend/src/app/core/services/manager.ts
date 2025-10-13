import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ManagerService {
  getTeamEmployees() {
    return of([
      { id: 1, name: 'Alice Dupont', team: 'Support', hours: 38, status: 'À jour' },
      { id: 2, name: 'Paul Martin', team: 'IT', hours: 42, status: 'En dépassement' },
      { id: 3, name: 'Claire Dubois', team: 'RH', hours: 35, status: 'À jour' },
    ]);
  }

  getEmployeeKpi(id: number) {
    return of({ id, name: 'Alice Dupont', team: 'Support', presence: 82, late: 10, absent: 8 });
  }
}
