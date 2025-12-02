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

  @Input() data!: number[];           
  @Input() labels: string[] = [];      
  @Input() selectedKpi!: 'absenteeism' | 'attendance' | 'productivity';

  chart?: Chart;
  title = '';
  
  ngAfterViewInit() {
    this.updateTitle();
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedKpi']) this.updateTitle();
    if (this.chart) this.updateChart();
  }

  updateTitle() {
    switch (this.selectedKpi) {
      case 'absenteeism': this.title = 'Absences rate'; break;
      case 'attendance': this.title = 'Attendance rate'; break;
      case 'productivity': this.title = 'Productivity rate'; break;
    }
  }

  buildDynamicColors(count: number) {
    const baseColors = [
      '#A78BFA','#D946EF','#F472B6','#5D0092'
    ];

    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }

  getColors() {
    // Use dynamic colors based on data length for all KPIs
    return this.buildDynamicColors(this.data.length);
  }

  getLabels() {
    // Always use the labels passed from parent component if available
    if (this.labels && this.labels.length > 0) {
      return this.labels;
    }
    
    // Fallback to default labels only if no labels provided
    if (this.selectedKpi === 'attendance') return ['Presence','Absence'];
    if (this.selectedKpi === 'productivity') return ['Productivity','Non-Productivity'];
    return [];
  }

  updateChart() {
    if (!this.chart) return;

    this.chart.data.labels = this.getLabels();
    this.chart.data.datasets[0].backgroundColor = this.getColors();
    this.chart.data.datasets[0].data = this.data;

    this.chart.update();
  }

  renderChart() {
    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const centerTextPlugin = {
      id: 'centerText',
      afterDraw: (chart: any) => {
        const { ctx, chartArea } = chart;
        const x = (chartArea.left + chartArea.right) / 2;
        const y = (chartArea.top + chartArea.bottom) / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';

        const allZero = !this.data || this.data.every(v => v === 0);

        if (allZero) {
          ctx.font = `bold 28px Inter`;
  
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.font = `bold 40px Inter`;
          ctx.fillText('No data', x, y);
          ctx.restore();
          return;
        }
        
        // Don't show percentage in center when displaying user data
        // Only show for generic labels (Presence/Absence or Productivity/Non-Productivity)
        const isGenericLabels = this.labels.length === 0 || 
          (this.selectedKpi === 'attendance' && this.labels.includes('Presence')) ||
          (this.selectedKpi === 'productivity' && this.labels.includes('Productivity'));
        
        if (isGenericLabels && this.selectedKpi !== 'absenteeism') {
          const mainValue = this.data[0];
          ctx.font = `bold 28px Inter`;
  
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
  
          ctx.strokeText(mainValue + '%', x, y);
          ctx.fillText(mainValue + '%', x, y);
        }
        
        ctx.restore();
      }
    };

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
            position: 'bottom',
            labels: { color: 'white' }
          }
        },
        layout: {
  padding: {
    top: 30,
    bottom: 10,
    left: 10,
    right: 10
  }
}

      },
      plugins: [centerTextPlugin]
    });
  }
}