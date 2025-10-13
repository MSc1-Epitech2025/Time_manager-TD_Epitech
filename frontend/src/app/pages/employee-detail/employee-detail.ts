import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ManagerService } from '../../core/services/manager';
import { ReportService } from '../../core/services/report';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, NgChartsModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './employee-detail.html',
  styleUrls: ['./employee-detail.scss']
})
export class EmployeeDetailComponent implements OnInit {
  employeeId!: number;
  employeeData: any;

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Présence', 'Retard', 'Absence'],
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
    this.employeeId = Number(this.route.snapshot.paramMap.get('id'));
    this.managerService.getEmployeeKpi(this.employeeId).subscribe(data => {
      this.employeeData = data;
      this.pieChartData.datasets[0].data = [data.presence, data.late, data.absent];
    });
  }

  exportExcel() {
    this.reportService.exportEmployeeReport(this.employeeData);
  }
}
