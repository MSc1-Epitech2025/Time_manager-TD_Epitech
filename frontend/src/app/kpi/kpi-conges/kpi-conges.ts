// kpi-conges.component.ts
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { KpiService } from '../../core/services/kpi';

Chart.register(...registerables);

@Component({
  selector: 'app-kpi-conges',
  template: `<div class="kpi-card"><h3>Répartition des congés</h3><canvas #chart></canvas></div>`
})
export class KpiCongesComponent implements AfterViewInit {
  @ViewChild('chart') chartRef!: ElementRef<HTMLCanvasElement>;
  constructor(private kpiService: KpiService) {}

  ngAfterViewInit() {
    this.kpiService.getConges().subscribe(data => {
      const ctx = this.chartRef.nativeElement.getContext('2d');
      new Chart(ctx!, {
        type: 'doughnut',
        data: {
          labels: data.map(c => c.type),
          datasets: [{
            data: data.map(c => c.jours),
            backgroundColor: ['#4caf50', '#2196f3', '#ff9800']
          }]
        },
        options: { cutout: '60%' }
      });
    });
  }
}
