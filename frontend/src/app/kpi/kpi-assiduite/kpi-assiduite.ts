import { Component, AfterViewInit, ViewChild, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-kpi-assiduite',
  templateUrl: './kpi-assiduite.html',
  styleUrls: ['./kpi-assiduite.scss']
})
export class KpiAssiduiteComponent implements AfterViewInit, OnChanges {

  @ViewChild('assiduiteChart', { static: false }) chartRef!: ElementRef<HTMLCanvasElement>;

  @Input() data!: number[];       // [valeur1, valeur2, valeur3?]
  @Input() selectedKpi!: 'absenteeism' | 'attendance' | 'productivity';

  chart?: Chart;
  title = '';
  
  ngAfterViewInit() {
    this.updateTitle();
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedKpi']) this.updateTitle();
    if ((changes['data'] || changes['selectedKpi']) && this.chart) this.updateChart();
  }

  updateTitle() {
    switch (this.selectedKpi) {
      case 'absenteeism': this.title = 'Absence rate'; break;
      case 'attendance': this.title = 'Attendance rate'; break;
      case 'productivity': this.title = 'Productivity rate'; break;
    }
  }

  // 🔥 Couleurs selon KPI
  getColors() {
    switch (this.selectedKpi) {

      case 'absenteeism':
        return ['#f88bfaff','#85007eff']; 
      case 'attendance':
        return ['#22c55e', '#f59e0b', '#ef4444']; 

      case 'productivity':
        return ['#3b82f6', '#9ca3af'];
    }
  }

  // 🔥 Labels selon KPI
  getLabels() {
    switch (this.selectedKpi) {

      case 'absenteeism':
        return ['Présence', 'Absence'];

      case 'attendance':
        return ['Presence', 'Delay' ,'Absence'];

      case 'productivity':
        return ['Productivity', 'Non-Productivity'];
    }
  }

  updateChart() {
    if (!this.chart) return;

    this.chart.data.labels = this.getLabels();
    this.chart.data.datasets[0].backgroundColor = this.getColors();
    this.chart.data.datasets[0].data = this.data;

    this.chart.update();
  }

  renderChart() {
    if (!this.kpi || !this.chartRef?.nativeElement) return;

    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const taux = this.kpi.tauxAssiduite;

    // Détruit le graphique existant avant de recréer
    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.getLabels(),
        datasets: [
          {
            data: this.data,
            backgroundColor: this.getColors(),
            borderWidth: 1,
            borderColor: '#fff'
          }
        ]
      },
      options: {
        cutout: '70%',
        responsive: true,
        plugins: {
          legend: {
            display: true,
            text: `Taux d’assiduité ${taux.toFixed(1)}%`,
            color: '#333',
            font: { size: 18, weight: 'bold' }
          }
        }
      }
    });
  }
}
