import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { Observable, forkJoin, map, of, tap, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateTeamModal } from '../../modal/create-team-modal/create-team-modal';
import { EditTeamModalComponent } from '../../modal/edit-team-modal/edit-team-modal';
import { DeleteTeamModalComponent } from '../../modal/delete-team-modal/delete-team-modal';
import { TeamService, Team, TeamMember } from '../../core/services/team';
import { AuthService, Role } from '../../core/services/auth';

type DialogTeamMemberLike = {
  id?: string | number;
  userId?: string | number;
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

type DialogTeamResult = {
  id: string | number;
  name: string;
  description?: string | null;
  members?: Array<DialogTeamMemberLike | null | undefined>;
};

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
  ],
  templateUrl: './team-management.html',
  styleUrl: './team-management.scss',
})
export class TeamManagement implements OnInit {
  searchTerm = '';
  teams: Team[] = [];
  filteredTeams: Team[] = [];
  isLoading = false;
  lastError: string | null = null;

  constructor(
    private modal: MatDialog,
    private teamService: TeamService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.refreshTeams();
  }

  refreshTeams(): void {
    this.isLoading = true;
    this.lastError = null;
    console.debug('[TeamManagement] refreshTeams start', {
      roles: this.auth.session?.user?.roles,
      isAdmin: this.isAdminUser,
      isManager: this.isManagerUser,
    }); // DEBUG refreshTeams: état initial
    this.loadTeamsForCurrentUser()
      .pipe(
        switchMap((teams) =>
          this.teamService.populateTeamsWithMembers(teams).pipe(
            catchError((error) => {
              console.warn('[TeamManagement] populateTeamsWithMembers failed, keeping bare teams', error); // DEBUG population failure
              return of(teams);
            })
          )
        )
      )
      .subscribe({
        next: (teams) => {
          console.debug('[TeamManagement] refreshTeams success', { teams }); // DEBUG refreshTeams: succès
          this.teams = teams;
          this.applyFilter();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('[TeamManagement] Error fetching teams:', error); // DEBUG refreshTeams: erreur
          this.teams = [];
          this.filteredTeams = [];
          this.isLoading = false;
          this.lastError = error?.message ?? 'Impossible de recuperer les equipes pour le moment.';
        },
      });
  }

  searchTeams(): void {
    this.applyFilter();
  }

  viewTeamDetails(team: Team): void {
    this.router.navigate(['/manager'], {
      queryParams: {
        teamId: team.id,
        teamName: team.name,
      },
    });
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredTeams = term
      ? this.teams.filter((team) => team.name.toLowerCase().includes(term))
      : [...this.teams];
  }

  private createTeam(teamName: string, description?: string | null): void {
    if (!this.isAdminUser) return;

    this.teamService
      .createTeam({ name: teamName, description: description ?? null })
      .subscribe({
        next: () => this.refreshTeams(),
        error: (error) => console.error('Error creating team:', error),
      });
  }

  private removeTeam(teamId: string): void {
    if (!this.isAdminUser) return;

    this.teamService.deleteTeam(teamId).subscribe({
      next: () => this.refreshTeams(),
      error: (error) => console.error('Error deleting team:', error),
    });
  }

  openEditTeamModal(team: Team): void {
    if (!this.isAdminUser) return;

    const teamId = String(team.id);
    this.loadTeamContext(teamId).subscribe({
      next: (teamContext) => {
        const dialogRef = this.modal.open(EditTeamModalComponent, {
          width: '500px',
          data: { team: teamContext },
        });

        dialogRef.afterClosed().subscribe(
          (updatedTeam: DialogTeamResult | undefined) => {
            if (updatedTeam) {
              const sanitizedMembers = this.sanitizeMembers(updatedTeam.members ?? []);
              const nextName = updatedTeam.name.trim();
              const rawDescription =
                typeof updatedTeam.description === 'string'
                  ? updatedTeam.description.trim()
                  : '';
              const nextDescription = rawDescription ? rawDescription : null;
              const operations: Observable<unknown>[] = [];

              const nameChanged =
                teamContext.name.trim() !== nextName ||
                (teamContext.description ?? '') !== (nextDescription ?? '');

              if (nameChanged) {
                operations.push(
                  this.teamService.updateTeam(teamId, {
                    name: nextName,
                    description: nextDescription,
                  })
                );
              }

              operations.push(
                ...this.buildMemberChangeOperations(teamId, teamContext.members, sanitizedMembers)
              );

              const filteredOps = operations.filter(Boolean);

              if (!filteredOps.length) {
                return;
              }

              forkJoin(filteredOps)
                .pipe(
                  catchError((error) => {
                    console.error('Error updating team details:', error);
                    return of(null);
                  })
                )
                .subscribe(() => this.refreshTeams());
            }
          }
        );
      },
      error: (error) => console.error('Error loading team details:', error),
    });
  }

