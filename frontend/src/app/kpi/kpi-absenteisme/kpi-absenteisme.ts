import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { KpiService } from '../../core/services/kpi';

Chart.register(...registerables);

@Component({
  selector: 'app-kpi-absenteisme',
  template: `<div class="kpi-card"><h3>Taux d’absentéisme</h3><canvas #chart></canvas></div>`,
  styles: [`.kpi-card { padding: 1rem; background: #fff; border-radius: 1rem; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }`]
})
export class KpiAbsenteismeComponent implements AfterViewInit {
  @ViewChild('chart') chartRef!: ElementRef<HTMLCanvasElement>;

  constructor(private kpiService: KpiService) {}

  ngAfterViewInit() {
    this.kpiService.getAbsenteisme().subscribe(kpi => {
      const ctx = this.chartRef.nativeElement.getContext('2d');
      new Chart(ctx!, {
        type: 'bar',
        data: {
          labels: kpi.parEquipe.map(e => e.equipe),
          datasets: [{
            label: 'Taux d’absentéisme (%)',
            data: kpi.parEquipe.map(e => e.taux),
            backgroundColor: '#f44336'
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, max: 15 } }
        }
      });
    });
  }
}
