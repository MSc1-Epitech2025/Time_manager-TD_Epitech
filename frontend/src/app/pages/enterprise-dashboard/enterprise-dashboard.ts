import { Component, OnDestroy, OnInit } from '@angular/core';
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

// Services
import {
  KpiService,
  Utilisateur,
  PresenceDuJour,
} from '../../core/services/kpi';

// Kpi Components
import { KpiAssiduiteComponent } from '../../kpi/kpi-assiduite/kpi-assiduite';
import { KpiComparatifComponent } from '../../kpi/kpi-comparatif/kpi-comparatif';


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
    KpiAssiduiteComponent,
    KpiComparatifComponent,
  ],
  styleUrls: ['./enterprise-dashboard.scss'],
})
export class EnterpriseDashboard implements OnInit, OnDestroy {
  users: Utilisateur[] = [];
  loading = false;

  selectedKpi: 'absenteeism' | 'attendance' | 'productivity' = 'attendance';

  // Toggle visibility for sections
  showSummary = true;
  showChart = true;
  showTopList = true;
  showDetailsTable = true;
  showComparative = true;

  private _selectedTeam = '';
  private _selectedPeriod: 'last_week' | 'quarter' | 'year' = 'last_week';

  get selectedTeam(): string {
    return this._selectedTeam;
  }
  set selectedTeam(value: string) {
    if (this._selectedTeam !== value) {
      this._selectedTeam = value;
      this.updateFilteredUsers();
      this.updateFilteredByPeriod();
      this.loadKpiData();
    }
  }

