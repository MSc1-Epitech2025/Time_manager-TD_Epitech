import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { Router } from '@angular/router';
import { ManagerService } from '../../core/services/manager';
import { ReportService } from '../../core/services/report';

import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    NgChartsModule,
  ],
  templateUrl: './manager-dashboard.html',
  styleUrls: ['./manager-dashboard.scss'],
})
export class ManagerDashboard {
  employees: any[] = [];
  filteredEmployees: any[] = [];
  searchTerm = '';
  selectedEmployee: any | null = null;

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Présence', 'Retards', 'Absences'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#A78BFA', '#F472B6', '#C084FC'],
      },
    ],
  };

  chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#F9FAFB' },
      },
    },
  };

  constructor(
    private router: Router,
    private managerService: ManagerService,
    private reportService: ReportService,
    private auth: AuthService,
  ) { }

  ngOnInit() {
    this.managerService.getTeamEmployees().subscribe((data) => {
      this.employees = data;
      this.filteredEmployees = data;
    });
  }

  filterEmployees() {
    const term = this.searchTerm.toLowerCase();
    this.filteredEmployees = this.employees.filter((emp) =>
      emp.name.toLowerCase().includes(term)
    );
  }

  selectEmployee(emp: any) {
    this.selectedEmployee = emp;
    const data = { presence: 80, late: 10, absent: 10 };
    this.pieChartData.datasets[0].data = [
      data.presence,
      data.late,
      data.absent,
    ];
  }

  goToPlanning() {
    this.router.navigate(['/manager/planning']);
  }

  goToEmp() {
    this.router.navigate(['/employee']);
  }

  exportExcel() {
    if (this.selectedEmployee) {
      this.reportService.exportEmployeeReport(this.selectedEmployee);
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
