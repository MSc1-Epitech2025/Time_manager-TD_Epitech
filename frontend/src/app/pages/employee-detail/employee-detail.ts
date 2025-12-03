import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ManagerService, EmployeeKpi } from '@core/services/manager';
import { ReportService } from '@core/services/report';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, NgChartsModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './employee-detail.html',
  styleUrls: ['./employee-detail.scss']
})
export class EmployeeDetailComponent implements OnInit {
  employeeId!: string;
  employeeData: EmployeeKpi | null = null;
  loading = false;

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Presence', 'Retards', 'Absence'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#A78BFA', '#F472B6', '#C084FC']
    }]
  };

  chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { color: '#F9FAFB' } } }
  };

  constructor(
    private route: ActivatedRoute,
    private managerService: ManagerService,
    private reportService: ReportService
  ) {}

  ngOnInit() {
    this.employeeId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.employeeId) return;

    this.loading = true;
    this.managerService.getEmployeeKpi(this.employeeId).subscribe({
      next: (data) => {
        this.loading = false;
        if (!data) {
          this.employeeData = null;
          this.pieChartData.datasets[0].data = [0, 0, 0];
          return;
        }
        this.employeeData = data;
        this.pieChartData = {
          ...this.pieChartData,
          datasets: [{
            ...this.pieChartData.datasets[0],
            data: [data.presence, data.late, data.absent],
          }]
        };
      },
      error: (err) => {
        console.error('Unable to load employee KPIs', err);
        this.loading = false;
        this.employeeData = null;
      }
    });
  }

  exportExcel() {
    if (this.employeeData) {
      this.reportService.exportEmployeeReport(this.employeeData);
    }
  }
}

