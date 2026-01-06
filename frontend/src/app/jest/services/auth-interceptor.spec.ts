import { TestBed } from '@angular/core/testing';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError, Observable } from 'rxjs';
import { AuthInterceptor } from '@core/services/auth-interceptor';
import { AuthService } from '@core/services/auth';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let authService: {
    session: any;
    refreshToken: jest.Mock;
    logout: jest.Mock;
  };
  let router: { navigate: jest.Mock };
  let httpHandler: { handle: jest.Mock };

  beforeEach(() => {
    authService = {
      session: null,
      refreshToken: jest.fn(),
      logout: jest.fn(),
    };

    router = { navigate: jest.fn() };

    httpHandler = {
      handle: jest.fn().mockReturnValue(of(new HttpResponse({ status: 200 }))),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthInterceptor,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    interceptor = TestBed.inject(AuthInterceptor);
  });

  describe('intercept', () => {
    it('should pass through request without modification when not backend request', (done) => {
      const req = new HttpRequest('GET', 'https://external-api.com/data');

      interceptor.intercept(req, httpHandler).subscribe({
        next: () => {
          expect(httpHandler.handle).toHaveBeenCalledWith(req);
          done();
        },
      });
    });

    it('should not attach withCredentials for URL with different port not in BACKEND_HOSTS', (done) => {
      const req = new HttpRequest('GET', 'http://localhost:4200/api/data');

      interceptor.intercept(req, httpHandler).subscribe({
        next: () => {
          const calledReq = httpHandler.handle.mock.calls[0][0] as HttpRequest<any>;
          expect(calledReq.withCredentials).toBeFalsy();
          done();
        },
      });
    });


    it('should attach withCredentials for backend request (localhost:8030)', (done) => {
      const req = new HttpRequest('GET', 'http://localhost:8030/api/data');

      interceptor.intercept(req, httpHandler).subscribe({
        next: () => {
          const calledReq = httpHandler.handle.mock.calls[0][0] as HttpRequest<any>;
          expect(calledReq.withCredentials).toBe(true);
          done();
        },
      });
    });

    it('should attach withCredentials for https backend request', (done) => {
      const req = new HttpRequest('GET', 'https://localhost:8030/api/data');

      interceptor.intercept(req, httpHandler).subscribe({
        next: () => {
          const calledReq = httpHandler.handle.mock.calls[0][0] as HttpRequest<any>;
          expect(calledReq.withCredentials).toBe(true);
          done();
        },
      });
    });

    it('should not clone request if withCredentials is already true', (done) => {
      const req = new HttpRequest('GET', 'http://localhost:8030/api/data', {
        withCredentials: true,
      });

      interceptor.intercept(req, httpHandler).subscribe({
        next: () => {
          expect(httpHandler.handle).toHaveBeenCalledWith(req);
          done();
        },
      });
    });

    it('should attach withCredentials for same-origin request', (done) => {
      const req = new HttpRequest('GET', '/api/data');

      interceptor.intercept(req, httpHandler).subscribe({
        next: () => {
          const calledReq = httpHandler.handle.mock.calls[0][0] as HttpRequest<any>;
          expect(calledReq.withCredentials).toBe(true);
          done();
        },
      });
    });

    it('should pass through non-401/403 errors', (done) => {
      const req = new HttpRequest('GET', '/api/data');
      const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
      httpHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(req, httpHandler).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          expect(authService.logout).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should logout on 401 when no session exists', (done) => {
      authService.session = null;
      const req = new HttpRequest('GET', '/api/data');
      const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      httpHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(req, httpHandler).subscribe({
        error: (err) => {
          expect(err.status).toBe(401);
          expect(authService.logout).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should logout on 403 when no session exists', (done) => {
      authService.session = null;
      const req = new HttpRequest('GET', '/api/data');
      const error = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });
      httpHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(req, httpHandler).subscribe({
        error: (err) => {
          expect(err.status).toBe(403);
          expect(authService.logout).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should attempt refresh on 401 when session exists with refreshCount < MAX', (done) => {
      authService.session = { refreshCount: 0 };
      authService.refreshToken.mockResolvedValue(undefined);

      const req = new HttpRequest('GET', '/api/data');
      const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      const successResponse = new HttpResponse({ status: 200 });

      httpHandler.handle
        .mockReturnValueOnce(throwError(() => error))
        .mockReturnValueOnce(of(successResponse));

      interceptor.intercept(req, httpHandler).subscribe({
        next: (response) => {
          expect(authService.refreshToken).toHaveBeenCalled();
          expect(httpHandler.handle).toHaveBeenCalledTimes(2);
          expect((response as HttpResponse<any>).status).toBe(200);
          done();
        },
      });
    });

    it('should logout when refreshCount >= MAX_REFRESH_COUNT', (done) => {
      authService.session = { refreshCount: 3 };
      const req = new HttpRequest('GET', '/api/data');
      const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      httpHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(req, httpHandler).subscribe({
        error: (err) => {
          expect(authService.logout).toHaveBeenCalled();
          expect(authService.refreshToken).not.toHaveBeenCalled();
          expect(err.status).toBe(401);
          done();
        },
      });
    });

    it('should logout when refresh token fails', (done) => {
      authService.session = { refreshCount: 0 };
      const refreshError = new Error('Refresh failed');
      authService.refreshToken.mockRejectedValue(refreshError);

      const req = new HttpRequest('GET', '/api/data');
      const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      httpHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(req, httpHandler).subscribe({
        error: (err) => {
          expect(authService.refreshToken).toHaveBeenCalled();
          expect(authService.logout).toHaveBeenCalled();
          expect(err.message).toBe('Refresh failed');
          done();
        },
      });
    });

    it('should handle session with undefined refreshCount', (done) => {
      authService.session = {};
      authService.refreshToken.mockResolvedValue(undefined);

      const req = new HttpRequest('GET', '/api/data');
      const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      const successResponse = new HttpResponse({ status: 200 });

      httpHandler.handle
        .mockReturnValueOnce(throwError(() => error))
        .mockReturnValueOnce(of(successResponse));

      interceptor.intercept(req, httpHandler).subscribe({
        next: () => {
          expect(authService.refreshToken).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should retry request with withCredentials after successful refresh', (done) => {
      httpHandler.handle.mockReset();

      authService.session = {
        refreshCount: 0,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        user: {
          id: 'u1',
          email: 'a@test.com',
          roles: ['EMPLOYEE'],
        },
      };

      authService.refreshToken.mockResolvedValue(undefined);

      const req = new HttpRequest('GET', 'http://localhost:8030/api/data');
      const error = new HttpErrorResponse({ status: 403 });
      const successResponse = new HttpResponse({ status: 200 });

      httpHandler.handle
        .mockReturnValueOnce(throwError(() => error))
        .mockReturnValueOnce(of(successResponse));

      interceptor.intercept(req, httpHandler).subscribe({
        next: () => {
          expect(authService.refreshToken).toHaveBeenCalledTimes(1);
          expect(httpHandler.handle).toHaveBeenCalledTimes(2);

          const retryReq = httpHandler.handle.mock.calls[1][0] as HttpRequest<any>;
          expect(retryReq.withCredentials).toBe(true);

          done();
        },
        error: (err) => done(err),
      });
    });
  });

  describe('isBackendRequest', () => {
    it('should return true for relative URL', (done) => {
      const req = new HttpRequest('GET', '/api/users');

      interceptor.intercept(req, httpHandler).subscribe({
        next: () => {
          const calledReq = httpHandler.handle.mock.calls[0][0] as HttpRequest<any>;
          expect(calledReq.withCredentials).toBe(true);
          done();
        },
      });
    });

    it('should return true when URL parsing throws an error', (done) => {
      // IPv6 with missing bracket causes URL constructor to throw
      const req = new HttpRequest('GET', 'http://[invalid');

      interceptor.intercept(req, httpHandler).subscribe({
        next: () => {
          const calledReq = httpHandler.handle.mock.calls[0][0] as HttpRequest<any>;
          expect(calledReq.withCredentials).toBe(true);
          done();
        },
      });
    });

    it('should return false for external URL not in BACKEND_HOSTS', (done) => {
      const req = new HttpRequest('GET', 'https://api.github.com/users');

      interceptor.intercept(req, httpHandler).subscribe({
        next: () => {
          const calledReq = httpHandler.handle.mock.calls[0][0] as HttpRequest<any>;
          expect(calledReq.withCredentials).toBeFalsy();
          done();
        },
      });
    });

    it('should return true for invalid URL (catch block)', (done) => {
      const req = new HttpRequest('GET', '://invalid-url');

      interceptor.intercept(req, httpHandler).subscribe({
        next: () => {
          const calledReq = httpHandler.handle.mock.calls[0][0] as HttpRequest<any>;
          expect(calledReq.withCredentials).toBe(true);
          done();
        },
      });
    });
  });
});
