import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@core/services/auth';
import { KpiBarChartComponent, BarChartData } from '@kpi/kpi-bar-chart/kpi-bar-chart';

interface GraphQLResponse<T> {
  data: T;
  errors?: any[];
}

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
  
  private readonly GRAPHQL_ENDPOINT = environment.GRAPHQL_ENDPOINT;
  private userRole: string = '';

  get presentEmployees(): TodayEmployee[] {
    return this.filteredEmployees.filter(e => e.isPresent);
  }

  constructor(
    private http: HttpClient,
    private auth: AuthService
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
        
        // Filter teams based on role
        if (this.userRole === 'ADMIN') {
          this.teams = this.allTeams.map(t => t.name);
        } else if (this.userRole === 'MANAGER') {
          // Filter only teams where user is a member
          const userId = this.auth.session?.user.id;
          const userTeams = this.allTeams.filter(team =>
            team.members.some((member: any) => member.id === userId)
          );
          this.teams = userTeams.map(t => t.name);
          this.allTeams = userTeams;
        }
        
        // Build users list
        const usersMap = new Map<string, any>();
        this.allTeams.forEach(team => {
          team.members.forEach((member: any) => {
            if (!usersMap.has(member.id)) {
              usersMap.set(member.id, {
                id: member.id,
                name: `${member.firstName} ${member.lastName}`,
                team: team.name,
              });
            }
          });
        });
        
        this.allUsers = Array.from(usersMap.values());
      }
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
        const clocksQuery = `
          query($userId: ID!, $from: String, $to: String) {
            clocksForUser(userId: $userId, from: $from, to: $to) {
              id
              kind
              at
            }
          }
        `;

        const response = await firstValueFrom(
          this.http.post<GraphQLResponse<{ clocksForUser: any[] }>>(
            this.GRAPHQL_ENDPOINT,
            { query: clocksQuery, variables: { userId: user.id, from: fromStr, to: toStr } },
            { withCredentials: true }
          )
        );

        const clocks = response?.data?.clocksForUser || [];
        const inClocks = clocks.filter(c => c.kind === 'IN').sort((a, b) => 
          new Date(a.at).getTime() - new Date(b.at).getTime()
        );
        const outClocks = clocks.filter(c => c.kind === 'OUT').sort((a, b) => 
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