  openDeleteTeamModal(team: Team): void {
    if (!this.isAdminUser) return;

    const teamId = String(team.id);
    this.loadTeamContext(teamId).subscribe({
      next: (teamContext) => {
        const dialogRef = this.modal.open(DeleteTeamModalComponent, {
          width: '500px',
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
                this.removeTeam(String(updatedTeam.id));
              }
            }
          );
      },
      error: (error) => console.error('Error loading team details:', error),
    });
  }

  showAddModal(): void {
    if (!this.isAdminUser) return;

    const dialogRef = this.modal.open(CreateTeamModal, {
      width: '400px',
    });

    dialogRef
      .afterClosed()
      .subscribe((result: { name?: string; description?: string } | undefined) => {
        if (result?.name?.trim()) {
          this.createTeam(result.name.trim(), result.description ?? null);
        }
      });
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
            console.warn('[TeamManagement] teams() query failed, returning empty array', error);
            return of<Team[]>([]);
          })
        ),
        admin: this.teamService.listAllTeams().pipe(
          catchError((error) => {
            console.warn('[TeamManagement] allTeams query failed, keeping fallback result', error);
            return of<Team[]>([]);
          })
        ),
      }).pipe(
        map(({ fallback, admin }) => {
          console.debug('[TeamManagement] merged results', { fallback, admin }); // DEBUG merged results
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
      console.debug('[TeamManagement] Manager detected, loading managed teams'); // DEBUG manager branch
      return this.teamService.listManagedTeams().pipe(
        tap((result) => console.debug('[TeamManagement] manager result', { count: result.length, result })) // DEBUG manager result
      );
    }
    console.debug('[TeamManagement] Default branch (myTeams)'); // DEBUG default branch
    return this.teamService.listMyTeams().pipe(
      tap((result) => console.debug('[TeamManagement] myTeams result', { count: result.length, result })) // DEBUG default result
    );
  }

  private sanitizeMembers(input: Array<DialogTeamMemberLike | null | undefined>): TeamMember[] {
    if (!input.length) return [];

    const normalized: TeamMember[] = [];

    for (const entry of input) {
      if (!entry || typeof entry !== 'object') continue;
      const member = entry as DialogTeamMemberLike;

      const id = this.extractMemberId(member);
      if (!id) continue;

      const name = this.extractMemberName(member, id);
      const email = this.extractMemberEmail(member);

      const normalizedMember: TeamMember = { id, name };
      if (email) {
        normalizedMember.email = email;
      }

      normalized.push(normalizedMember);
    }

    return normalized;
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

  private extractMemberId(member: DialogTeamMemberLike): string | null {
    const candidates: Array<string | number | undefined> = [
      member.id,
      member.userId,
    ];

    for (const value of candidates) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
    }

    return null;
  }

  private extractMemberName(member: DialogTeamMemberLike, fallbackId: string): string {
    if (typeof member.name === 'string' && member.name.trim()) {
      return member.name.trim();
    }

    const first =
      typeof member.firstName === 'string' && member.firstName.trim()
        ? member.firstName.trim()
        : '';
    const last =
      typeof member.lastName === 'string' && member.lastName.trim()
        ? member.lastName.trim()
        : '';

    const combined = `${first} ${last}`.trim();
    return combined || fallbackId;
  }

  private extractMemberEmail(member: DialogTeamMemberLike): string | undefined {
    if (typeof member.email === 'string') {
      const trimmed = member.email.trim();
      if (trimmed) return trimmed;
    }
    return undefined;
  }
}
