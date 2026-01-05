import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ForgotPasswordModalComponent } from '@modal/forgot-password-modal/forgot-password-modal';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '@core/services/auth';
import { NotificationService } from '@core/services/notification';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ForgotPasswordModalComponent – Jest (100% coverage)', () => {
  let component: ForgotPasswordModalComponent;
  let fixture: ComponentFixture<ForgotPasswordModalComponent>;

  let dialogRef: { close: jest.Mock };
  let authService: { requestPasswordResetWithTemp: jest.Mock };
  let notification: { success: jest.Mock };

  beforeEach(waitForAsync(() => {
    dialogRef = { close: jest.fn() };
    authService = { requestPasswordResetWithTemp: jest.fn() };
    notification = { success: jest.fn() };

    TestBed.configureTestingModule({
      imports: [
        ForgotPasswordModalComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: AuthService, useValue: authService },
        { provide: NotificationService, useValue: notification },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('email getter returns form control', () => {
    expect(component.email).toBe(component.form.get('email'));
  });

  it('form is invalid when email is empty', () => {
    component.form.setValue({ email: '' });
    expect(component.form.invalid).toBe(true);
  });

  it('form is invalid when email is incorrect', () => {
    component.form.setValue({ email: 'not-an-email' });
    expect(component.form.invalid).toBe(true);
  });

  it('submit marks form as touched and stops when invalid', async () => {
    const markSpy = jest.spyOn(component.form, 'markAllAsTouched');
    component.form.setValue({ email: '' });

    await component.submit();

    expect(markSpy).toHaveBeenCalled();
    expect(component.loading()).toBe(false);
    expect(component.submitted()).toBe(false);
  });

  it('submit success sends email, shows notification and closes dialog', async () => {
    jest.useFakeTimers();
    authService.requestPasswordResetWithTemp.mockResolvedValue(undefined);
    component.form.setValue({ email: 'test@test.com' });

    await component.submit();

    expect(authService.requestPasswordResetWithTemp).toHaveBeenCalledWith('test@test.com');
    expect(component.submitted()).toBe(true);
    expect(notification.success).toHaveBeenCalledWith('Password reset email sent successfully');

    jest.advanceTimersByTime(2000);
    expect(dialogRef.close).toHaveBeenCalledWith(true);

    jest.useRealTimers();
  });

  it('submit handles known error message', async () => {
    const error = new Error('No account with this email address');
    authService.requestPasswordResetWithTemp.mockRejectedValue(error);
    jest.spyOn(console, 'error').mockImplementation();
    component.form.setValue({ email: 'test@test.com' });

    await component.submit();

    expect(component.loading()).toBe(false);
    expect(component.submitted()).toBe(false);
    expect(component.errorMessage()).toBe('No account with this email address');
    expect(console.error).toHaveBeenCalledWith(error);
  });

  it('submit handles unknown error message', async () => {
    const error = new Error('Something else');
    authService.requestPasswordResetWithTemp.mockRejectedValue(error);
    jest.spyOn(console, 'error').mockImplementation();
    component.form.setValue({ email: 'test@test.com' });

    await component.submit();

    expect(component.loading()).toBe(false);
    expect(component.errorMessage()).toBe('No account with this email address');
  });

  it('close closes dialog with false', () => {
    component.close();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('submit handles error without message property', async () => {
    const error = { code: 'UNKNOWN' }; // No message property
    authService.requestPasswordResetWithTemp.mockRejectedValue(error);
    jest.spyOn(console, 'error').mockImplementation();
    component.form.setValue({ email: 'test@test.com' });

    await component.submit();

    expect(component.loading()).toBe(false);
    expect(component.errorMessage()).toBe('No account with this email address');
    expect(console.error).toHaveBeenCalledWith(error);
  });

  it('submit handles null error', async () => {
    authService.requestPasswordResetWithTemp.mockRejectedValue(null);
    jest.spyOn(console, 'error').mockImplementation();
    component.form.setValue({ email: 'test@test.com' });

    await component.submit();

    expect(component.loading()).toBe(false);
    expect(component.errorMessage()).toBe('No account with this email address');
  });

  it('submit handles undefined error', async () => {
    authService.requestPasswordResetWithTemp.mockRejectedValue(undefined);
    jest.spyOn(console, 'error').mockImplementation();
    component.form.setValue({ email: 'test@test.com' });

    await component.submit();

    expect(component.loading()).toBe(false);
    expect(component.errorMessage()).toBe('No account with this email address');
  });
});
