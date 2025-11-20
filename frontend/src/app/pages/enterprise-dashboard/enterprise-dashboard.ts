import { Component, OnDestroy, OnInit } from '@angular/core';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgChartsModule } from 'ng2-charts';
import { ChartOptions } from 'chart.js';
import { Router } from '@angular/router';

//Service (gardés mais non utilisés pour le mode fake)
import { ManagerService } from '../../core/services/manager';
import { AuthService } from '../../core/services/auth';
import { EnterpriseService } from '../../core/services/enterprise';
import { ReportService } from '../../core/services/report';
import { KpiService } from '../../core/services/kpi';

// Kpi Components
import { KpiAssiduiteComponent } from '../../kpi/kpi-assiduite/kpi-assiduite';
import { KpiAbsenteismeComponent } from '../../kpi/kpi-absenteisme/kpi-absenteisme';
import { KpiComparatifComponent } from '../../kpi/kpi-comparatif/kpi-comparatif';
import { KpiCongesComponent } from '../../kpi/kpi-conges/kpi-conges';
import { KpiProductiviteComponent } from '../../kpi/kpi-productivite/kpi-productivite';
import { KpiRapportsComponent } from '../../kpi/kpi-rapports/kpi-rapports';

// Data 
import { users } from '../../core/data/registre_presence_oct_nov';

interface PresenceDuJour {
  date: Date;
  presence: boolean;
  absences: number;
  pointage: string | null;
  tempsTravail: string;
}

interface Utilisateur {
  id: string;
  nom: string;
  equipe: string;
  historique: PresenceDuJour[];
}
import { KpiComparatifComponent } from '../../kpi/kpi-comparatif/kpi-comparatif';

// Data 
import { users } from '../../core/data/registre_presence_oct_nov';

interface PresenceDuJour {
  date: Date;
  presence: boolean;
  absences: number;
  pointage: string | null;
  tempsTravail: string;
}

interface Utilisateur {
  id: string;
  nom: string;
  equipe: string;
  historique: PresenceDuJour[];
}

@Component({
  selector: 'app-enterprise-dashboard',
  templateUrl: './enterprise-dashboard.html',
  imports: [
    CommonModule,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatTabsModule,
    MatFormFieldModule,
    MatTabsModule,
    MatInputModule,
    NgChartsModule,
    KpiAssiduiteComponent,
    KpiAbsenteismeComponent,
    KpiComparatifComponent,
    KpiCongesComponent,
    KpiProductiviteComponent,
    KpiAssiduiteComponent,
    KpiComparatifComponent,
  ],
  styleUrls: ['./enterprise-dashboard.scss']
})
export class EnterpriseDashboard implements OnInit, OnDestroy {
  // --- état
  isWorking = false;
  timer = 0;
  time: { hours: number; minutes: number } = { hours: 0, minutes: 0 };
  status = 'startWorking';

  // ---------- Fake data local ----------
  users: Utilisateur[] = users;
  // backend users (non utilisés en fake mode)
  //user: User[] = [];
  loading = false;

  // KPI selection
  selectedKpi: 'absenteeism' | 'attendance' | 'productivity' = 'absenteeism';

  // internal backing fields for setters
  private _selectedTeam = '';
  private _selectedPeriod: 'day' | 'week' | 'month' = 'day';

  // exposeers via getters/setters to trigger recalcul
  get selectedTeam(): string {
    return this._selectedTeam;
  }
  set selectedTeam(value: string) {
    if (this._selectedTeam !== value) {
      this._selectedTeam = value;
      this.updateFilteredUsers();
      this.updateFilteredByPeriod(); // recalculer quand équipe change
      this.loadKpiData();
    }
  }

  get selectedPeriod(): 'day' | 'week' | 'month' {
    return this._selectedPeriod;
  }
  set selectedPeriod(value: 'day' | 'week' | 'month') {
    if (this._selectedPeriod !== value) {
      this._selectedPeriod = value;
      this.updateFilteredByPeriod(); // recalculer quand période change
      this.loadKpiData();
    }
  }

  // résultat du filtrage par période (couples user/day) -> utilisé par template
  filteredByPeriod: Array<{ user: Utilisateur; day: PresenceDuJour }> = [];

  // KPI data computed locally
  absenteeismStats: { totalAbsences: number; byName?: Record<string, number> } | null = null;
  topAbsences: Array<{ name: string; count: number }> = [];

  attendanceStats: { present: number; absent: number; late: number } | null = null;
  topAttendance: Array<{ name: string; count: number }> = [];

  attendanceList: Array<{ name: string; in?: string; out?: string; present: boolean; late?: boolean }> = [];
  

