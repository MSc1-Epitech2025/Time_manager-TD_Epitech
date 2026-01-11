import { Component, OnDestroy, OnInit , ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { NgChartsModule } from 'ng2-charts';
import { ChartOptions } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { formatTimeHHMM, formatHoursMinutes } from '@shared/utils/formatting.utils';
import { formatDateToYYYYMMDD, getCurrentQuarter, getYearRange } from '@shared/utils/date.utils';

// Services
import {
  KpiService,
  Utilisateur,
  PresenceDuJour,
} from '@core/services/kpi';
import { ReportService, ReportableEmployee } from '@core/services/report';
import { ReportPdfService } from '@core/services/reportPdf';

// Kpi Components
import { KpiBarChartComponent, BarChartData } from '@kpi/kpi-bar-chart/kpi-bar-chart';

interface GraphQLResponse<T> {
  data: T;
  errors?: any[];
}


@Component({
  selector: 'app-enterprise-dashboard',
  standalone: true,
  templateUrl: './enterprise-dashboard.html',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDividerModule,
    NgChartsModule,
    KpiBarChartComponent,
  ],
  styleUrls: ['./enterprise-dashboard.scss'],
})
export class EnterpriseDashboard implements OnInit, OnDestroy {
  users: Utilisateur[] = [];
  loading = false;
  allUsersKpi: any[] = [];
  allTeams: any[] = [];

  private _selectedKpi: 'absenteeism' | 'attendance' | 'productivity' = 'attendance';
  
  get selectedKpi(): 'absenteeism' | 'attendance' | 'productivity' {
    return this._selectedKpi;
  }
  set selectedKpi(value: 'absenteeism' | 'attendance' | 'productivity') {
    this._selectedKpi = value;
    this.updateBarChartData();
  }

  private _selectedTeam = '';
  private _selectedPeriod: 'last_week' | 'quarter' | 'year' = 'quarter';
  private readonly GRAPHQL_ENDPOINT = environment.GRAPHQL_ENDPOINT;

  get selectedTeam(): string {
    return this._selectedTeam;
  }
  set selectedTeam(value: string) {
    if (this._selectedTeam !== value) {
      this._selectedTeam = value;
      this.updateFilteredUsers();
      this.loadKpiData();
    }
  }

  get selectedPeriod(): 'last_week' | 'quarter' | 'year' {
    return this._selectedPeriod;
  }
  set selectedPeriod(value: 'last_week' | 'quarter' | 'year') {
    if (this._selectedPeriod !== value) {
      this._selectedPeriod = value;
      this.loading = true;
      this.loadAllKpiData().then(() => {
        this.loadAbsenteeismData([]);
        this.loadAttendanceData([]);
        this.loadProductivityData([]);
      }).finally(() => {
        this.loading = false;
      });
    }
  }

  filteredByPeriod: Array<{ user: Utilisateur; day: PresenceDuJour }> = [];

  absenteeismStats: { totalAbsences: number; byName?: Record<string, number> } | null =
    null;
  topAbsences: Array<{ name: string; count: number }> = [];

  attendanceStats: { present: number; absent: number; late: number } | null =
    null;
  topAttendance: Array<{ name: string; count: number }> = [];
  attendanceList: Array<{
    name: string;
    in?: string;
    out?: string;
    present: boolean;
    late?: boolean;
  }> = [];

  productivityStats: {
    totalHours: number;
    averageHours: number;
    productivityRate: number;
  } | null = null;
  productivityList: Array<{ name: string; hours: number }> = [];
  topProductivity: Array<{ name: string; percent: number }> = [];

  // Bar chart data
  barChartData: BarChartData[] = [];
  private absenteeismChartData: BarChartData[] = [];
  private attendanceChartData: BarChartData[] = [];
  private productivityChartData: BarChartData[] = [];

