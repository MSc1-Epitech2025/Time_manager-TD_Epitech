import { Component } from '@angular/core';

@Component({
  selector: 'app-kpi-rapports',
  template: `
  <div class="kpi-card">
    <h3>Automatic Reports</h3>
    <button (click)="export('csv')">Export CSV</button>
    <button (click)="export('pdf')">Export PDF</button>
    <button (click)="export('email')">Send by Email</button>
  </div>`,
  styles: [`button { margin: 0.5rem; padding: 0.5rem 1rem; border-radius:8px; }`]
})
export class KpiRapportsComponent {
  export(type: string) {
    alert(`Report exported as ${type.toUpperCase()} (simulation)`);
  }
}