  productivityStats: {
    totalHours: number;
    averageHours: number;
    productivityRate: number;
  } | null = null;
  productivityList: Array<{ name: string; hours: number }> = [];
  topProductivity: Array<{ name: string; hours: number }> = [];


  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Presence', 'Delays', 'Absences'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#A78BFA', '#F472B6', '#C084FC'],
      },
    ],
  };
export class EnterpriseDashboard implements OnInit, OnDestroy {
  isWorking = false;
  timer = 0;
  time: { hours: number; minutes: number } = { hours: 0, minutes: 0 };
  status = 'startWorking';

  users: Utilisateur[] = users;
  loading = false;

  selectedKpi: 'absenteeism' | 'attendance' | 'productivity' = 'absenteeism';

  private _selectedTeam = '';
  private _selectedPeriod: 'day' | 'week' | 'month' = 'day';

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

  get selectedPeriod(): 'day' | 'week' | 'month' {
    return this._selectedPeriod;
  }
  set selectedPeriod(value: 'day' | 'week' | 'month') {
    if (this._selectedPeriod !== value) {
      this._selectedPeriod = value;
      this.updateFilteredUsers();
      this.updateFilteredByPeriod();
      this.loadKpiData();
    }
  }

  filteredByPeriod: Array<{ user: Utilisateur; day: PresenceDuJour }> = [];

  absenteeismStats: { totalAbsences: number; byName?: Record<string, number> } | null = null;
  topAbsences: Array<{ name: string; count: number }> = [];

  attendanceStats: { present: number; absent: number; late: number } | null = null;
  topAttendance: Array<{ name: string; count: number }> = [];
  attendanceList: Array<{ name: string; in?: string; out?: string; present: boolean; late?: boolean }> = [];

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
          backgroundColor: ['#A78BFA', '#C084FC']
        }
      ]
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

  constructor(
    private router: Router,
    private auth: AuthService,
    private managerService: ManagerService,
    private reportService: ReportService,
    private enterpriseService: EnterpriseService, // injected but unused in fake mode
    private kpiService: KpiService
  ) { }

  // ------------------ Méthodes utilitaires ajoutées ------------------
  // Ces méthodes évitent de mettre de la logique complexe dans le template.
  getPointage(userId: string): string {
    const entry = this.filteredByPeriod.find(f => f.user.id === userId);
    // return '-' si introuvable ou valeur vide
    return entry?.day?.pointage ? entry.day.pointage : '-';
  }

  getTempsTravail(userId: string): string {
  const entries = this.filteredByPeriod.filter(f => f.user.id === userId);
  if (entries.length === 0) return '-';

  // --- JOUR ---
  if (this.selectedPeriod === 'day') {
    return this.normalizeTime(entries[0].day?.tempsTravail);
  }

  // --- SEMAINE & MOIS ---
  let totalMinutes = 0;

  entries.forEach(e => {
    const t = e.day?.tempsTravail;
    const minutes = this.toMinutes(t);
    totalMinutes += minutes;
  });

  return this.fromMinutes(totalMinutes);
}

