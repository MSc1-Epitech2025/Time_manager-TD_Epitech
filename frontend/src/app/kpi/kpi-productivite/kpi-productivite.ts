import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { KpiService } from '../../core/services/kpi';

Chart.register(...registerables);

@Component({
  selector: 'app-kpi-productivite',
  template: `<div class="kpi-card"><h3>Hourly Productivity</h3><canvas #chart></canvas></div>`
})
export class KpiProductiviteComponent implements AfterViewInit {
  @ViewChild('chart') chartRef!: ElementRef<HTMLCanvasElement>;
  constructor(private kpiService: KpiService) {}

  ngAfterViewInit() {
   /* this.kpiService.getProductivite().subscribe(kpi => {
      const ctx = this.chartRef.nativeElement.getContext('2d');
      new Chart(ctx!, {
        type: 'line',
        data: {
          labels: kpi.periodes,
          datasets: [{
            label: 'Productivity (%)',
            data: kpi.valeurs,
            borderColor: '#2196f3',
            tension: 0.3,
            fill: false
          }]
        },
        options: { scales: { y: { beginAtZero: true, max: 100 } } }
      });
    });*/
  }
}
