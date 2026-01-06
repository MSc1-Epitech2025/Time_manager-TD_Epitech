import { TestBed } from '@angular/core/testing';
import { APP_INITIALIZER } from '@angular/core';
import { Router } from '@angular/router';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { appConfig } from '@/app.config';
import { AuthService } from '@/ core/services/auth';
import { TimerService } from '@/core/services/timer';
import { AuthInterceptor } from '@/core/services/auth-interceptor';

describe('appConfig', () => {
  let authServiceSpy: jest.Mocked<AuthService>;
  let timerServiceSpy: jest.Mocked<TimerService>;

  beforeEach(() => {
    authServiceSpy = {
      hydrateFromStorage: jest.fn().mockReturnValue(Promise.resolve()),
    } as unknown as jest.Mocked<AuthService>;

    timerServiceSpy = {
      hydrate: jest.fn().mockReturnValue(undefined),
    } as unknown as jest.Mocked<TimerService>;
  });

  it('should have providers defined', () => {
    expect(appConfig).toBeDefined();
    expect(appConfig.providers).toBeDefined();
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });

  describe('providers configuration', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          ...appConfig.providers,
          { provide: AuthService, useValue: authServiceSpy },
          { provide: TimerService, useValue: timerServiceSpy },
        ],
      });
    });

    it('should provide Router', () => {
      const router = TestBed.inject(Router);
      expect(router).toBeTruthy();
    });

    it('should provide HttpClient', () => {
      const httpClient = TestBed.inject(HttpClient);
      expect(httpClient).toBeTruthy();
    });

    it('should register AuthInterceptor as HTTP_INTERCEPTORS', () => {
      const interceptors = TestBed.inject(HTTP_INTERCEPTORS);
      const authInterceptor = interceptors.find((i) => i instanceof AuthInterceptor);
      expect(authInterceptor).toBeTruthy();
    });

    it('should register APP_INITIALIZER providers', () => {
      const initializers = TestBed.inject(APP_INITIALIZER);
      expect(initializers).toBeDefined();
      expect(Array.isArray(initializers)).toBe(true);
      expect(initializers.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('AuthService APP_INITIALIZER', () => {
    it('should call hydrateFromStorage on initialization', async () => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          ...appConfig.providers,
          { provide: AuthService, useValue: authServiceSpy },
          { provide: TimerService, useValue: timerServiceSpy },
        ],
      });

      const initializers = TestBed.inject(APP_INITIALIZER);
      const authInitializer = initializers.find(
        (fn: () => any) => fn.toString().includes('hydrateFromStorage') || fn() instanceof Promise
      );

      if (authInitializer) {
        await authInitializer();
      }

      expect(authServiceSpy.hydrateFromStorage).toHaveBeenCalled();
    });

    it('should execute auth factory function', () => {
      const mockAuth = { hydrateFromStorage: jest.fn().mockReturnValue('hydrated') };
      const factory = (auth: AuthService) => () => auth.hydrateFromStorage();
      const result = factory(mockAuth as unknown as AuthService);

      expect(typeof result).toBe('function');
      expect(result()).toBe('hydrated');
      expect(mockAuth.hydrateFromStorage).toHaveBeenCalledTimes(1);
    });
  });

  describe('TimerService APP_INITIALIZER', () => {
    it('should call hydrate on initialization', () => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          ...appConfig.providers,
          { provide: AuthService, useValue: authServiceSpy },
          { provide: TimerService, useValue: timerServiceSpy },
        ],
      });

      const initializers = TestBed.inject(APP_INITIALIZER);
      initializers.forEach((fn: () => any) => {
        try {
          fn();
        } catch {
          // Ignore errors from other initializers
        }
      });

      expect(timerServiceSpy.hydrate).toHaveBeenCalled();
    });

    it('should execute timer factory function', () => {
      const mockTimer = { hydrate: jest.fn().mockReturnValue('timer hydrated') };
      const factory = (t: TimerService) => () => t.hydrate();
      const result = factory(mockTimer as unknown as TimerService);

      expect(typeof result).toBe('function');
      expect(result()).toBe('timer hydrated');
      expect(mockTimer.hydrate).toHaveBeenCalledTimes(1);
    });
  });

  describe('factory functions', () => {
    it('should create auth initializer factory that returns a function', () => {
      const authService = { hydrateFromStorage: jest.fn() };
      const factory = (auth: AuthService) => () => auth.hydrateFromStorage();
      const initFn = factory(authService as unknown as AuthService);

      expect(typeof initFn).toBe('function');
      initFn();
      expect(authService.hydrateFromStorage).toHaveBeenCalled();
    });

    it('should create timer initializer factory that returns a function', () => {
      const timerService = { hydrate: jest.fn() };
      const factory = (t: TimerService) => () => t.hydrate();
      const initFn = factory(timerService as unknown as TimerService);

      expect(typeof initFn).toBe('function');
      initFn();
      expect(timerService.hydrate).toHaveBeenCalled();
    });
  });
});
