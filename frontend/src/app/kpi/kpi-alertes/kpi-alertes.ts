import { Component, OnInit } from '@angular/core';
import { KpiService, KpiAlerte } from '../../core/services/kpi';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-kpi-alertes',
  imports: [CommonModule, MatTabsModule],
  template: `
  <div class="kpi-card">
    <h3>KPI Alerts</h3>
    <ul>
      <li *ngFor="let a of alertes" [class]="a.niveau">
        <strong>{{ a.type }}</strong> – {{ a.message }}
      </li>
    </ul>
  </div>`,
  styles: [`
    ul { list-style:none; padding:0; }
    li { margin:0.5rem 0; padding:0.5rem; border-radius:8px; }
    .warning { background:#fff8e1; color:#f57c00; }
    .danger { background:#ffebee; color:#d32f2f; }
  `]
})
export class KpiAlertesComponent implements OnInit {
  alertes: KpiAlerte[] = [];
  constructor(private kpiService: KpiService) {}
  ngOnInit() { this.kpiService.getAlertes().subscribe(a => this.alertes = a); }
}
