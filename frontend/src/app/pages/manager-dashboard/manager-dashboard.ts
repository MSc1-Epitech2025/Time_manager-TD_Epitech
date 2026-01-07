import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

// Services
import { ManagerService, EmployeeSummary } from '@core/services/manager';
import { ReportService } from '@core/services/report';
import { AuthService } from '@core/services/auth';
import { TeamService, Team } from '@core/services/team';
import { KpiService } from '@core/services/kpi';

// Models & Utils
import { UserKpiSummary, TeamKpiSummary } from '@shared/models/graphql.types';
import { currentWeekRange, getCurrentQuarter, getYearRange, formatDateToYYYYMMDD } from '@shared/utils/date.utils';
import { ReportPdfService , ReportableEmployee } from '@app/core/services/reportPdf';

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
    MatChipsModule,
    MatProgressBarModule,
    MatListModule,
    MatDividerModule,
    NgChartsModule,
  ],
  templateUrl: './manager-dashboard.html',
  styleUrls: ['./manager-dashboard.scss'],
})
export class ManagerDashboard implements OnInit {
  Math = Math;
  employees: EmployeeSummary[] = [];
  filteredEmployees: EmployeeSummary[] = [];
  searchTerm = '';
  selectedEmployee: EmployeeSummary | null = null;
  loadingEmployees = false;
  loadingKpi = false;
  loadingTeamKpi = false;
  selectedTeamId: string | null = null;
  selectedTeamName: string | null = null;
  weekRange = currentWeekRange();
  
  employeeKpiData: UserKpiSummary | null = null;
  teamKpiData: TeamKpiSummary | null = null;
  teamData: Team | null = null;
  employeeKpiCache: Map<string, UserKpiSummary> = new Map();

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
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly managerService: ManagerService,
    private readonly reportService: ReportService,
    private readonly auth: AuthService,
    private readonly teamService: TeamService,
    private readonly kpiService: KpiService,
    private readonly reportPdfService: ReportPdfService,
  ) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const teamId = params.get('teamId');
      const teamName = params.get('teamName');
      this.selectedTeamId = teamId ? teamId.trim() : null;
      this.selectedTeamName = teamName ? teamName.trim().toLowerCase() : null;
      this.loadEmployees();
      if (this.selectedTeamId) {
        this.loadTeamData();
        this.loadTeamKpi();
      }
    });
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
    this.loadEmployeeKpi(emp.id);
  }

  goToPlanning() {
    this.router.navigate(['/app/planning']);
  }

  goToEmp() {
    this.router.navigate(['/app/employee']);
  }

  goToTeamManagement() {
    this.router.navigate(['/app/teams']);
  }

  exportExcel() {
    if (this.employeeKpiData) {
      this.reportService.exportEmployeeKpiReport(this.employeeKpiData);
    }
  }
  exportPdf() {
    if (this.employeeKpiData) {
      const user = this.employeeKpiData;
      
        const employee: ReportableEmployee = {
          name: user.fullName,
          team: this.selectedEmployee?.team ?? 'Not specified',
          presence: user.presenceRate ?? 0,
          late: user.punctuality?.lateRate ?? 0,
          absence: user.absenceDays ?? 0,
          weeklyHours: user.avgHoursPerDay ?? 0,
          productivity: Math.min(100, Math.round(((user.avgHoursPerDay ?? 0) / 8) * 100)),
          overtime: user.overtimeHours ?? 0
        };
      
      this.reportPdfService.exportEmployeeReportPdf(employee);
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private async loadTeamData() {
    if (!this.selectedTeamId) return;
    
    try {
      this.teamData = await firstValueFrom(this.teamService.getTeam(this.selectedTeamId));
    } catch (err) {
      console.error('Failed to load team data:', err);
    }
  }

  // Load KPI for all employees
  private async loadAllEmployeesKpi() {
    for (const employee of this.employees) {
      this.loadEmployeeKpiToCache(employee.id);
    }
  }

  private async loadEmployeeKpiToCache(employeeId: string) {
    try {
      const quarter = getCurrentQuarter();
      const startDate = formatDateToYYYYMMDD(quarter.start);
      const endDate = formatDateToYYYYMMDD(quarter.end);

      const kpi = await firstValueFrom(
        this.kpiService.getUserKpi(employeeId, startDate, endDate)
      );

      if (kpi) {
        this.employeeKpiCache.set(employeeId, kpi);
      }
    } catch (err) {
      console.error(`Failed to load KPI for employee ${employeeId}:`, err);
    }
  }

  private async loadEmployeeKpi(employeeId: string) {
    this.loadingKpi = true;
    this.employeeKpiData = null;
    try {
      const quarter = getCurrentQuarter();
      const startDate = formatDateToYYYYMMDD(quarter.start);
      const endDate = formatDateToYYYYMMDD(quarter.end);

      this.employeeKpiData = await firstValueFrom(
        this.kpiService.getUserKpi(employeeId, startDate, endDate)
      );
    } catch (err) {
      console.error('Failed to load employee KPI data:', err);
    } finally {
      this.loadingKpi = false;
    }
  }

  private async loadTeamKpi() {
    if (!this.selectedTeamId) return;
    
    this.loadingTeamKpi = true;
    this.teamKpiData = null;
    try {
      const yearRange = getYearRange();
      const startDate = formatDateToYYYYMMDD(yearRange.start);
      const endDate = formatDateToYYYYMMDD(yearRange.end);

      this.teamKpiData = await firstValueFrom(
        this.kpiService.getTeamKpi(this.selectedTeamId, startDate, endDate)
      );
    } catch (err) {
      console.error('Failed to load team KPI data:', err);
    } finally {
      this.loadingTeamKpi = false;
    }
  }

  private formatDateToYYYYMMDD(date: Date): string {
    return formatDateToYYYYMMDD(date);
  }

  getEmployeeKpiFromCache(employeeId: string): UserKpiSummary | undefined {
    return this.employeeKpiCache.get(employeeId);
  }

  private loadEmployees() {
    this.loadingEmployees = true;
    
    if (this.selectedTeamId) {
      this.managerService.getTeamEmployeesByTeamId(this.selectedTeamId).subscribe({
        next: (data) => {
          this.employees = data;
          this.loadingEmployees = false;
          this.applyFilters();
          this.loadAllEmployeesKpi();
        },
        error: (err) => {
          console.error('Failed to load team employees', err);
          this.loadingEmployees = false;
          this.employees = [];
          this.filteredEmployees = [];
          this.selectedEmployee = null;
        },
      });
    } else {
      this.managerService.getTeamEmployees().subscribe({
        next: (data) => {
          this.employees = data;
          this.loadingEmployees = false;
          this.applyFilters();
          this.loadAllEmployeesKpi();
        },
        error: (err) => {
          console.error('Failed to load employees', err);
          this.loadingEmployees = false;
          this.employees = [];
          this.filteredEmployees = [];
          this.selectedEmployee = null;
        },
      });
    }
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
