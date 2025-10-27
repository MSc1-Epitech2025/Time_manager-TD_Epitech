// kpi-comparatif.component.ts
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { KpiService } from '../../core/services/kpi';

Chart.register(...registerables);

@Component({
  selector: 'app-kpi-comparatif',
  template: `<div class="kpi-card"><h3>Comparatif entre équipes</h3><canvas #chart></canvas></div>`
})
export class KpiComparatifComponent implements AfterViewInit {
  @ViewChild('chart') chartRef!: ElementRef<HTMLCanvasElement>;
  constructor(private kpiService: KpiService) {}

  ngAfterViewInit() {
    this.kpiService.getComparatif().subscribe(kpi => {
      const ctx = this.chartRef.nativeElement.getContext('2d');
      new Chart(ctx!, {
        type: 'radar',
        data: {
          labels: kpi.equipes,
          datasets: [
            {
              label: 'Productivité',
              data: kpi.productivite,
              borderColor: '#42a5f5',
              fill: true,
              backgroundColor: 'rgba(66,165,245,0.2)'
            },
            {
              label: 'Assiduité',
              data: kpi.assiduite,
              borderColor: '#66bb6a',
              fill: true,
              backgroundColor: 'rgba(102,187,106,0.2)'
            }
          ]
        },
        options: { scales: { r: { min: 0, max: 100 } } }
      });
    });
  }
}
