import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { Chart } from 'chart.js/auto';
import { Router } from '@angular/router';

//Service
import { ManagerService } from '../../core/services/manager';
import { AuthService } from '../../core/services/auth';
import { EnterpriseService } from '../../core/services/enterprise';
import { ReportService } from '../../core/services/report';

// Kpi Components 
import { KpiAssiduiteComponent } from '../../kpi/kpi-assiduite/kpi-assiduite';
import { KpiAbsenteismeComponent } from '../../kpi/kpi-absenteisme/kpi-absenteisme'
import { KpiComparatifComponent } from '../../kpi/kpi-comparatif/kpi-comparatif'
import { KpiCongesComponent } from '../../kpi/kpi-conges/kpi-conges';
import { KpiProductiviteComponent } from '../../kpi/kpi-productivite/kpi-productivite';
import { KpiAlertesComponent } from '../../kpi/kpi-alertes/kpi-alertes';
import { KpiRapportsComponent } from '../../kpi/kpi-rapports/kpi-rapports'

@Component({
  selector: 'app-enterprise-dashboard',
  templateUrl: './enterprise-dashboard.html',
  imports: [CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule, MatTabsModule,
    MatInputModule,
    NgChartsModule,
    KpiAssiduiteComponent, KpiAbsenteismeComponent, KpiAlertesComponent, KpiComparatifComponent, KpiCongesComponent,
    KpiProductiviteComponent,
  ],
  styleUrls: ['./enterprise-dashboard.scss']
})

export class EnterpriseDashboard implements OnDestroy {
  isWorking: boolean = false;
  timer: number = 0;
  time: { hours: number, minutes: number } = { hours: 0, minutes: 0 };
  //dataSource: Array<{ start: string; end?: string; durationSeconds: number }> = [];
  user: any = null;
  status: string = 'startWorking';

  constructor(
    private router: Router,
    private auth: AuthService,
    private managerService: ManagerService,
    private reportService: ReportService,
    private enterpriseService: EnterpriseService
  ) { }

  private intervalId: number | null = null;
  private sessionStartTimestamp?: number;

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
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#F9FAFB' },
      },
    },
  };


  ngOnInit() {
    this.managerService.getTeamEmployees().subscribe((data) => {
      this.user = data[0];
    });

    const ctx = document.getElementById('globalChart') as HTMLCanvasElement;
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

    const data = { presence: 80, late: 10, absent: 10 };
    this.pieChartData.datasets[0].data = [
      data.presence,
      data.late,
      data.absent,
    ];

    this.enterpriseService.getEmployees().then(user => {
      this.user = user;
      console.log('Informations des employés récupérées :', this.user);
    }).catch(error => {
      console.error('Erreur lors de la récupération des informations du manager :', error);
    });
  }

  toggleWorkStatus() {
    if (this.isWorking) {
      this.pauseTimer();
      this.status = 'startWorking';
    } else {
      this.startTimer();
      this.status = 'pauseWorking';
    }
  }

  startTimer() {
    if (this.isWorking) return;
    this.isWorking = true;
    this.sessionStartTimestamp = Date.now();
    this.timer = 0;
    this.intervalId = window.setInterval(() => {
      this.timer++;
    }, 1000);
  }

  pauseTimer() {
    if (!this.isWorking) return;
    this.isWorking = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    const end = Date.now();
    const start = this.sessionStartTimestamp ?? end;
    const durationSeconds = Math.round((end - start) / 1000);
    // reset session state
    this.sessionStartTimestamp = undefined;
    this.timer = 0;
  }

  resetTimer() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isWorking = false;
    this.timer = 0;
    this.sessionStartTimestamp = undefined;
  }
  exportData(){
    console.log('exportData button pressed') 
    //this.reportService.exportEmployeeReport()
  }

  // utility to format timer as HH:MM:SS for template
  get formattedTimer(): string {
    const min = Math.floor(this.timer / 60) % 60;
    const hr = Math.floor(this.timer / 3600);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hr)}:${pad(min)}`;
  }

  // ---------- Nouveaux utilitaires pour total journalier ----------
  // calcule l'intervalle (en secondes) d'un segment [s,e] qui tombe sur la date donnée (local time)
  private secondsOverlapWithDate(sessionStart: Date, sessionEnd: Date, date: Date): number {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000); // exclusive end
    const start = sessionStart > dayStart ? sessionStart : dayStart;
    const end = sessionEnd < dayEnd ? sessionEnd : dayEnd;
    const ms = end.getTime() - start.getTime();
    return ms > 0 ? Math.floor(ms / 1000) : 0;
  }

  // retourne le total de secondes travaillées pour une date donnée (inclut session en cours)
  getTotalSecondsForDate(date: Date): number {
    let total = 0;
    // session en cours (si active)
    if (this.isWorking && this.sessionStartTimestamp) {
      const runningStart = new Date(this.sessionStartTimestamp);
      const runningEnd = new Date(); // now
      total += this.secondsOverlapWithDate(runningStart, runningEnd, date);
    }
    return total;
  }

  // getters pratiques pour aujourd'hui
  get todayTotalSeconds(): number {
    return this.getTotalSecondsForDate(new Date());
  }

  get todayHoursMinutes(): { hours: number; minutes: number } {
    const s = this.todayTotalSeconds;
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    return { hours, minutes };
  }

  // formatte les secondes en "Hh Mm"
  formatDuration(seconds: number, short = true): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (short) return `${h}h ${m}m`;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  // ---------- routes ----------
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


  // ---------- fin utilitaires ----------

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
  }
}

