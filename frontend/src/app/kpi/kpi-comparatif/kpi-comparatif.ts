import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-kpi-comparatif',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-comparatif.html',
  styleUrls: ['./kpi-comparatif.scss']
})
export class KpiComparatifComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('chart') chartRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  @Input() comparativeData!: {
    months: string[];
    teams: string[];
    data: { [team: string]: number[] };
  };

  @Input() selectedKpi: 'absenteeism' | 'attendance' | 'productivity' = 'absenteeism';

  ngAfterViewInit() {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['comparativeData'] || changes['selectedKpi']) {
      this.renderChart();
    }
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }

  private renderChart() {
    if (!this.chartRef || !this.comparativeData) return;
    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chart) this.chart.destroy();

    const { months, teams, data } = this.comparativeData;
    const couleurs = ['#f472b6', '#c11d72ff', '#7c3aed', '#5d0092ff', '#f59e0b'];

    const datasets = teams.map((team, i) => ({
      label: team,
      data: data[team],
      backgroundColor: `${couleurs[i % couleurs.length]}CC`,
      borderColor: couleurs[i % couleurs.length],
      borderWidth: 1,
      borderRadius: 6
    }));

    const chartTitle = this.selectedKpi === 'absenteeism'
      ? 'Absence evolution by team'
      : this.selectedKpi === 'attendance'
        ? 'Attendance evolution by team'
        : 'Productivity evolution by team';

    const yAxisTitle = this.selectedKpi === 'absenteeism' ? 'Absences' : 'Score (%)';

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: { labels: months, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        layout: { padding: { bottom: 40 } },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'white',
              font: { size: 13, family: 'Inter, sans-serif' },
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          title: {
            display: true,
            text: chartTitle,
            color: "white",
            font: { size: 16, weight: 'bold', family: 'Inter, sans-serif' },
            padding: { top: 10, bottom: 20 }
          },
          tooltip: {
            backgroundColor: '#1F2937',
            titleColor: '#fff',
            bodyColor: '#E5E7EB',
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                // context.dataset.label correspond au nom du dataset
                // context.parsed.y correspond à la valeur de la barre
                return context.dataset.label + ': ' + context.parsed.y;
              },
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: 'white', font: { size: 13, family: 'Inter, sans-serif'} },
            title: { display: true, text: 'Mois', color: 'white', font: { size: 13, family: 'Inter, sans-serif', weight: 'bold' } }
          },
          y: {
            beginAtZero: true,
            ticks: { color: 'white', font: { size: 12, family: 'Inter, sans-serif' } },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            title: { display: true, text: yAxisTitle, color: 'white', font: { size: 13, family: 'Inter, sans-serif', weight: 'bold' } }
          }
        }
      }
    });
  }
}
