import { Component, AfterViewInit, ViewChild, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export interface BarChartData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-kpi-bar-chart',
  standalone: true,
  templateUrl: './kpi-bar-chart.html',
  styleUrls: ['./kpi-bar-chart.scss']
})
export class KpiBarChartComponent implements AfterViewInit, OnChanges {

  @ViewChild('barChart', { static: false }) chartRef!: ElementRef<HTMLCanvasElement>;
  @Input() data: BarChartData[] = [];
  @Input() selectedKpi: 'absenteeism' | 'attendance' | 'productivity' = 'absenteeism';

  chart?: Chart;
  title = '';

  ngAfterViewInit() {
    this.updateTitle();
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedKpi']) {
      this.updateTitle();
    }
    if (this.chart && (changes['data'] || changes['selectedKpi'])) {
      this.updateChart();
    }
  }

  updateTitle() {
    switch (this.selectedKpi) {
      case 'absenteeism': this.title = 'Absences by Person'; break;
      case 'attendance': this.title = 'Attendance by Person'; break;
      case 'productivity': this.title = 'Work Hours by Person'; break;
    }
  }

  getBarColor() {
    switch (this.selectedKpi) {
      case 'absenteeism': return '#ef4444';
      case 'attendance': return '#22c55e';
      case 'productivity': return '#f472b6';
      default: return '#a78bfa';
    }
  }

  updateChart() {
    if (!this.chart) return;

    const labels = this.data.map(d => d.name);
    const values = this.data.map(d => d.value);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].backgroundColor = this.getBarColor();
    this.chart.data.datasets[0].data = values;

    this.chart.update();
  }

  renderChart() {
    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.data.map(d => d.name);
    const values = this.data.map(d => d.value);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: this.title,
            data: values,
            backgroundColor: this.getBarColor(),
            borderRadius: 6,
            barThickness: 40,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                if (value === null) return '0';
                if (this.selectedKpi === 'productivity') {
                  return `${value.toFixed(1)}h`;
                }
                return `${value}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#9ca3af',
              callback: (value) => {
                if (this.selectedKpi === 'productivity') {
                  return `${value}h`;
                }
                return value;
              }
            },
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#9ca3af',
              maxRotation: 45,
              minRotation: 45
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }
}
