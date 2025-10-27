import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { CreateTeamModal } from '../../modal/create-team-modal/create-team-modal';
import { EditTeamModalComponent } from '../../modal/edit-team-modal/edit-team-modal';
import { DeleteTeamModalComponent } from '../../modal/delete-team-modal/delete-team-modal';
import { TeamService, Team } from '../../core/services/team';

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
  teamSelected = -1;
  showAddTeamForm = false;
  teams: Team[] = [];
  filteredTeams: Team[] = [];
  isLoading = false;
  lastError: string | null = null;

  constructor(private modal: MatDialog, private teamService: TeamService) {}

  ngOnInit(): void {
    this.refreshTeams();
  }

  refreshTeams(): void {
    this.isLoading = true;
    this.lastError = null;
    this.teamService.listTeams().subscribe({
      next: (teams) => {
        this.teams = teams;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching teams:', error);
        this.teams = [];
        this.filteredTeams = [];
        this.isLoading = false;
        this.lastError = 'Impossible de recuperer les equipes pour le moment.';
      },
    });
  }

  searchTeams(): void {
    this.applyFilter();
  }

  viewTeamDetails(teamId: string): void {
    console.log('Viewing team with ID:', teamId);
  }

  closeModal(): void {
    this.showAddTeamForm = false;
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredTeams = term
      ? this.teams.filter((team) => team.name.toLowerCase().includes(term))
      : [...this.teams];
  }

  private createTeam(teamName: string, description?: string | null): void {
    this.teamService
      .createTeam({ name: teamName, description: description ?? null })
      .subscribe({
        next: () => this.refreshTeams(),
        error: (error) => console.error('Error creating team:', error),
      });
  }

  private updateTeam(teamId: string, teamData: { name: string; description?: string | null }): void {
    this.teamService
      .updateTeam(teamId, {
        name: teamData.name,
        description: teamData.description ?? null,
      })
      .subscribe({
        next: () => this.refreshTeams(),
        error: (error) => console.error('Error updating team:', error),
      });
  }

  private removeTeam(teamId: string): void {
    this.teamService.deleteTeam(teamId).subscribe({
      next: () => this.refreshTeams(),
      error: (error) => console.error('Error deleting team:', error),
    });
  }

  openEditTeamModal(team: Team): void {
    const dialogRef = this.modal.open(EditTeamModalComponent, {
      width: '500px',
      data: { team },
    });

    dialogRef.afterClosed().subscribe(
      (
        updatedTeam:
          | { id: string | number; name: string; description?: string | null }
          | undefined
      ) => {
        if (updatedTeam) {
          this.updateTeam(String(updatedTeam.id), {
            name: updatedTeam.name,
            description: updatedTeam.description ?? null,
          });
        }
      }
    );
  }

  openDeleteTeamModal(team: Team): void {
    const dialogRef = this.modal.open(DeleteTeamModalComponent, {
      width: '500px',
      data: { team },
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
  }

  showAddModal(): void {
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

  showEditModal(teamId: number): void {
    this.teamSelected = teamId;
    this.showAddTeamForm = true;
    console.log('Editing team with ID:', this.teamSelected);
  }
}