  get selectedPeriod(): 'last_week' | 'quarter' | 'year' {
    return this._selectedPeriod;
  }
  set selectedPeriod(value: 'last_week' | 'quarter' | 'year') {
    if (this._selectedPeriod !== value) {
      this._selectedPeriod = value;
      this.updateFilteredUsers();
      this.updateFilteredByPeriod();
      this.loadKpiData();
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
  private sessionStartTimestamp?: number;

  filteredUsers: Utilisateur[] = [];

  constructor(private kpiService: KpiService) {}

  getPointage(userId: string): string {
    const entry = this.filteredByPeriod.find((f) => f.user.id === userId);
    return entry?.day?.pointage ? entry.day.pointage : '-';
  }

  getTempsTravail(userId: string): string {
    const entries = this.filteredByPeriod.filter((f) => f.user.id === userId);
    if (entries.length === 0) return '-';

    let totalMinutes = 0;

    entries.forEach((e) => {
      const t = e.day?.tempsTravail;
      const minutes = this.toMinutes(t);
      totalMinutes += minutes;
    });

    return this.fromMinutes(totalMinutes);
  }

  private toMinutes(t: string | undefined): number {
    if (!t) return 0;
    const match = t.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 0;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return hours * 60 + minutes;
  }

  private fromMinutes(total: number): string {
    const h = Math.floor(total / 60);
    const m = total % 60;

    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}`;
  }

  private normalizeTime(t: string | undefined): string {
    if (!t) return '-';
    const minutes = this.toMinutes(t);
    return this.fromMinutes(minutes);
  }

  getPresence(userId: string): boolean | null {
    const entry = this.filteredByPeriod.find((f) => f.user.id === userId);
    return entry?.day?.presence ?? null;
  }

  getPresenceCount(userId: string): { present: number; total: number } {
    const userEntries = this.filteredByPeriod.filter(
      (f) => f.user.id === userId
    );
    const present = userEntries.filter((f) => f.day.presence === true).length;
    const total = userEntries.length;
    return { present, total };
  }

  ngOnInit(): void {
    console.log('Enterprise Dashboard initialized.');
    this.loading = true;

    this.kpiService.loadFullData().subscribe((data) => {
      this.users = data;
      this.loading = false;
      console.log('KPI data loaded for enterprise dashboard.', data);

      this.updateFilteredUsers();
      this.updateFilteredByPeriod();
      this.loadKpiData();
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
  }

  get teams(): string[] {
    return [...new Set(this.users.map((u) => u.equipe))];
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

        // Last Week filter - shows previous week (Mon-Sun)
        if (this._selectedPeriod === 'last_week') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dayOfWeek = today.getDay();
          const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

          // Last week's Monday
          const lastWeekStart = new Date(today);
          lastWeekStart.setDate(today.getDate() + diffToMonday - 7);
          lastWeekStart.setHours(0, 0, 0, 0);

          // Last week's Sunday
          const lastWeekEnd = new Date(lastWeekStart);
          lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
          lastWeekEnd.setHours(23, 59, 59, 999);

          if (day.date >= lastWeekStart && day.date <= lastWeekEnd) {
            result.push({ user, day });
          }
        }

        // Quarter filter - shows last 3 months
        if (this._selectedPeriod === 'quarter') {
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          threeMonthsAgo.setHours(0, 0, 0, 0);

          if (day.date >= threeMonthsAgo && day.date <= now) {
            result.push({ user, day });
          }
        }

        // Year filter - shows last 12 months
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
    this.updateFilteredUsers();
    this.loadKpiData();
  }

  loadKpiData() {
    const filtered = this.filteredByPeriod;

    if (this.selectedKpi === 'absenteeism') this.loadAbsenteeismData(filtered);
    else if (this.selectedKpi === 'attendance')
      this.loadAttendanceData(filtered);
    else if (this.selectedKpi === 'productivity')
      this.loadProductivityData(filtered);
  }

  loadAbsenteeismData(
    filtered: Array<{ user: Utilisateur; day: PresenceDuJour }>
  ) {
    const byName: Record<string, number> = {};
    filtered.forEach(({ user, day }) => {
      byName[user.nom] = (byName[user.nom] || 0) + (day.absences || 0);
    });

    this.absenteeismStats = {
      totalAbsences: Object.values(byName).reduce((s, v) => s + v, 0),
      byName,
    };

    this.topAbsences = Object.entries(byName)
      .filter(([_, c]) => c > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const labels = Object.keys(byName);
    const data = Object.values(byName);

    this.pieChartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#D946EF', '#fa8bedff', '#C084FC', '#F0ABFC'],
        },
      ],
    };
  }

  loadAttendanceData(
    filtered: Array<{ user: Utilisateur; day: PresenceDuJour }>
  ) {
    const total = filtered.length || 1;
    const present = filtered.filter((f) => f.day.presence).length;
    const late = filtered.filter((f) => {
      if (!f.day.presence || !f.day.pointage) return false;
      const [hours, minutes] = f.day.pointage.split(':').map(Number);
      return hours > 9 || (hours === 9 && minutes > 15);
    }).length;
    const absent = filtered.filter((f) => !f.day.presence).length;
    this.attendanceStats = { present, late, absent };

    const byName: Record<string, number> = {};
    filtered.forEach(({ user, day }) => {
      if (day.presence) {
        byName[user.nom] = (byName[user.nom] || 0) + 1;
      }
    });

    this.topAttendance = Object.entries(byName)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    this.pieChartData.datasets[0].data = [
      Math.round((present / total) * 100),
      Math.round((absent / total) * 100),
    ];
  }

  loadProductivityData(
    filtered: Array<{ user: Utilisateur; day: PresenceDuJour }>
  ) {
    const byName: Record<string, number> = {};
    filtered.forEach(({ user, day }) => {
      const m = day.tempsTravail?.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
      const hh = m ? Number(m[1] || 0) : 0;
      const mm = m ? Number(m[2] || 0) : 0;
      const hoursWorked = hh + mm / 60;

      byName[user.nom] = (byName[user.nom] || 0) + hoursWorked;
    });

    const totalHoursWorked = Object.values(byName).reduce(
      (s, h) => s + h,
      0
    );
    const totalHoursPlanned = filtered.length * 8;
    const productivityRate = totalHoursPlanned
      ? Math.min(
          100,
          Math.round((totalHoursWorked / totalHoursPlanned) * 100)
        )
      : 0;

    this.productivityStats = {
      totalHours: +totalHoursWorked.toFixed(2),
      averageHours: +(totalHoursWorked / filtered.length || 0).toFixed(2),
      productivityRate,
    };

    this.topProductivity = Object.entries(byName)
      .map(([name, hours]) => {
        const percent = totalHoursPlanned
          ? Math.round((hours / totalHoursPlanned) * 100)
          : 0;
        return { name, percent };
      })
      .sort((a, b) => b.percent - a.percent);

    this.pieChartData.datasets[0].data = [
      productivityRate,
      100 - productivityRate,
    ];
  }

  // Toggle methods for showing/hiding sections
  toggleSummary() {
    this.showSummary = !this.showSummary;
  }

  toggleChart() {
    this.showChart = !this.showChart;
  }

  toggleTopList() {
    this.showTopList = !this.showTopList;
  }

  toggleDetailsTable() {
    this.showDetailsTable = !this.showDetailsTable;
  }

  toggleComparative() {
    this.showComparative = !this.showComparative;
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
    const teams = [...new Set(this.users.map((u) => u.nom))];

    const data: { [team: string]: number[] } = {};

    teams.forEach((team) => {
      data[team] = months.map((_, monthIndex) => {
        const teamUsers = this.users.filter((u) => u.equipe === team);

        if (selectedKpi === 'absenteeism') {
          const totalAbsences = teamUsers.reduce(
            (sum, u) =>
              sum +
              u.historique
                .filter((h) => h.date.getMonth() === monthIndex)
                .reduce((s, h) => s + h.absences, 0),
            0
          );
          return totalAbsences;
        }

        if (selectedKpi === 'attendance') {
          const totalEmployees = teamUsers.length || 1;
          const presentCount = teamUsers.reduce(
            (sum, u) =>
              sum +
              u.historique.filter(
                (h) =>
                  h.date.getMonth() === monthIndex && h.presence
              ).length,
            0
          );
          const uniqueDays =
            new Set(
              teamUsers.flatMap((u) =>
                u.historique
                  .filter((h) => h.date.getMonth() === monthIndex)
                  .map((h) => h.date.toDateString())
              )
            ).size || 1;

          const percentage =
            (presentCount / (totalEmployees * uniqueDays)) * 100;
          return Math.round(percentage);
        }

        if (selectedKpi === 'productivity') {
          const daysInMonth = new Date(
            new Date().getFullYear(),
            monthIndex + 1,
            0
          ).getDate();

          const totalHoursWorked = teamUsers.reduce(
            (sum, u) =>
              sum +
              u.historique
                .filter((h) => h.date.getMonth() === monthIndex)
                .reduce((s, h) => {
                  const m = h.tempsTravail?.match(
                    /(?:(\d+)h)?\s*(?:(\d+)m)?/
                  );
                  const hh = m ? Number(m[1] || 0) : 0;
                  const mm = m ? Number(m[2] || 0) : 0;
                  return s + hh + mm / 60;
                }, 0),
            0
          );

          const totalHoursPlanned =
            teamUsers.length * 8 * daysInMonth;
          return totalHoursPlanned
            ? Math.min(
                100,
                Math.round((totalHoursWorked / totalHoursPlanned) * 100)
              )
            : 0;
        }

        return 0;
      });
    });

    return { months, teams, data };
  }
}