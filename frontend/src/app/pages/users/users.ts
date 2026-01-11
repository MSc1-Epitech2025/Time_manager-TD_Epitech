import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { UserService, User, CreateUserInput, UpdateUserInput } from '@core/services/user';
import { TeamService, Team } from '@core/services/team';
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
  originalTeamId: string = '';

  formData: CreateUserInput & { id?: string; teamId?: string } = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE',
    poste: '',
    teamId: '',
  };

  constructor(
    private readonly userService: UserService,
    private readonly teamService: TeamService,
    private readonly dialog: MatDialog,
    private readonly security: SecurityValidationService
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
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'EMPLOYEE',
      poste: '',
      teamId: '',
    };
    this.scrollFormToTop();
  }

  async selectUser(user: User): Promise<void> {
    this.selectedUser = user;
    this.isCreating = false;
    this.formData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role ?? 'EMPLOYEE',
      poste: user.poste ?? '',
      teamId: '',
    };
    
    // Load current team
    try {
      const teams = await firstValueFrom(this.teamService.listAllTeams());
      const userTeam = teams.find((team: Team) => 
        team.members.some((member: any) => member.id === user.id)
      );
      if (userTeam) {
        this.formData.teamId = userTeam.id;
        this.originalTeamId = userTeam.id;
      } else {
        this.originalTeamId = '';
      }
    } catch (error) {
      console.error('Failed to load user team:', error);
    }
    
    this.scrollFormToTop();
  }

  cancelForm(): void {
    this.isCreating = false;
    this.selectedUser = null;
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'EMPLOYEE',
      poste: '',
      teamId: '',
    };
  }

  async createUser(): Promise<void> {
    if (!this.formData.firstName || !this.formData.lastName || !this.formData.email) {
      alert('Please fill in all required fields (First Name, Last Name, Email)');
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
      
      // Add to team if selected
      if (this.formData.teamId) {
        try {
          await firstValueFrom(
            this.teamService.addTeamMember(this.formData.teamId, newUser.id)
          );
        } catch (error) {
          console.error('Failed to add user to team:', error);
          alert('User created but failed to add to team');
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
      const newTeamId = this.formData.teamId || '';
      if (this.originalTeamId !== newTeamId) {
        // Remove from old team
        if (this.originalTeamId) {
          try {
            await firstValueFrom(
              this.teamService.removeTeamMember(this.originalTeamId, this.selectedUser.id)
            );
          } catch (error) {
            console.error('Failed to remove user from old team:', error);
          }
        }
        
        // Add to new team
        if (newTeamId) {
          try {
            await firstValueFrom(
              this.teamService.addTeamMember(newTeamId, this.selectedUser.id)
            );
          } catch (error) {
            console.error('Failed to add user to new team:', error);
            alert('User updated but failed to change team');
          }
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

  private scrollFormToTop(): void {
    setTimeout(() => {
      if (this.userFormSection?.nativeElement) {
        this.userFormSection.nativeElement.scrollTop = 0;
      }
    }, 0);
  }
}