  pieChartData: {
    labels: string[];
    datasets: { data: number[]; backgroundColor: string[] }[];
  } = {
    labels: ['Presence', 'Absences'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#A78BFA', '#C084FC'],
      },
    ],
  };

  chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#F9FAFB' },
      },
    },
  };

  private intervalId: number | null = null;

  filteredUsers: Utilisateur[] = [];

  constructor(
    private kpiService: KpiService,
    private http: HttpClient,
    private reportPdfService: ReportPdfService, 
    private reportService: ReportService
  ) {}

  getPointage(userId: string): string {
    const kpi = this.allUsersKpi.find(k => k?.userId === userId);
    if (!kpi) return '-';
    
    const lateRate = kpi.punctuality?.lateRate || 0;
    return lateRate > 20 ? 'Often Late' : 'On Time';
  }

  getTempsTravail(userId: string): string {
    const kpi = this.allUsersKpi.find(k => k?.userId === userId);
    if (!kpi) return '-';
    
    const avgHours = kpi.avgHoursPerDay || 0;
    const hours = Math.floor(avgHours);
    const minutes = Math.floor((avgHours - hours) * 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  getPresenceRate(userId: string): string {
    const kpi = this.allUsersKpi.find(k => k?.userId === userId);
    if (!kpi) return '-';
    
    return `${(kpi.presenceRate || 0).toFixed(1)}%`;
  }

  getAbsenceDays(userId: string): number {
    const kpi = this.allUsersKpi.find(k => k?.userId === userId);
    if (!kpi) return 0;
    
    return kpi.absenceDays || 0;
  }

  getPresence(userId: string): boolean | null {
    const kpi = this.allUsersKpi.find(k => k?.userId === userId);
    if (!kpi) return null;
    
    const presenceRate = kpi.presenceRate || 0;
    return presenceRate > 50;
  }

  getPresenceCount(userId: string): { present: number; total: number } {
    const kpi = this.allUsersKpi.find(k => k?.userId === userId);
    if (!kpi) return { present: 0, total: 0 };
    
    let estimatedDays = 5;
    if (this._selectedPeriod === 'quarter') estimatedDays = 65;
    if (this._selectedPeriod === 'year') estimatedDays = 260;
    
    const presenceRate = kpi.presenceRate || 0;
    const present = Math.round((presenceRate / 100) * estimatedDays);
    
    return { present, total: estimatedDays };
  }

  async ngOnInit(): Promise<void> {
    this.loading = true;

    try {
      await this.loadTeamsAndUsers();
      await this.loadAllKpiData();
    } catch (error) {
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
  }

  get teams(): string[] {
    return this.allTeams.map(t => t.name);
  }

  private async loadTeamsAndUsers(): Promise<void> {
    const teamsQuery = `
      query {
        teams {
          id
          name
          members {
            id
            firstName
            lastName
            email
          }
        }
      }
    `;

    try {
      const response = await firstValueFrom(
        this.http.post<GraphQLResponse<{ teams: any[] }>>(
          this.GRAPHQL_ENDPOINT,
          { query: teamsQuery },
          { withCredentials: true }
        )
      );

      if (response?.data?.teams) {
        this.allTeams = response.data.teams;
        
        // Build users list from teams
        const usersMap = new Map<string, any>();
        this.allTeams.forEach(team => {
          team.members.forEach((member: any) => {
            if (!usersMap.has(member.id)) {
              usersMap.set(member.id, {
                id: member.id,
                nom: `${member.firstName} ${member.lastName}`,
                equipe: team.name,
                historique: []
              });
            }
          });
        });
        
        this.users = Array.from(usersMap.values());
        this.updateFilteredUsers();
      }
    } catch (error) {
    }
  }

  private async loadAllKpiData(): Promise<void> {
    const { startDate, endDate } = this.getDateRange();
    
    // Load KPI for all users
    const promises = this.users.map(user => this.loadUserKpi(user.id, startDate, endDate));
    
    try {
      this.allUsersKpi = await Promise.all(promises);
      this.updateFilteredByPeriod();
      this.loadKpiData();
    } catch (error) {
    }
  }

  private async loadUserKpi(userId: string, startDate: string, endDate: string): Promise<any> {
    const query = `
      query($userId: ID!, $startDate: String!, $endDate: String!) {
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
    `;

    try {
      const response = await firstValueFrom(
        this.http.post<GraphQLResponse<{ userKpi: any }>>(
          this.GRAPHQL_ENDPOINT,
          { query, variables: { userId, startDate, endDate } },
          { withCredentials: true }
        )
      );

      return response?.data?.userKpi || null;
    } catch (error) {
      return null;
    }
  }

  private getDateRange(): { startDate: string; endDate: string } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (this._selectedPeriod) {
      case 'last_week':
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(now);
        startDate.setDate(now.getDate() + diffToMonday - 7);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'quarter':
        const quarter = getCurrentQuarter();
        startDate = quarter.start;
        endDate = quarter.end;
        break;
      case 'year':
        const year = getYearRange();
        startDate = year.start;
        endDate = year.end;
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        endDate = new Date();
    }

    return {
      startDate: formatDateToYYYYMMDD(startDate),
      endDate: formatDateToYYYYMMDD(endDate)
    };
  }

  get presentCount(): number {
    const today = new Date().toDateString();
    return this.users.filter((u) =>
      u.historique.some(
        (h) => h.date.toDateString() === today && h.presence
      )
    ).length;
  }

  get absentCount(): number {
    const today = new Date().toDateString();
    return this.users.filter((u) =>
      u.historique.some(
        (h) => h.date.toDateString() === today && !h.presence
      )
    ).length;
  }

  updateFilteredUsers() {
    this.filteredUsers = this.selectedTeam
      ? this.users.filter((u) => u.equipe === this.selectedTeam)
      : [...this.users];
  }

  filterByPeriod(
    users: Utilisateur[]
  ): Array<{ user: Utilisateur; day: PresenceDuJour }> {
    const now = new Date();
    const result: Array<{ user: Utilisateur; day: PresenceDuJour }> = [];

    users.forEach((user) => {
      user.historique.forEach((day) => {
        if (this._selectedTeam && user.equipe !== this._selectedTeam) return;

        // Last Week filter, shows previous week
        if (this._selectedPeriod === 'last_week') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dayOfWeek = today.getDay();
          const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

          const lastWeekStart = new Date(today);
          lastWeekStart.setDate(today.getDate() + diffToMonday - 7);
          lastWeekStart.setHours(0, 0, 0, 0);

          const lastWeekEnd = new Date(lastWeekStart);
          lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
          lastWeekEnd.setHours(23, 59, 59, 999);

          if (day.date >= lastWeekStart && day.date <= lastWeekEnd) {
            result.push({ user, day });
          }
        }

        // Quarter filter, shows last 3 months
        if (this._selectedPeriod === 'quarter') {
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          threeMonthsAgo.setHours(0, 0, 0, 0);

          if (day.date >= threeMonthsAgo && day.date <= now) {
            result.push({ user, day });
          }
        }

        // Year filter, shows last 12 months
        if (this._selectedPeriod === 'year') {
          const oneYearAgo = new Date(now);
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          oneYearAgo.setHours(0, 0, 0, 0);

          if (day.date >= oneYearAgo && day.date <= now) {
            result.push({ user, day });
          }
        }
      });
    });
    return result;
  }

  private updateFilteredByPeriod() {
    this.filteredByPeriod = this.filterByPeriod(this.users);
  }

  selectKpi(kpi: 'absenteeism' | 'attendance' | 'productivity') {
    this.selectedKpi = kpi;
    this.loadKpiData();
  }

  loadKpiData() {
    const filtered = this.filteredByPeriod;

    // Always load all KPI data for display in buttons
    this.loadAbsenteeismData(filtered);
    this.loadAttendanceData(filtered);
    this.loadProductivityData(filtered);
  }

  loadAbsenteeismData(
    filtered: Array<{ user: Utilisateur; day: PresenceDuJour }>
  ) {
    const byName: Record<string, number> = {};
    
    this.allUsersKpi.forEach(kpi => {
      if (!kpi) return;
      
      const user = this.users.find(u => u.id === kpi.userId);
      if (!user) return;
      
      if (this._selectedTeam && user.equipe !== this._selectedTeam) return;
      
      byName[kpi.fullName] = kpi.absenceDays || 0;
    });

    this.absenteeismStats = {
      totalAbsences: Object.values(byName).reduce((s, v) => s + v, 0),
      byName,
    };

    this.topAbsences = Object.entries(byName)
      .filter(([_, c]) => c > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    this.absenteeismChartData = Object.entries(byName)
      .map(([name, value]) => ({ 
        name: name.split(' ')[0],
        value: value 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    if (this.selectedKpi === 'absenteeism') {
      this.barChartData = this.absenteeismChartData;
    }

    const labels = Object.keys(byName).slice(0, 5);
    const data = labels.map(name => byName[name]);

    this.pieChartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#D946EF', '#fa8bedff', '#C084FC', '#F0ABFC', '#E879F9'],
        },
      ],
    };
  }

  loadAttendanceData(
    filtered: Array<{ user: Utilisateur; day: PresenceDuJour }>
  ) {
    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;
    const byName: Record<string, number> = {};

    this.allUsersKpi.forEach(kpi => {
      if (!kpi) return;
      
      const user = this.users.find(u => u.id === kpi.userId);
      if (!user) return;
      
      if (this._selectedTeam && user.equipe !== this._selectedTeam) return;
      
      const presenceRate = kpi.presenceRate || 0;
      const lateRate = kpi.punctuality?.lateRate || 0;
      
      byName[kpi.fullName] = presenceRate;
      
      if (presenceRate >= 50) {
        totalPresent++;
      } else if (lateRate > 20) {
        totalLate++;
      } else {
        totalAbsent++;
      }
    });

    this.attendanceStats = { present: totalPresent, late: totalLate, absent: totalAbsent };

    this.topAttendance = Object.entries(byName)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    this.attendanceChartData = Object.entries(byName)
      .map(([name, value]) => ({ 
        name: name.split(' ')[0],
        value: value 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    if (this.selectedKpi === 'attendance') {
      this.barChartData = this.attendanceChartData;
    }

    const total = totalPresent + totalAbsent + totalLate || 1;
    this.pieChartData.datasets[0].data = [
      Math.round((totalPresent / total) * 100),
      Math.round((totalAbsent / total) * 100),
    ];
    this.pieChartData.labels = ['Present', 'Absent'];
  }

  loadProductivityData(
    filtered: Array<{ user: Utilisateur; day: PresenceDuJour }>
  ) {
    let totalHoursWorked = 0;
    let totalUsers = 0;
    const byName: Record<string, number> = {};

    this.allUsersKpi.forEach(kpi => {
      if (!kpi) return;
      
      const user = this.users.find(u => u.id === kpi.userId);
      if (!user) return;
      
      if (this._selectedTeam && user.equipe !== this._selectedTeam) return;
      
      const avgHours = kpi.avgHoursPerDay || 0;
      totalHoursWorked += avgHours;
      totalUsers++;
      
      byName[kpi.fullName] = avgHours;
    });

    const averageHours = totalUsers > 0 ? totalHoursWorked / totalUsers : 0;
    const productivityRate = Math.min(100, Math.round((averageHours / 8) * 100));

    this.productivityStats = {
      totalHours: +totalHoursWorked.toFixed(2),
      averageHours: +averageHours.toFixed(2),
      productivityRate,
    };

    this.topProductivity = Object.entries(byName)
      .map(([name, hours]) => {
        const percent = Math.round((hours / 8) * 100);
        return { name, percent };
      })
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 10);
    this.productivityChartData = Object.entries(byName)
      .map(([name, value]) => ({ 
        name: name.split(' ')[0],
        value: value 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    if (this.selectedKpi === 'productivity') {
      this.barChartData = this.productivityChartData;
    }

    this.pieChartData.datasets[0].data = [
      productivityRate,
      100 - productivityRate,
    ];
    this.pieChartData.labels = ['Productivity', 'Non-Productivity'];
  }

  private updateBarChartData() {
    switch (this.selectedKpi) {
      case 'absenteeism':
        this.barChartData = this.absenteeismChartData;
        break;
      case 'attendance':
        this.barChartData = this.attendanceChartData;
        break;
      case 'productivity':
        this.barChartData = this.productivityChartData;
        break;
    }
  }

  getComparativeMonthlyData(
    selectedKpi: 'absenteeism' | 'attendance' | 'productivity'
  ) {
    const months = [
      'Jan',
      'Fév',
      'Mars',
      'Avr',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Sept',
      'Oct',
      'Nov',
      'Déc',
    ];
    const teams = this._selectedTeam 
      ? [this._selectedTeam] 
      : this.allTeams.map(t => t.name);

    const data: { [team: string]: number[] } = {};

    teams.forEach((team) => {
      data[team] = months.map((_, monthIndex) => {
        const teamUsers = this.users.filter((u) => u.equipe === team);
        
        const teamKpis = this.allUsersKpi.filter(kpi => {
          if (!kpi) return false;
          const user = this.users.find(u => u.id === kpi.userId);
          return user && user.equipe === team;
        });

        if (selectedKpi === 'absenteeism') {
          const totalAbsences = teamKpis.reduce((sum, kpi) => 
            sum + (kpi.absenceDays || 0), 0
          );
          return totalAbsences;
        }

        if (selectedKpi === 'attendance') {
          if (teamKpis.length === 0) return 0;
          const avgPresenceRate = teamKpis.reduce((sum, kpi) => 
            sum + (kpi.presenceRate || 0), 0
          ) / teamKpis.length;
          return Math.round(avgPresenceRate);
        }

        if (selectedKpi === 'productivity') {
          if (teamKpis.length === 0) return 0;
          const avgHours = teamKpis.reduce((sum, kpi) => 
            sum + (kpi.avgHoursPerDay || 0), 0
          ) / teamKpis.length;
          return Math.min(100, Math.round((avgHours / 8) * 100));
        }

        return 0;
      });
    });

    return { months, teams, data };
  }

    exportReportEmployeesPdf() {

  const mapped: ReportableEmployee[] = this.filteredUsers.map(user => {
    const kpi = this.allUsersKpi.find(k => k?.userId === user.id);

    return {
      name: user.nom,
      team: user.equipe,
      presence: kpi?.presenceRate ?? 0,
      late: kpi?.punctuality?.lateRate ?? 0,
      absence: kpi?.absenceDays ?? 0,
      weeklyHours: kpi?.avgHoursPerDay ?? 0,
      productivity: Math.min(100, Math.round(((kpi?.avgHoursPerDay ?? 0) / 8) * 100)),
      tasksDone: kpi?.reportsAuthored ?? 0
    };
  });

  this.reportPdfService.exportEmployeesReportPdf(
    this.selectedTeam || "Entreprise",
    mapped
  );
}

exportReportEmployeePdf() {
  const user = this.filteredUsers[0]; 
  const kpi = this.allUsersKpi.find(k => k?.userId === user.id);

  if (!kpi) {
    return;
  }

  const employee: ReportableEmployee = {
    name: user.nom,
    team: user.equipe,
    presence: kpi.presenceRate ?? 0,
    late: kpi.punctuality?.lateRate ?? 0,
    absence: kpi.absenceDays ?? 0,
    weeklyHours: kpi.avgHoursPerDay ?? 0,
    productivity: Math.min(100, Math.round(((kpi.avgHoursPerDay ?? 0) / 8) * 100)),
    overtime: kpi.overtimeHours ?? 0
  };

  this.reportPdfService.exportEmployeeReportPdf(employee);
}

exportReportEmployeesExcel() {

  const mapped: ReportableEmployee[] = this.filteredUsers.map(user => {
    const kpi = this.allUsersKpi.find(k => k?.userId === user.id);

    return {
      name: user.nom,
      team: user.equipe,
      presence: kpi?.presenceRate ?? 0,
      late: kpi?.punctuality?.lateRate ?? 0,
      absence: kpi?.absenceDays ?? 0,
      weeklyHours: kpi?.avgHoursPerDay ?? 0,
      productivity: Math.min(100, Math.round(((kpi?.avgHoursPerDay ?? 0) / 8) * 100)),
      overtime: kpi?.overtimeHours ?? 0
    };
  });

  this.reportService.exportEmployeesReport(mapped);
}
}