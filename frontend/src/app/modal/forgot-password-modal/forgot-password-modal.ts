import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth';
import { NotificationService } from '@core/services/notification';

@Component({
  selector: 'app-forgot-password-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './forgot-password-modal.html',
  styleUrls: ['./forgot-password-modal.scss']
})
export class ForgotPasswordModalComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ForgotPasswordModalComponent>);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);

  loading = signal(false);
  submitted = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const email = this.form.value.email!;
      await this.auth.requestPasswordResetWithTemp(email);
      this.submitted.set(true);
      this.notify.success('Password reset email sent successfully');
      
      setTimeout(() => {
        this.dialogRef.close(true);
      }, 2000);
    } catch (error: any) {
      const errorMsg = error?.message || 'Unexpected error';
      if (errorMsg.includes('No account') || errorMsg.includes('email address') || errorMsg.includes('not found')) {
        this.errorMessage.set('No account with this email address');
      } else {
        this.errorMessage.set('No account with this email address');
      }
      this.loading.set(false);
    }
  }

  close() {
    this.dialogRef.close(false);
  }

  get email() { return this.form.get('email'); }
}
