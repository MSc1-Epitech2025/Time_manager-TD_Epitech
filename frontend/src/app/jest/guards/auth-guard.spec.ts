import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import {
  authCanActivate,
  authCanMatch,
  adminGuard,
  managerGuard,
  planningUrlGuard,
} from '@core/guards/auth-guard';
import { AuthService } from '@core/services/auth';

describe('Auth Guards – Jest (100% coverage)', () => {
  let authService: any;
  let router: any;

  beforeEach(() => {
    authService = {
      isAuthenticated: false,
      session: null,
    };

    router = {
      createUrlTree: jest.fn(() => ({} as any)),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('authCanActivate returns true when authenticated', () => {
    authService.isAuthenticated = true;

    const result = TestBed.runInInjectionContext(() =>
      authCanActivate({} as any, {} as any)
    );

    expect(result).toBe(true);
  });

  it('authCanMatch redirects when unauthenticated', () => {
    authService.isAuthenticated = false;

    TestBed.runInInjectionContext(() =>
      authCanMatch({} as any, {} as any)
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { reason: 'unauth' } }
    );
  });

  it('adminGuard allows ADMIN', () => {
    authService.isAuthenticated = true;
    authService.session = { user: { roles: ['ADMIN'] } };

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as any, {} as any)
    );

    expect(result).toBe(true);
  });

  it('adminGuard redirects non-admin', () => {
    authService.isAuthenticated = true;
    authService.session = { user: { roles: ['EMPLOYEE'] } };

    TestBed.runInInjectionContext(() =>
      adminGuard({} as any, {} as any)
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/app/employee']);
  });

  it('managerGuard allows MANAGER', () => {
    authService.isAuthenticated = true;
    authService.session = { user: { roles: ['MANAGER'] } };

    const result = TestBed.runInInjectionContext(() =>
      managerGuard({} as any, {} as any)
    );

    expect(result).toBe(true);
  });

  it('managerGuard allows ADMIN', () => {
    authService.isAuthenticated = true;
    authService.session = { user: { roles: ['ADMIN'] } };

    const result = TestBed.runInInjectionContext(() =>
      managerGuard({} as any, {} as any)
    );

    expect(result).toBe(true);
  });

  it('planningUrlGuard redirects unauthenticated user', () => {
    authService.isAuthenticated = false;
    authService.session = null;

    TestBed.runInInjectionContext(() =>
      planningUrlGuard(
        { queryParams: {} } as unknown as ActivatedRouteSnapshot,
        {} as any
      )
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { reason: 'unauth' } }
    );
  });

  it('planningUrlGuard rewrites employee query param', () => {
    authService.isAuthenticated = true;
    authService.session = {
      user: { roles: ['EMPLOYEE'], fullName: 'John Doe' },
    };

    TestBed.runInInjectionContext(() =>
      planningUrlGuard(
        { queryParams: { manager: 'bad' } } as unknown as ActivatedRouteSnapshot,
        {} as any
      )
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/app/planning'],
      { queryParams: { employee: 'John' } }
    );
  });

  it('planningUrlGuard allows correct employee query param', () => {
    authService.isAuthenticated = true;
    authService.session = {
      user: { roles: ['EMPLOYEE'], fullName: 'John Doe' },
    };

    const result = TestBed.runInInjectionContext(() =>
      planningUrlGuard(
        { queryParams: { employee: 'John' } } as unknown as ActivatedRouteSnapshot,
        {} as any
      )
    );

    expect(result).toBe(true);
  });

  it('planningUrlGuard rewrites manager query param', () => {
    authService.isAuthenticated = true;
    authService.session = {
      user: { roles: ['MANAGER'], email: 'boss@corp.com' },
    };

    TestBed.runInInjectionContext(() =>
      planningUrlGuard(
        { queryParams: { employee: 'wrong' } } as unknown as ActivatedRouteSnapshot,
        {} as any
      )
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/app/planning'],
      { queryParams: { manager: 'boss' } }
    );
  });

  it('planningUrlGuard allows correct manager query param', () => {
    authService.isAuthenticated = true;
    authService.session = {
      user: { roles: ['ADMIN'], email: 'admin@corp.com' },
    };

    const result = TestBed.runInInjectionContext(() =>
      planningUrlGuard(
        { queryParams: { manager: 'admin' } } as unknown as ActivatedRouteSnapshot,
        {} as any
      )
    );

    expect(result).toBe(true);
  });

  it('planningUrlGuard falls back to user id', () => {
    authService.isAuthenticated = true;
    authService.session = {
      user: { roles: ['EMPLOYEE'], id: 42 },
    };

    TestBed.runInInjectionContext(() =>
      planningUrlGuard(
        { queryParams: {} } as unknown as ActivatedRouteSnapshot,
        {} as any
      )
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/app/planning'],
      { queryParams: { employee: '42' } }
    );
  });

  it('adminGuard returns redirect when session is missing', () => {
    authService.isAuthenticated = false;
    authService.session = null;

    TestBed.runInInjectionContext(() =>
      adminGuard({} as any, {} as any)
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { reason: 'unauth' } }
    );
  });

  it('adminGuard handles user without roles (fallback to empty array)', () => {
    authService.isAuthenticated = true;
    authService.session = {
      user: {},
    };

    TestBed.runInInjectionContext(() =>
      adminGuard({} as any, {} as any)
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/app/employee']);
  });

  it('planningUrlGuard handles missing roles array', () => {
    authService.isAuthenticated = true;
    authService.session = {
      user: {
        fullName: 'Alice Smith',
      },
    };

    TestBed.runInInjectionContext(() =>
      planningUrlGuard(
        { queryParams: {} } as unknown as ActivatedRouteSnapshot,
        {} as any
      )
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/app/planning'],
      { queryParams: { employee: 'Alice' } }
    );
  });

  it('planningUrlGuard handles missing roles array', () => {
    authService.isAuthenticated = true;
    authService.session = {
      user: {
        fullName: 'Alice Smith',
      },
    };

    TestBed.runInInjectionContext(() =>
      planningUrlGuard(
        { queryParams: {} } as unknown as ActivatedRouteSnapshot,
        {} as any
      )
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/app/planning'],
      { queryParams: { employee: 'Alice' } }
    );
  });

  it('planningUrlGuard falls back to "user" when id is missing', () => {
    authService.isAuthenticated = true;
    authService.session = {
      user: {
        roles: ['EMPLOYEE'],
      },
    };

    TestBed.runInInjectionContext(() =>
      planningUrlGuard(
        { queryParams: {} } as unknown as ActivatedRouteSnapshot,
        {} as any
      )
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/app/planning'],
      { queryParams: { employee: 'user' } }
    );
  });

  it('planningUrlGuard uses fallback when queryParams is undefined', () => {
    authService.isAuthenticated = true;
    authService.session = {
      user: {
        roles: ['EMPLOYEE'],
        fullName: 'Charlie Brown',
      },
    };

    const route = {} as unknown as ActivatedRouteSnapshot;
    TestBed.runInInjectionContext(() =>
      planningUrlGuard(route, {} as any)
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/app/planning'],
      { queryParams: { employee: 'Charlie' } }
    );
  });
});
