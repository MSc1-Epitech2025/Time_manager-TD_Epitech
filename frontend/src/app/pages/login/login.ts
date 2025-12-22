import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';

// auth service
import { AuthService, Role } from '../../core/services/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { NotificationService } from '@core/services/notification';

// Shared components
import { AnimatedBubblesComponent } from '../../shared/components/animated-bubbles/animated-bubbles';

// Modals
import { ForgotPasswordModalComponent } from '@modal/forgot-password-modal/forgot-password-modal';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, NgIf,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressSpinnerModule, MatDividerModule,
    MatCheckboxModule, MatRippleModule,
    AnimatedBubblesComponent
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);

  hidePwd = signal(true);
  loading = signal(false);
  theme = signal<'light' | 'dark'>('light');

  ngOnInit() {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem('tm-theme') as 'light' | 'dark' | null;
    this.setTheme(saved ?? (prefersDark ? 'dark' : 'light'));
  }

  toggleTheme() {
    this.setTheme(this.theme() === 'light' ? 'dark' : 'light');
  }

  private setTheme(next: 'light' | 'dark') {
    this.theme.set(next);
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(next === 'dark' ? 'theme-dark' : 'theme-light');
    root.setAttribute('data-theme', next);
    localStorage.setItem('tm-theme', next);
  }

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });

  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);

    (async () => {
      try {
        const email = this.form.value.email!;
        const password = this.form.value.password!;
        const remember = !!this.form.value.remember;

        const session = await this.auth.login(email, password, remember);
        
        // Check first connection
        if (session.user.firstConnection) {
          this.router.navigate(['/first-login-reset']);
          return;
        }

        const roles = session.user.roles ?? [];
        const has = (role: Role) => roles.includes(role);

        if (has('ADMIN')) {
          this.router.navigate(['/app/enterprise']);
        } else if (has('MANAGER')) {
          this.router.navigate(['/app/employee']);
        } else if (has('EMPLOYEE')) {
          this.router.navigate(['/app/employee']);
        } else {
          this.router.navigate(['/']);
          console.error('Unknown user roles:', roles);
        }

      } catch (e) {
        this.notify.error('Invalid credentials or service unavailable.');
        console.error(e);
      } finally {
        this.loading.set(false);
      }
    })();
  }


  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }

  loginWithMicrosoft() {
    window.location.href = `${environment.AZURE_URL}/oauth2/authorization/azure-dev`;
  }
  openForgotPasswordModal() {
    this.dialog.open(ForgotPasswordModalComponent, {
      maxWidth: '90vw',
      panelClass: 'forgot-password-dialog',
      disableClose: false
    });
  }


}

