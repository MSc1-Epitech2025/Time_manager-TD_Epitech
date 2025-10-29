import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { KpiService, KpiAssiduite } from '../../core/services/kpi';

Chart.register(...registerables);

@Component({
  selector: 'app-kpi-assiduite',
  templateUrl: './kpi-assiduite.html',
  styleUrls: ['./kpi-assiduite.scss']
})
export class KpiAssiduiteComponent implements AfterViewInit {
  @ViewChild('assiduiteChart', { static: false }) chartRef!: ElementRef<HTMLCanvasElement>;
  kpi?: KpiAssiduite;

  private chart?: Chart<'doughnut', number[], string>;

  constructor(private kpiService: KpiService) {}

  ngAfterViewInit() {
    this.kpiService.getAssiduite().subscribe(data => {
      this.kpi = data;
      this.renderChart();
    });
  }

  renderChart() {
    if (!this.kpi || !this.chartRef?.nativeElement) return;

    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const taux = this.kpi.tauxAssiduite;

    if (this.chart) this.chart.destroy();

    const config: ChartConfiguration<'doughnut', number[], string> = {
      type: 'doughnut',
      data: {
        labels: ['Présence', 'Absence'],
        datasets: [
          {
            data: [taux, 100 - taux],
            backgroundColor: ['#4CAF50', '#E0E0E0'],
            borderWidth: 0
          }
        ]
      },
      options: {
        cutout: '75%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          title: {
            display: true,
            text: `Taux d’assiduité ${taux.toFixed(1)}%`,
            color: '#333',
            font: { size: 18, weight: 'bold' }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }
}
