import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { TeamService, TeamMember } from '@core/services/team';

@Component({
  selector: 'app-edit-team-modal',
  templateUrl: './edit-team-modal.html',
  styleUrls: ['./edit-team-modal.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
  ],
})
export class EditTeamModalComponent implements OnInit {
  team: any;
  name: string = '';
  description: string = '';
  members: any[] = [];

  newMemberInput: string = '';
  filteredUsers: Observable<TeamMember[]> | null = null;
  allUsers: TeamMember[] = [];

  constructor(
    private readonly dialogRef: MatDialogRef<EditTeamModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly teamService: TeamService
  ) {
    this.team = { ...data.team, members: [...(data.team.members || [])] };
  }

  ngOnInit(): void {
    this.loadAllUsers();
  }

  private loadAllUsers(): void {
    this.teamService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        this.updateFilteredUsers();
      },
      error: (err) => {
        console.error('Error loading users:', err);
      },
    });
  }

  onMemberInputChange(): void {
    this.updateFilteredUsers();
  }

  private updateFilteredUsers(): void {
    const input = this.newMemberInput.trim().toLowerCase();
    const currentMemberIds = new Set(
      this.team.members.map((m: any) => String(m.id))
    );

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

    if (this.team.members.some((m: any) => String(m.id) === memberId)) {
      return;
    }

    this.team.members.push({
      id: memberId,
      name: member.name,
      email: member.email,
    });

    this.newMemberInput = '';
    this.updateFilteredUsers();
  }

  removeMember(index: number): void {
    this.team.members.splice(index, 1);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.team);
    this.name = this.team.name;
    this.description = this.team.description;
    this.members = this.team.members;
  }
}
