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
import { ActivatedRoute, Router } from '@angular/router';
import { ManagerService, EmployeeSummary } from '../../core/services/manager';
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
  employees: EmployeeSummary[] = [];
  filteredEmployees: EmployeeSummary[] = [];
  searchTerm = '';
  selectedEmployee: EmployeeSummary | null = null;
  loadingEmployees = false;
  private selectedTeamName: string | null = null;

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Presence', 'Retards', 'Absences'],
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
    private route: ActivatedRoute,
    private managerService: ManagerService,
    private reportService: ReportService,
    private auth: AuthService,
  ) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const teamName = params.get('teamName');
      this.selectedTeamName = teamName ? teamName.trim().toLowerCase() : null;
      this.applyFilters();
    });

    this.loadEmployees();
  }

  filterEmployees() {
    this.applyFilters();
  }

  selectEmployee(emp: EmployeeSummary) {
    this.selectedEmployee = emp;
    this.pieChartData = {
      ...this.pieChartData,
      datasets: [
        {
          ...this.pieChartData.datasets[0],
          data: [emp.presence, emp.late, emp.absence],
        },
      ],
    };
  }

  goToPlanning() {
    this.router.navigate(['/planning']);
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

  private loadEmployees() {
    this.loadingEmployees = true;
    this.managerService.getTeamEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.loadingEmployees = false;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Echec du chargement des employes', err);
        this.loadingEmployees = false;
        this.employees = [];
        this.filteredEmployees = [];
        this.selectedEmployee = null;
      },
    });
  }

  private applyFilters() {
    let results = [...this.employees];

    if (this.selectedTeamName) {
      results = results.filter(
        (emp) => (emp.team ?? '').trim().toLowerCase() === this.selectedTeamName
      );
    }

    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      results = results.filter((emp) => {
        const haystack = `${emp.name} ${emp.team ?? ''}`.toLowerCase();
        return haystack.includes(term);
      });
    }

    this.filteredEmployees = results;

    if (!results.length) {
      this.selectedEmployee = null;
      return;
    }

    const currentId = this.selectedEmployee?.id ?? null;
    const stillSelected = currentId
      ? results.find((emp) => emp.id === currentId)
      : null;

    if (stillSelected) {
      this.selectEmployee(stillSelected);
    } else {
      this.selectEmployee(results[0]);
    }
  }
}

