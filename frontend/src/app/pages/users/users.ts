import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
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
import { DeleteUserModalComponent } from '@modal/delete-user-modal/delete-user-modal';

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
  isLoading = false;
  lastError: string | null = null;

  selectedUser: User | null = null;
  isCreating = false;

  formData: CreateUserInput & { id?: string } = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE',
    poste: '',
  };

  constructor(
    private readonly userService: UserService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.refreshUsers();
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
        console.error('[UsersComponent] Error fetching users:', error);
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
    };
    this.scrollFormToTop();
  }

  selectUser(user: User): void {
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
    };
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
    };
  }

  createUser(): void {
    if (!this.formData.firstName || !this.formData.lastName || !this.formData.email) {
      alert('Please fill in all required fields (First Name, Last Name, Email)');
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
    this.userService.createUser(input).subscribe({
      error: (error) => {
        console.error('[UsersComponent] Error creating user:', error);
        this.isLoading = false;
        alert(`Error creating user: ${error?.message ?? 'Unknown error'}`);
      },
    });
  }

  updateUser(): void {
    if (!this.selectedUser) return;

    if (!this.formData.firstName || !this.formData.lastName || !this.formData.email) {
      alert('Please fill in all required fields (First Name, Last Name, Email)');
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
    this.userService.updateUser(input).subscribe({
      error: (error) => {
        console.error('[UsersComponent] Error updating user:', error);
        this.isLoading = false;
        alert(`Error updating user: ${error?.message ?? 'Unknown error'}`);
      },
    });
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
        error: (error) => {
          console.error('[UsersComponent] Error deleting user:', error);
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
