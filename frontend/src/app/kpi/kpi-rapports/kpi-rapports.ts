import { Component } from '@angular/core';

@Component({
  selector: 'app-kpi-rapports',
  template: `
  <div class="kpi-card">
    <h3>Rapports automatiques</h3>
    <button (click)="export('csv')">Exporter CSV</button>
    <button (click)="export('pdf')">Exporter PDF</button>
    <button (click)="export('email')">Envoyer par Email</button>
  </div>`,
  styles: [`button { margin: 0.5rem; padding: 0.5rem 1rem; border-radius:8px; }`]
})
export class KpiRapportsComponent {
  export(type: string) {
    alert(`Rapport exporté en ${type.toUpperCase()} (simulation)`);
  }
}
