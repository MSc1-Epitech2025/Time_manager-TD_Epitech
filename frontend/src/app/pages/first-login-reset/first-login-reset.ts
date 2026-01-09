import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { AuthService } from '@core/services/auth';
import { NotificationService } from '@core/services/notification';
import { SecurityValidationService } from '@core/services/security-validation';

// Components
import { AnimatedBubblesComponent } from '@shared/components/animated-bubbles/animated-bubbles';

@Component({
  selector: 'app-first-login-reset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    AnimatedBubblesComponent
  ],
  templateUrl: './first-login-reset.html',
  styleUrls: ['./first-login-reset.scss']
})
export class FirstLoginResetComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private security = inject(SecurityValidationService);

  hideCurrentPwd = signal(true);
  hideNewPwd = signal(true);
  hideConfirmPwd = signal(true);
  loading = signal(false);

  form = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: this.passwordMatchValidator
  });

  passwordMatchValidator(group: any) {
    const newPwd = group.get('newPassword')?.value;
    const confirmPwd = group.get('confirmPassword')?.value;
    return newPwd === confirmPwd ? null : { passwordMismatch: true };
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    try {
      const validated = this.security.validatePasswordReset(this.form.value);
      const currentPassword = validated.currentPassword;
      const newPassword = validated.newPassword;
      await this.auth.resetPasswordFirstLogin(currentPassword, newPassword);
      this.notify.success('Password successfully updated');
      
      // Redirect
      const session = this.auth.session;
      if (session?.user.roles.includes('ADMIN')) {
        this.router.navigate(['/app/enterprise']);
      } else {
        this.router.navigate(['/app/employee']);
      }
    } catch (error) {
      this.notify.error('Failed to update password');
    } finally {
      this.loading.set(false);
    }
  }

  logout() {
    this.auth.logout();
  }

  get currentPassword() { return this.form.get('currentPassword'); }
  get newPassword() { return this.form.get('newPassword'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }
}