private toMinutes(t: string | undefined): number {
  if (!t) return 0;

  // Exemple : "9h 43m"
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


  // Retourne true/false ou null si inconnu
  getPresence(userId: string): boolean | null {
    const entry = this.filteredByPeriod.find(f => f.user.id === userId);
    return entry?.day?.presence ?? null;
  }
  // ------------------------------------------------------------------



  ngOnInit(): void {
    console.log('Enterprise Dashboard initialized.');
    /*
    // Test d'appel service enterprise
     this.enterpriseService.getCompanySummary().subscribe(data => {
    console.log("Company Summary (TEST) :", data);
  });

  this.enterpriseService.getAllEmployees().subscribe(users => {
    console.log("All Employees (TEST) :", users);
  });
    */
  this.kpiService.loadFullData().subscribe(data => {
    console.log('KPI back data', data);

    // transformer les données ici
    // créer une structure "users" compatible avec ta fake data actuelle
    //this.users = data;
    //this.users = this.transformToLocalUsers(data);
    this.updateFilteredUsers();
    this.updateFilteredByPeriod();
    this.loadKpiData();
  });


    // init chart example (inchangé)
    const ctx = document.getElementById('globalChart') as HTMLCanvasElement | null;
    if (ctx) {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct'],
          datasets: [
            {
              label: 'Performance globale',
              data: [72, 75, 78, 80, 84, 83, 86, 88, 90, 92],
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37,99,235,0.2)',
              tension: 0.4,
              fill: true,
              borderWidth: 2,
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              min: 60,
              max: 100,
              ticks: { stepSize: 10 }
            }
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
  private intervalId: number | null = null;
  private sessionStartTimestamp?: number;

  filteredUsers: Utilisateur[] = [];

  constructor(
    private kpiService: KpiService
  ) { }

  getPointage(userId: string): string {
    const entry = this.filteredByPeriod.find(f => f.user.id === userId);
    return entry?.day?.pointage ? entry.day.pointage : '-';
  }

  getTempsTravail(userId: string): string {
    const entries = this.filteredByPeriod.filter(f => f.user.id === userId);
    if (entries.length === 0) return '-';
    if (this.selectedPeriod === 'day') {
      return this.normalizeTime(entries[0].day?.tempsTravail);
    }

    let totalMinutes = 0;

    entries.forEach(e => {
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


  // Retourne true/false ou null si inconnu
  getPresence(userId: string): boolean | null {
    const entry = this.filteredByPeriod.find(f => f.user.id === userId);
    return entry?.day?.presence ?? null;
  }

  getPresenceCount(userId: string): { present: number; total: number } {
    const userEntries = this.filteredByPeriod.filter(f => f.user.id === userId);
    const present = userEntries.filter(f => f.day.presence === true).length;
    const total = userEntries.length;
    return { present, total };
  }

  ngOnInit(): void {
    console.log('Enterprise Dashboard initialized.');

    this.kpiService.loadFullData().subscribe(data => {
      //console.log('KPI front data', data);
      //this.users = data; // data from service instead of static import
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

  // ---------- Filtrage / getters ----------
  get teams(): string[] {
    return [...new Set(this.users.map(u => u.equipe))];
  }

  get presentCount(): number {
    const today = new Date().toDateString();
    return this.users.filter(u =>
      u.historique.some(h => h.date.toDateString() === today && h.presence)
    ).length;
  }

  get absentCount(): number {
    const today = new Date().toDateString();
    return this.users.filter(u =>
      u.historique.some(h => h.date.toDateString() === today && !h.presence)
    ).length;
  }

  updateFilteredUsers() {
    this.filteredUsers = this.selectedTeam
      ? this.users.filter(u => u.equipe === this.selectedTeam)
      : [...this.users]; // copie pour éviter un freeze
  }

  // rend publique si besoin ailleurs; mais on l'utilise via updateFilteredByPeriod()
  filterByPeriod(users: Utilisateur[]): Array<{ user: Utilisateur; day: PresenceDuJour }> {
    const now = new Date();
    const result: Array<{ user: Utilisateur; day: PresenceDuJour }> = [];

    users.forEach(user => {
      user.historique.forEach(day => {
        if (this._selectedTeam && user.equipe !== this._selectedTeam) return;

        if (this._selectedPeriod === 'day' && day.date.toDateString() === now.toDateString()) {
          result.push({ user, day });
        }

        if (this._selectedPeriod === 'week') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // getDay() : 0 = dimanche, 1 = lundi, ..., 6 = samedi
            const dayOfWeek = today.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : (1 - dayOfWeek);

            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() + diffToMonday);
            weekStart.setHours(0, 0, 0, 0);

            // Dimanche de cette semaine
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            // Filtre
            if (day.date >= weekStart && day.date <= weekEnd) {
              result.push({ user, day });
            }
          

        }

        if (this._selectedPeriod === 'month' &&
          day.date.getMonth() === now.getMonth() &&
          day.date.getFullYear() === now.getFullYear()) {
          result.push({ user, day });
        }
      });
    });

    console.log('Filtered by period:', result);

    return result;
  }

  // mise à jour contrôlée (évite appel depuis template)
  private updateFilteredByPeriod() {
    this.filteredByPeriod = this.filterByPeriod(this.users);
  }

  // ---------- Navigation KPI ----------
  selectKpi(kpi: 'absenteeism' | 'attendance' | 'productivity') {
    this.selectedKpi = kpi;
    this.loadKpiData();
  }

  // -------------------- KPI loaders --------------------
  loadKpiData() {
    const filtered = this.filteredByPeriod;

    if (this.selectedKpi === 'absenteeism') this.loadAbsenteeismData(filtered);
    else if (this.selectedKpi === 'attendance') this.loadAttendanceData(filtered);
    else if (this.selectedKpi === 'productivity') this.loadProductivityData(filtered);
  }

  loadAbsenteeismData(filtered: Array<{ user: Utilisateur; day: PresenceDuJour }>) {
    const byName: Record<string, number> = {};
    filtered.forEach(({ user, day }) => {
      byName[user.nom] = (byName[user.nom] || 0) + (day.absences || 0);
    });

    this.absenteeismStats = {
      totalAbsences: Object.values(byName).reduce((s, v) => s + v, 0),
      byName
    };

    this.topAbsences = Object.entries(byName)
      .filter(([_, c]) => c > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const totalEmployees = filtered.length || 1;
    const present = filtered.filter(f => f.day.presence).length;
    const absent = filtered.filter(f => !f.day.presence).length;

    this.pieChartData.datasets[0].data = [
      Math.round((present / totalEmployees) * 100),
      0,
      Math.round((absent / totalEmployees) * 100)
    ];
  }

  loadAttendanceData(filtered: Array<{ user: Utilisateur; day: PresenceDuJour }>) {
  const total = filtered.length || 1;

  const present = filtered.filter(f => f.day.presence).length;
  const late = filtered.filter(f => {
    if (!f.day.presence || !f.day.pointage) return false;
    const [hours, minutes] = f.day.pointage.split(':').map(Number);
    return hours > 9 || (hours === 9 && minutes > 15);
  }).length;
  const absent = filtered.filter(f => !f.day.presence).length;

  this.attendanceStats = { present, late, absent };

  // --- Top classement par présence ---
  const byName: Record<string, number> = {};
  filtered.forEach(({ user, day }) => {
    if (day.presence) {
      byName[user.nom] = (byName[user.nom] || 0) + 1;
    }
  });

  this.topAttendance = Object.entries(byName)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  this.pieChartData.datasets[0].data = [
    Math.round((present / total) * 100),
    Math.round((late / total) * 100),
    Math.round((absent / total) * 100)
  ];
}

loadProductivityData(filtered: Array<{ user: Utilisateur; day: PresenceDuJour }>) {
  const byName: Record<string, number> = {};
  filtered.forEach(({ user, day }) => {
    const m = day.tempsTravail?.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
    const hh = m ? Number(m[1] || 0) : 0;
    const mm = m ? Number(m[2] || 0) : 0;
    const hoursWorked = hh + mm / 60;

    byName[user.nom] = (byName[user.nom] || 0) + hoursWorked;
  });

  const totalHoursWorked = Object.values(byName).reduce((s, h) => s + h, 0);
  const totalHoursPlanned = filtered.length * 8; // 8h par jour
  const productivityRate = totalHoursPlanned ? Math.round((totalHoursWorked / totalHoursPlanned) * 100) : 0;

  this.productivityStats = {
    totalHours: +totalHoursWorked.toFixed(2),
    averageHours: +(totalHoursWorked / filtered.length).toFixed(2),
    productivityRate
  };

  // --- Top classement par productivité ---
  this.topProductivity = Object.entries(byName)
    .map(([name, hours]) => ({ name, hours: +hours.toFixed(1) }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 3);

  this.pieChartData.datasets[0].data = [
    productivityRate,
    100 - productivityRate
  ];
}


  // -------------------- Comparatif equipe --------------------
  getComparativeMonthlyData(selectedKpi: 'absenteeism' | 'attendance' | 'productivity') {
    const months = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juillet', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    const teams = [...new Set(this.users.map(u => u.equipe))];

    const data: { [team: string]: number[] } = {};

    teams.forEach(team => {
      data[team] = months.map((month, monthIndex) => {
        const teamUsers = this.users.filter(u => u.equipe === team);

        if (selectedKpi === 'absenteeism') {
          const totalAbsences = teamUsers.reduce((sum, u) =>
            sum + u.historique
              .filter(h => h.date.getMonth() === monthIndex)
              .reduce((s, h) => s + h.absences, 0)
            , 0);
          return totalAbsences;
        }

        if (selectedKpi === 'attendance') {
          const totalEmployees = teamUsers.length || 1;
          const presentCount = teamUsers.reduce((sum, u) =>
            sum + u.historique.filter(h => h.date.getMonth() === monthIndex && h.presence).length
            , 0);
          return Math.round((presentCount / totalEmployees) * 100);
        }

        if (selectedKpi === 'productivity') {
const daysInMonth = new Date(new Date().getFullYear(), monthIndex + 1, 0).getDate();

          const totalHoursWorked = teamUsers.reduce((sum, u) =>
            sum + u.historique
              .filter(h => h.date.getMonth() === monthIndex)
              .reduce((s, h) => {
                const m = h.tempsTravail?.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
                const hh = m ? Number(m[1] || 0) : 0;
                const mm = m ? Number(m[2] || 0) : 0;
                return s + hh + mm / 60;
              }, 0)
            , 0);
          const totalHoursPlanned = teamUsers.length * 8 * daysInMonth;
          return totalHoursPlanned ? Math.min(100, Math.round((totalHoursWorked / totalHoursPlanned) * 100)): 0;
        }

        return 0;
      });
    });

    return { months, teams, data };
  }

  // ---------------------- routes ------------------------
  goToPlanning() {
    this.router.navigate(['/manager/planning']);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  goToTeamManagement() {
    this.router.navigate(['/manager/teams']);
  }
}
