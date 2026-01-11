import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/services/auth';
import { TeamService } from '@core/services/team';
import { ClockService } from '@core/services/clock';
import { KpiBarChartComponent, BarChartData } from '@kpi/kpi-bar-chart/kpi-bar-chart';

interface TodayEmployee {
  id: string;
  name: string;
  team: string;
  clockIn: string;
  clockOut?: string;
  isPresent: boolean;
}

@Component({
  selector: 'app-today-dashboard',
  standalone: true,
  templateUrl: './today-dashboard.html',
  styleUrls: ['./today-dashboard.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    KpiBarChartComponent,
  ],
})
export class TodayDashboard implements OnInit {
  loading = false;
  selectedTeam = '';
  teams: string[] = [];
  allTeams: any[] = [];
  allUsers: any[] = [];
  todayEmployees: TodayEmployee[] = [];
  filteredEmployees: TodayEmployee[] = [];
  
  presentCount = 0;
  absentCount = 0;
  
  barChartData: BarChartData[] = [];
  
  userRole: string = '';

  get presentEmployees(): TodayEmployee[] {
    return this.filteredEmployees.filter(e => e.isPresent);
  }

  constructor(
    private auth: AuthService,
    private teamService: TeamService,
    private clockService: ClockService
  ) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    
    const session = this.auth.session;
    this.userRole = session?.user.roles[0] || 'EMPLOYEE';
    
    try {
      await this.loadTeamsAndUsers();
      await this.loadTodayData();
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      this.loading = false;
    }
  }

  private async loadTeamsAndUsers(): Promise<void> {
    try {
      let teams;
      
      if (this.userRole === 'ADMIN') {
        teams = await firstValueFrom(this.teamService.listAllTeams());
      } else if (this.userRole === 'MANAGER') {
        teams = await firstValueFrom(this.teamService.listMyTeamMembers());
      } else {
        teams = await firstValueFrom(this.teamService.listMyTeams());
      }

      const teamsWithMembers = await firstValueFrom(
        this.teamService.populateTeamsWithMembers(teams)
      );

      this.allTeams = teamsWithMembers;
      
      if (this.userRole === 'ADMIN') {
        this.teams = this.allTeams.map(t => t.name);
      } else if (this.userRole === 'MANAGER') {
        this.teams = this.allTeams.map(t => t.name);
      }
      
      const usersMap = new Map<string, any>();
      this.allTeams.forEach(team => {
        team.members.forEach((member: any) => {
          if (!usersMap.has(member.id)) {
            usersMap.set(member.id, {
              id: member.id,
              name: member.name,
              team: team.name,
            });
          }
        });
      });
      
      this.allUsers = Array.from(usersMap.values());
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  }

  private async loadTodayData(): Promise<void> {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const fromStr = todayStart.toISOString();
    const toStr = todayEnd.toISOString();

    const employeesList: TodayEmployee[] = [];

    for (const user of this.allUsers) {
      try {
        const clocks = await firstValueFrom(
          this.clockService.getClocksForUser(user.id, fromStr, toStr)
        );
        const inClocks = clocks.filter((c: any) => c.kind === 'IN').sort((a: any, b: any) => 
          new Date(a.at).getTime() - new Date(b.at).getTime()
        );
        const outClocks = clocks.filter((c: any) => c.kind === 'OUT').sort((a: any, b: any) => 
          new Date(a.at).getTime() - new Date(b.at).getTime()
        );

        const isPresent = inClocks.length > outClocks.length;
        const firstIn = inClocks[0];
        const lastOut = outClocks.length > 0 ? outClocks[outClocks.length - 1] : null;

        if (firstIn) {
          const clockInTime = new Date(firstIn.at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          });

          const clockOutTime = lastOut ? new Date(lastOut.at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }) : undefined;

          employeesList.push({
            id: user.id,
            name: user.name,
            team: user.team,
            clockIn: clockInTime,
            clockOut: clockOutTime,
            isPresent: isPresent,
          });
        }
      } catch (error) {
        // skip
      }
    }

    this.todayEmployees = employeesList.sort((a, b) => {
      if (a.isPresent && !b.isPresent) return -1;
      if (!a.isPresent && b.isPresent) return 1;
      return a.name.localeCompare(b.name);
    });

    this.updateFilteredEmployees();
    this.updateStats();
    this.updateChartData();
  }

  private updateFilteredEmployees(): void {
    if (this.selectedTeam) {
      this.filteredEmployees = this.todayEmployees.filter(e => e.team === this.selectedTeam);
    } else {
      this.filteredEmployees = [...this.todayEmployees];
    }
  }

  private updateStats(): void {
    const employees = this.selectedTeam 
      ? this.todayEmployees.filter(e => e.team === this.selectedTeam)
      : this.todayEmployees;
    
    this.presentCount = employees.filter(e => e.isPresent).length;
    
    const totalInTeam = this.selectedTeam
      ? this.allUsers.filter(u => u.team === this.selectedTeam).length
      : this.allUsers.length;
    
    this.absentCount = totalInTeam - this.presentCount;
  }

  private updateChartData(): void {
    const employees = this.selectedTeam 
      ? this.todayEmployees.filter(e => e.team === this.selectedTeam)
      : this.todayEmployees;
    
    this.barChartData = employees
      .filter(e => e.isPresent)
      .map(e => ({ 
        name: e.name.split(' ')[0],
        value: 1 
      }))
      .slice(0, 10);
  }

  onTeamChange(): void {
    this.updateFilteredEmployees();
    this.updateStats();
    this.updateChartData();
  }

  get totalEmployees(): number {
    return this.selectedTeam
      ? this.allUsers.filter(u => u.team === this.selectedTeam).length
      : this.allUsers.length;
  }
}
