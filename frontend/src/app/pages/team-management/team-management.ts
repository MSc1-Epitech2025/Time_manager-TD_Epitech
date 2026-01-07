import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Router } from '@angular/router';
import { Observable, forkJoin, map, of, tap, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DeleteTeamModalComponent } from '@modal/delete-team-modal/delete-team-modal';
import { TeamService, Team, TeamMember, isGraphqlAuthorizationError } from '@core/services/team';
import { AuthService, Role } from '@core/services/auth';

@Component({
  selector: 'app-team-management',
  imports: [
    MatIconModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatListModule,
    MatDividerModule,
    MatAutocompleteModule,
  ],
  templateUrl: './team-management.html',
  styleUrl: './team-management.scss',
})
export class TeamManagement implements OnInit {
  @ViewChild('teamFormSection') teamFormSection?: ElementRef<HTMLElement>;

  searchTerm = '';
  teams: Team[] = [];
  filteredTeams: Team[] = [];
  isLoading = false;
  lastError: string | null = null;

  selectedTeam: Team | null = null;
  isCreating = false;

  formData: { id?: string; name: string; description: string; members: TeamMember[] } = {
    name: '',
    description: '',
    members: [],
  };

  newMemberInput = '';
  filteredUsers: Observable<TeamMember[]> | null = null;
  allUsers: TeamMember[] = [];

  constructor(
    private readonly modal: MatDialog,
    private readonly teamService: TeamService,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.refreshTeams();
    if (this.isAdminUser) {
      this.loadAllUsers();
    }
  }

