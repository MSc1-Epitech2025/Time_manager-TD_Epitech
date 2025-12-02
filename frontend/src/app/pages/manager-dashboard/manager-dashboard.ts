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
import { ManagerService, EmployeeSummary } from '../../core/services/manager';
import { ReportService } from '../../core/services/report';
import { AuthService } from '../../core/services/auth';
import { TeamService, Team } from '../../core/services/team';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface GraphqlPayload<T> {
  data: T;
  errors?: { message: string }[];
}

interface PunctualityStats {
  lateRate: number;
  avgDelayMinutes: number;
}

interface AbsenceBreakdown {
  type: string;
  days: number;
}

interface UserKpiSummary {
  userId: string;
  fullName: string;
  presenceRate: number;
  avgHoursPerDay: number;
  overtimeHours: number;
  punctuality: PunctualityStats;
  absenceDays: number;
  absenceByType: AbsenceBreakdown[];
  reportsAuthored: number;
  reportsReceived: number;
  periodStart: string;
  periodEnd: string;
}

interface TeamKpiSummary {
  teamId: string;
  teamName: string;
  headcount: number;
  presenceRate: number;
  avgHoursPerDay: number;
  absenceRate: number;
  reportsAuthored: number;
  periodStart: string;
  periodEnd: string;
}

