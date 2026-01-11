import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { UserService, User, CreateUserInput, UpdateUserInput } from '@core/services/user';
import { TeamService, Team } from '@core/services/team';
import { AuthService } from '@core/services/auth';
import { DeleteUserModalComponent } from '@modal/delete-user-modal/delete-user-modal';
import { SecurityValidationService } from '@core/services/security-validation';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatListModule,
    MatDividerModule,
    MatCheckboxModule,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class UsersComponent implements OnInit {
  @ViewChild('userFormSection') userFormSection?: ElementRef<HTMLElement>;

  searchTerm = '';
  users: User[] = [];
  filteredUsers: User[] = [];
  teams: Team[] = [];
  isLoading = false;
  lastError: string | null = null;

  selectedUser: User | null = null;
  isCreating = false;
  selectedTeamIds: string[] = [];
  originalTeamIds: string[] = [];

  formData: CreateUserInput & { id?: string } = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    poste: '',
  };

  constructor(
    private readonly userService: UserService,
    private readonly teamService: TeamService,
    private readonly dialog: MatDialog,
    private readonly security: SecurityValidationService,
    private readonly router: Router,
    private readonly auth: AuthService
  ) { }

  ngOnInit(): void {
    this.refreshUsers();
    this.loadTeams();
  }

  loadTeams(): void {
    this.teamService.listAllTeams().subscribe({
      next: (teams: Team[]) => {
        this.teams = teams;
      },
      error: (error: any) => {
        console.error('Failed to load teams:', error);
      },
    });
  }

  refreshUsers(): void {
    this.isLoading = true;
    this.lastError = null;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        this.users = [];
        this.filteredUsers = [];
        this.isLoading = false;
        this.lastError = error?.message ?? 'Unable to retrieve users at this time.';
      },
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredUsers = [...this.users];
    } else {
      this.filteredUsers = this.users.filter(
        (user) =>
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
      );
    }
  }

  searchUsers(): void {
    this.applyFilter();
  }

  showCreateForm(): void {
    this.isCreating = true;
    this.selectedUser = null;
    this.selectedTeamIds = [];
    this.originalTeamIds = [];
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      poste: '',
    };
    this.scrollFormToTop();
  }

  async selectUser(user: User): Promise<void> {
    this.selectedUser = user;
    this.isCreating = false;
    
    // Extract role
    let roleValue = '';
    if (user.role) {
      try {
        // Parse if it's a JSON string
        const parsed = JSON.parse(user.role);
        if (Array.isArray(parsed) && parsed.length > 0) {
          roleValue = String(parsed[0]).toUpperCase();
        } else {
          roleValue = String(parsed).toUpperCase();
        }
      } catch {
        // If parsing fails, treat as normal string
        roleValue = String(user.role).toUpperCase();
      }
    }
    
    this.formData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
      role: roleValue,
      poste: user.poste ?? '',
    };
    
    // Load user teams
    try {
      const teams = await firstValueFrom(this.teamService.listAllTeams());
      const teamsWithMembers = await firstValueFrom(this.teamService.populateTeamsWithMembers(teams));
      
      const userTeams = teamsWithMembers.filter((team: Team) => 
        team.members && team.members.some((member: any) => String(member.id) === String(user.id))
      );
      
      this.selectedTeamIds = userTeams.map(t => String(t.id));
      this.originalTeamIds = [...this.selectedTeamIds];
    } catch (error) {
      console.error('Failed to load user teams:', error);
      this.selectedTeamIds = [];
      this.originalTeamIds = [];
    }
    
    this.scrollFormToTop();
  }

  cancelForm(): void {
    this.isCreating = false;
    this.selectedUser = null;
    this.selectedTeamIds = [];
    this.originalTeamIds = [];
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      poste: '',
    };
  }

  async createUser(): Promise<void> {
    if (!this.formData.firstName || !this.formData.lastName || !this.formData.email) {
      alert('Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }

    if (!this.formData.role) {
      alert('Please select a role');
      return;
    }

    if (this.selectedTeamIds.length === 0) {
      alert('Please select at least one team');
      return;
    }

    try {
      this.security.validateUserCreation(this.formData);
    } catch (err: any) {
      alert(err?.message || 'Invalid input detected');
      return;
    }

    const input: CreateUserInput = {
      firstName: this.formData.firstName,
      lastName: this.formData.lastName,
      email: this.formData.email,
      phone: this.formData.phone || undefined,
      role: this.formData.role || undefined,
      poste: this.formData.poste || undefined,
    };

    this.isLoading = true;
    try {
      const newUser = await firstValueFrom(this.userService.createUser(input));
      
      // Add to selected teams
      for (const teamId of this.selectedTeamIds) {
        try {
          await firstValueFrom(
            this.teamService.addTeamMember(teamId, newUser.id)
          );
        } catch (error) {
          console.error('Failed to add user to team:', error);
        }
      }
      
      this.refreshUsers();
      this.cancelForm();
    } catch (error: any) {
      this.isLoading = false;
      alert(`Error creating user: ${error?.message ?? 'Unknown error'}`);
    }
  }

  async updateUser(): Promise<void> {
    if (!this.selectedUser) return;

    if (!this.formData.firstName || !this.formData.lastName || !this.formData.email) {
      alert('Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }

    if (!this.formData.role) {
      alert('Please select a role');
      return;
    }

    if (this.selectedTeamIds.length === 0) {
      alert('Please select at least one team');
      return;
    }

    try {
      this.security.validateUserUpdate(this.formData);
    } catch (err: any) {
      alert(err?.message || 'Invalid input detected');
      return;
    }

    const input: UpdateUserInput = {
      id: this.selectedUser.id,
      firstName: this.formData.firstName,
      lastName: this.formData.lastName,
      email: this.formData.email,
      phone: this.formData.phone || undefined,
      role: this.formData.role || undefined,
      poste: this.formData.poste || undefined,
    };

    this.isLoading = true;
    try {
      await firstValueFrom(this.userService.updateUser(input));
      
      // Handle team changes
      const teamsToRemove = this.originalTeamIds.filter(id => !this.selectedTeamIds.includes(id));
      const teamsToAdd = this.selectedTeamIds.filter(id => !this.originalTeamIds.includes(id));

      // Remove from old teams
      for (const teamId of teamsToRemove) {
        try {
          await firstValueFrom(
            this.teamService.removeTeamMember(teamId, this.selectedUser.id)
          );
        } catch (error) {
          console.error('Failed to remove user from team:', error);
        }
      }

      // Add to new teams
      for (const teamId of teamsToAdd) {
        try {
          await firstValueFrom(
            this.teamService.addTeamMember(teamId, this.selectedUser.id)
          );
        } catch (error) {
          console.error('Failed to add user to team:', error);
        }
      }
      
      this.refreshUsers();
      this.cancelForm();
    } catch (error: any) {
      this.isLoading = false;
      alert(`Error updating user: ${error?.message ?? 'Unknown error'}`);
    }
  }

  deleteUser(): void {
    if (!this.selectedUser) return;

    const dialogRef = this.dialog.open(DeleteUserModalComponent, {
      width: '500px',
      data: {
        user: {
          id: this.selectedUser.id,
          firstName: this.selectedUser.firstName,
          lastName: this.selectedUser.lastName,
          email: this.selectedUser.email,
        },
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed || !this.selectedUser) return;

      this.isLoading = true;
      this.userService.deleteUser(this.selectedUser.id).subscribe({
        next: (success) => {
          this.refreshUsers();
          this.cancelForm();
        },
        error: (error) => {
          this.isLoading = false;
          alert(`Error deleting user: ${error?.message ?? 'Unknown error'}`);
        },
      });
    });
  }

  get showForm(): boolean {
    return this.isCreating || this.selectedUser !== null;
  }

  isFormValid(): boolean {
    return !!(this.formData.role && this.formData.role !== '' && this.selectedTeamIds.length > 0);
  }

  isTeamSelected(teamId: string): boolean {
    return this.selectedTeamIds.includes(teamId);
  }

  toggleTeam(teamId: string): void {
    const index = this.selectedTeamIds.indexOf(teamId);
    if (index > -1) {
      this.selectedTeamIds.splice(index, 1);
    } else {
      this.selectedTeamIds.push(teamId);
    }
  }

  navigateToTeamManagement(): void {
    this.router.navigate(['/app/teams']);
  }

  isEditingCurrentUser(): boolean {
    const currentUserId = this.auth.session?.user?.id;
    return !this.isCreating && this.selectedUser !== null && currentUserId === this.selectedUser.id;
  }

  isSelectedUserAdmin(): boolean {
    return !this.isCreating && this.formData.role === 'ADMIN';
  }

  private scrollFormToTop(): void {
    setTimeout(() => {
      if (this.userFormSection?.nativeElement) {
        this.userFormSection.nativeElement.scrollTop = 0;
      }
    }, 0);
  }
}
