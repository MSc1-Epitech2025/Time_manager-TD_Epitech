import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from '@core/services/notification';
import { ReportApiService } from '@core/services/report-api';
import { AuthService } from '@core/services/auth';

describe('NotificationService', () => {
  let service: NotificationService;
  let snackBarSpy: jest.Mocked<MatSnackBar>;

  beforeEach(() => {
    snackBarSpy = {
      open: jest.fn(),
    } as unknown as jest.Mocked<MatSnackBar>;

    const reportApiMock = {
      createReport: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
    };

    const authMock = {
      session: {
        user: { id: 'user-1' },
      },
    };

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ReportApiService, useValue: reportApiMock },
        { provide: AuthService, useValue: authMock },
      ],
    });

    service = TestBed.inject(NotificationService);
  });

  const baseConfig = {
    duration: 4000,
    horizontalPosition: 'right',
    verticalPosition: 'top',
  };

  describe('info', () => {
    it('opens snackbar with default config', () => {
      service.info('Info message');

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Info message',
        'OK',
        baseConfig
      );
    });
  });

  describe('success', () => {
    it('opens snackbar with success panel class', () => {
      service.success('Success message');

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Success message',
        'OK',
        { ...baseConfig, panelClass: ['snack-success'] }
      );
    });
  });

  describe('warn', () => {
    it('opens snackbar with warn panel class', () => {
      service.warn('Warning message');

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Warning message',
        'OK',
        { ...baseConfig, panelClass: ['snack-warn'] }
      );
    });
  });

  describe('error', () => {
    it('opens snackbar with error panel class', () => {
      service.error('Error message');

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error message',
        'OK',
        { ...baseConfig, panelClass: ['snack-error'] }
      );
    });
  });
});