  private loadAllUsers(): void {
    if (!this.isAdminUser) {
      return;
    }
    
    this.teamService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        this.updateFilteredUsers();
      },
      error: (err) => {},
    });
  }

  refreshTeams(): void {
    this.isLoading = true;
    this.lastError = null;
    this.loadTeamsForCurrentUser()
      .pipe(
        switchMap((teams) =>
          this.teamService.populateTeamsWithMembers(teams).pipe(
            catchError((error) => {
              return of(teams);
            })
          )
        )
      )
      .subscribe({
        next: (teams) => {
          this.teams = teams;
          this.applyFilter();
          this.isLoading = false;
        },
        error: (error) => {
          this.teams = [];
          this.filteredTeams = [];
          this.isLoading = false;
          this.lastError = error?.message ?? 'Unable to retrieve teams at this time.';
        },
      });
  }

  searchTeams(): void {
    this.applyFilter();
  }

  viewTeamDetails(team: Team): void {
    this.router.navigate(['/app/manager'], {
      queryParams: {
        teamId: team.id,
        teamName: team.name,
      },
    });
  }

  showCreateForm(): void {
    this.isCreating = true;
    this.selectedTeam = null;
    this.formData = {
      name: '',
      description: '',
      members: [],
    };
    this.newMemberInput = '';
    this.scrollFormToTop();
  }

  selectTeam(team: Team): void {
    const teamId = String(team.id);
    this.loadTeamContext(teamId).subscribe({
      next: (teamContext) => {
        this.selectedTeam = teamContext;
        this.isCreating = false;
        this.formData = {
          id: teamContext.id,
          name: teamContext.name,
          description: teamContext.description ?? '',
          members: [...teamContext.members],
        };
        this.newMemberInput = '';
        this.scrollFormToTop();
      },
      error: (error) => {},
    });
  }

  cancelForm(): void {
    this.isCreating = false;
    this.selectedTeam = null;
    this.formData = {
      name: '',
      description: '',
      members: [],
    };
    this.newMemberInput = '';
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredTeams = term
      ? this.teams.filter((team) => team.name.toLowerCase().includes(term))
      : [...this.teams];
  }

  createTeam(): void {
    if (!this.isAdminUser) return;
    if (!this.formData.name.trim()) {
      alert('Please fill in the team name');
      return;
    }

    this.isLoading = true;
    this.teamService
      .createTeam({ 
        name: this.formData.name.trim(), 
        description: this.formData.description.trim() || null 
      })
      .subscribe({
        next: (newTeam) => {
          if (this.formData.members.length > 0) {
            const addMemberOps = this.formData.members.map((member) =>
              this.teamService.addTeamMember(newTeam.id, member.id)
            );
            forkJoin(addMemberOps)
              .pipe(
                catchError((error) => {
                  return of(null);
                })
              )
              .subscribe(() => {
                this.refreshTeams();
                this.cancelForm();
              });
          } else {
            this.refreshTeams();
            this.cancelForm();
          }
        },
        error: (error) => {
          this.isLoading = false;
          alert(`Error creating team: ${error?.message ?? 'Unknown error'}`);
        },
      });
  }

  updateTeam(): void {
    if (!this.isAdminUser || !this.selectedTeam) return;
    if (!this.formData.name.trim()) {
      alert('Please fill in the team name');
      return;
    }

    const teamId = String(this.selectedTeam.id);
    const operations: Observable<unknown>[] = [];

    const nameChanged =
      this.selectedTeam.name.trim() !== this.formData.name.trim() ||
      (this.selectedTeam.description ?? '') !== (this.formData.description.trim() || '');

    if (nameChanged) {
      operations.push(
        this.teamService.updateTeam(teamId, {
          name: this.formData.name.trim(),
          description: this.formData.description.trim() || null,
        })
      );
    }

    operations.push(
      ...this.buildMemberChangeOperations(teamId, this.selectedTeam.members, this.formData.members)
    );

    const filteredOps = operations.filter(Boolean);

    if (!filteredOps.length) {
      this.cancelForm();
      return;
    }

    this.isLoading = true;
    forkJoin(filteredOps)
      .pipe(
        catchError((error) => {
          this.isLoading = false;
          alert(`Error updating team: ${error?.message ?? 'Unknown error'}`);
          return of(null);
        })
      )
      .subscribe(() => {
        this.refreshTeams();
        this.cancelForm();
      });
  }

  deleteTeam(): void {
    if (!this.isAdminUser || !this.selectedTeam) return;

    const dialogRef = this.modal.open(DeleteTeamModalComponent, {
      width: '500px',
      data: {
        team: {
          id: this.selectedTeam.id,
          name: this.selectedTeam.name,
          description: this.selectedTeam.description,
        },
      },
    });

    dialogRef.afterClosed().subscribe((result: { id: string | number; isDestroyed?: boolean } | undefined) => {
      if (result?.isDestroyed && this.selectedTeam) {
        this.isLoading = true;
        this.teamService.deleteTeam(String(result.id)).subscribe({
          next: () => {
            this.refreshTeams();
            this.cancelForm();
          },
          error: (error) => {
            this.isLoading = false;
            alert(`Error deleting team: ${error?.message ?? 'Unknown error'}`);
          },
        });
      }
    });
  }

  onMemberInputChange(): void {
    this.updateFilteredUsers();
  }

  private updateFilteredUsers(): void {
    const input = this.newMemberInput.trim().toLowerCase();
    const currentMemberIds = new Set(this.formData.members.map((m) => String(m.id)));

    this.filteredUsers = new Observable((observer) => {
      const filtered = this.allUsers.filter((user) => {
        if (currentMemberIds.has(String(user.id))) {
          return false;
        }
        if (!input) {
          return true;
        }
        const name = user.name.toLowerCase();
        const email = (user.email || '').toLowerCase();
        return name.includes(input) || email.includes(input);
      });
      observer.next(filtered);
      observer.complete();
    });
  }

  addMember(member: TeamMember): void {
    const memberId = String(member.id);

    if (this.formData.members.some((m) => String(m.id) === memberId)) {
      return;
    }

    this.formData.members.push({
      id: memberId,
      name: member.name,
      email: member.email,
    });

    this.newMemberInput = '';
    this.updateFilteredUsers();
  }

  removeMember(index: number): void {
    this.formData.members.splice(index, 1);
    this.updateFilteredUsers();
  }

  openDeleteTeamModal(team: Team): void {
    if (!this.isAdminUser) return;

    const teamId = String(team.id);
    this.loadTeamContext(teamId).subscribe({
      next: (teamContext) => {
        const dialogRef = this.modal.open(DeleteTeamModalComponent, {
          width: '90%',
          maxWidth: '400px',
          data: { team: teamContext },
        });

        dialogRef
          .afterClosed()
          .subscribe(
            (
              updatedTeam:
                | { id: string | number; isDestroyed?: boolean }
                | undefined
            ) => {
              if (updatedTeam?.isDestroyed) {
                this.teamService.deleteTeam(String(updatedTeam.id)).subscribe({
                  next: () => this.refreshTeams(),
                  error: (error) => {},
                });
              }
            }
          );
      },
      error: (error) => {},
    });
  }

  get showForm(): boolean {
    return this.isCreating || this.selectedTeam !== null;
  }

  private scrollFormToTop(): void {
    setTimeout(() => {
      if (this.teamFormSection?.nativeElement) {
        this.teamFormSection.nativeElement.scrollTop = 0;
      }
    }, 0);
  }

  private loadTeamContext(teamId: string): Observable<Team> {
    return forkJoin({
      team: this.teamService.getTeam(teamId),
      members: this.teamService.getTeamMembers(teamId),
    }).pipe(
      map(({ team, members }) => ({
        ...team,
        members,
      }))
    );
  }

  private loadTeamsForCurrentUser(): Observable<Team[]> {
    if (this.isAdminUser) {
      return forkJoin({
        fallback: this.teamService.listTeams().pipe(
          catchError((error) => {
            return of<Team[]>([]);
          })
        ),
        admin: this.teamService.listAllTeams().pipe(
          catchError((error) => {
            return of<Team[]>([]);
          })
        ),
      }).pipe(
        map(({ fallback, admin }) => {
          if (!admin.length) return fallback;
          if (!fallback.length) return admin;
          const merged = new Map<string, Team>();
          for (const team of fallback) merged.set(team.id, team);
          for (const team of admin) merged.set(team.id, team);
          return Array.from(merged.values());
        })
      );
    }
    if (this.isManagerUser) {
      return this.teamService.listMyTeamMembers();
    }
    return this.teamService.listMyTeams();
  }

  private buildMemberChangeOperations(
    teamId: string,
    previous: TeamMember[],
    next: TeamMember[]
  ): Observable<unknown>[] {
    const operations: Observable<unknown>[] = [];
    const previousIds = new Set(previous.map((member) => member.id));
    const nextIds = new Set(next.map((member) => member.id));

    for (const member of next) {
      if (!previousIds.has(member.id)) {
        operations.push(this.teamService.addTeamMember(teamId, member.id));
      }
    }

    for (const member of previous) {
      if (!nextIds.has(member.id)) {
        operations.push(this.teamService.removeTeamMember(teamId, member.id));
      }
    }

    return operations;
  }

  get isAdminUser(): boolean {
    return this.hasRole('ADMIN');
  }

  get isManagerUser(): boolean {
    return this.hasRole('MANAGER');
  }

  private hasRole(role: Role): boolean {
    const roles = this.auth.session?.user?.roles ?? [];
    return roles.includes(role);
  }
}