const GRAPHQL_ENDPOINT = environment.GRAPHQL_ENDPOINT;

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
    private readonly http: HttpClient,
    private readonly teamService: TeamService,
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
    this.router.navigate(['/planning']);
  }

  goToEmp() {
    this.router.navigate(['/employee']);
  }

  goToTeamManagement() {
    this.router.navigate(['/team-management']);
  }

  exportExcel() {
    if (this.employeeKpiData) {
      this.reportService.exportEmployeeKpiReport(this.employeeKpiData);
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

  private async loadAllEmployeesKpi() {
    // Load KPI for all employees in parallel
    for (const employee of this.employees) {
      this.loadEmployeeKpiToCache(employee.id);
    }
  }

  private async loadEmployeeKpiToCache(employeeId: string) {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      
      let quarterStart: Date;
      let quarterEnd: Date;
      
      if (currentMonth >= 0 && currentMonth <= 2) {
        quarterStart = new Date(now.getFullYear(), 0, 1);
        quarterEnd = new Date(now.getFullYear(), 2, 31, 23, 59, 59);
      } else if (currentMonth >= 3 && currentMonth <= 5) {
        quarterStart = new Date(now.getFullYear(), 3, 1);
        quarterEnd = new Date(now.getFullYear(), 5, 30, 23, 59, 59);
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        quarterStart = new Date(now.getFullYear(), 6, 1);
        quarterEnd = new Date(now.getFullYear(), 8, 30, 23, 59, 59);
      } else {
        quarterStart = new Date(now.getFullYear(), 9, 1);
        quarterEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      }
      
      const startDate = this.formatDateToYYYYMMDD(quarterStart);
      const endDate = this.formatDateToYYYYMMDD(quarterEnd);

      const response = await firstValueFrom(
        this.http.post<GraphqlPayload<{ userKpi: UserKpiSummary }>>(
          GRAPHQL_ENDPOINT,
          {
            query: `
              query UserKpi($userId: ID!, $startDate: String!, $endDate: String!) {
                userKpi(userId: $userId, startDate: $startDate, endDate: $endDate) {
                  userId
                  fullName
                  presenceRate
                  avgHoursPerDay
                  overtimeHours
                  punctuality {
                    lateRate
                    avgDelayMinutes
                  }
                  absenceDays
                  absenceByType {
                    type
                    days
                  }
                  reportsAuthored
                  reportsReceived
                  periodStart
                  periodEnd
                }
              }
            `,
            variables: {
              userId: employeeId,
              startDate,
              endDate,
            },
          },
          { withCredentials: true }
        )
      );

      if (response.data?.userKpi) {
        this.employeeKpiCache.set(employeeId, response.data.userKpi);
      }
    } catch (err) {
      console.error(`Failed to load KPI for employee ${employeeId}:`, err);
    }
  }

  private async loadEmployeeKpi(employeeId: string) {
    this.loadingKpi = true;
    this.employeeKpiData = null;
    try {
      const now = new Date();
      const currentMonth = now.getMonth(); // 0-11
      
      // Déterminer le trimestre actuel
      let quarterStart: Date;
      let quarterEnd: Date;
      
      if (currentMonth >= 0 && currentMonth <= 2) {
        // Q1: Janvier - Mars
        quarterStart = new Date(now.getFullYear(), 0, 1);
        quarterEnd = new Date(now.getFullYear(), 2, 31, 23, 59, 59);
      } else if (currentMonth >= 3 && currentMonth <= 5) {
        // Q2: Avril - Juin
        quarterStart = new Date(now.getFullYear(), 3, 1);
        quarterEnd = new Date(now.getFullYear(), 5, 30, 23, 59, 59);
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        // Q3: Juillet - Septembre
        quarterStart = new Date(now.getFullYear(), 6, 1);
        quarterEnd = new Date(now.getFullYear(), 8, 30, 23, 59, 59);
      } else {
        // Q4: Octobre - Décembre
        quarterStart = new Date(now.getFullYear(), 9, 1);
        quarterEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      }
      
      const startDate = this.formatDateToYYYYMMDD(quarterStart);
      const endDate = this.formatDateToYYYYMMDD(quarterEnd);

      const response = await firstValueFrom(
        this.http.post<GraphqlPayload<{ userKpi: UserKpiSummary }>>(
          GRAPHQL_ENDPOINT,
          {
            query: `
              query UserKpi($userId: ID!, $startDate: String!, $endDate: String!) {
                userKpi(userId: $userId, startDate: $startDate, endDate: $endDate) {
                  userId
                  fullName
                  presenceRate
                  avgHoursPerDay
                  overtimeHours
                  punctuality {
                    lateRate
                    avgDelayMinutes
                  }
                  absenceDays
                  absenceByType {
                    type
                    days
                  }
                  reportsAuthored
                  reportsReceived
                  periodStart
                  periodEnd
                }
              }
            `,
            variables: {
              userId: employeeId,
              startDate,
              endDate,
            },
          },
          { withCredentials: true }
        )
      );

      if (response.errors?.length) {
        throw new Error(response.errors.map((e) => e.message).join(', '));
      }

      if (response.data?.userKpi) {
        this.employeeKpiData = response.data.userKpi;
      }
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
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1); // 1er janvier de l'année en cours
      const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59); // 31 décembre de l'année en cours
      
      const startDate = this.formatDateToYYYYMMDD(yearStart);
      const endDate = this.formatDateToYYYYMMDD(yearEnd);

      const response = await firstValueFrom(
        this.http.post<GraphqlPayload<{ teamKpi: TeamKpiSummary }>>(
          GRAPHQL_ENDPOINT,
          {
            query: `
              query TeamKpi($teamId: ID!, $startDate: String!, $endDate: String!) {
                teamKpi(teamId: $teamId, startDate: $startDate, endDate: $endDate) {
                  teamId
                  teamName
                  headcount
                  presenceRate
                  avgHoursPerDay
                  absenceRate
                  reportsAuthored
                  periodStart
                  periodEnd
                }
              }
            `,
            variables: {
              teamId: this.selectedTeamId,
              startDate,
              endDate,
            },
          },
          { withCredentials: true }
        )
      );

      if (response.errors?.length) {
        throw new Error(response.errors.map((e) => e.message).join(', '));
      }

      if (response.data?.teamKpi) {
        this.teamKpiData = response.data.teamKpi;
      }
    } catch (err) {
      console.error('Failed to load team KPI data:', err);
    } finally {
      this.loadingTeamKpi = false;
    }
  }

  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
          // Load KPI for all employees
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
          // Load KPI for all employees
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

function currentWeekRange(): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(now);
  const day = from.getDay() === 0 ? 7 : from.getDay();
  from.setDate(from.getDate() - day + 1);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(from.getDate() + 7);
  return { from, to };
}
