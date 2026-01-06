jest.mock('@environments/environment', () => ({
  environment: {
    GRAPHQL_ENDPOINT: 'http://test.local/graphql',
    MAX_REFRESH_COUNT: 2,
    JWT_EXP_MINUTES: 1,
  },
}));

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, Session, SessionUser, Role } from '@core/services/auth';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';

function makeSession(overrides: Partial<Session> = {}): Session {
  const baseUser = {
    id: 'u1',
    email: 'user@test.local',
    roles: ['EMPLOYEE'] as Role[],
    fullName: 'User',
    firstConnection: false,
  };

  return {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    refreshCount: 0,
    ...overrides,
    user: {
      ...baseUser,
      ...(overrides.user ?? {}),
    },
  };
}

function mockFetchOnce(payload: any, ok = true) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    json: async () => payload,
  });
}

describe('AuthService (100% coverage)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: { navigate: jest.Mock };

  const originalFetch = global.fetch;

  beforeAll(() => {
    // jsdom has fetch sometimes; we force it as jest.Mock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch!;
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    router = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Router, useValue: router }],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    sessionStorage.clear();
    localStorage.clear();
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    httpMock.verify();
    jest.useRealTimers();
    (console.warn as jest.Mock).mockRestore?.();
    (console.log as jest.Mock).mockRestore?.();
    (console.error as jest.Mock).mockRestore?.();
  });

  it('getters: session / isAuthenticated / token', () => {
    expect(service.session).toBeNull();
    expect(service.isAuthenticated).toBe(false);
    expect(service.token).toBeNull();

    (service as any).session$.next(makeSession({ accessToken: 'abc' }));
    expect(service.isAuthenticated).toBe(true);
    expect(service.token).toBe('abc');
  });

  it('hydrateFromStorage: does nothing when no session stored', () => {
    const startSpy = jest.spyOn(service as any, 'startTokenExpiryMonitoring');
    service.hydrateFromStorage();
    expect(service.session).toBeNull();
    expect(startSpy).not.toHaveBeenCalled();
  });

  it('hydrateFromStorage: loads & normalizes stored session (expiresIn) and starts monitoring', () => {
    const startSpy = jest.spyOn(service as any, 'startTokenExpiryMonitoring');

    sessionStorage.setItem(
      'tm.session',
      JSON.stringify({
        accessToken: '   token   ',
        refreshToken: 'rt',
        expiresIn: 10,
        user: {
          id: 42,
          email: 'UPPER@TEST.LOCAL',
          role: 'manager',
          firstName: '  Alice ',
          lastName: '  Doe ',
        },
      })
    );

    service.hydrateFromStorage();

    const sess = service.session!;
    expect(sess.accessToken).toBe('token');
    expect(sess.refreshToken).toBe('rt');
    expect(typeof sess.expiresAt).toBe('number');

    expect(sess.user.email).toBe('upper@test.local');
    expect(sess.user.roles).toEqual(expect.arrayContaining(['MANAGER']));
    expect(sess.user.firstName).toBe('Alice');
    expect(sess.user.lastName).toBe('Doe');
    expect(sess.user.fullName).toBe('Alice Doe');

    expect(startSpy).toHaveBeenCalledTimes(1);
  });

  it('hydrateFromStorage: invalid JSON clears storage & warns', () => {
    localStorage.setItem('tm.session', '{bad json');
    service.hydrateFromStorage();

    expect(console.warn).toHaveBeenCalled();
    expect(sessionStorage.getItem('tm.session')).toBeNull();
    expect(localStorage.getItem('tm.session')).toBeNull();
    expect(service.session).toBeNull();
  });

  it('loginSuccess: stores remember flag, persists session (with refreshCount=0), and starts monitoring', () => {
    const startSpy = jest.spyOn(service as any, 'startTokenExpiryMonitoring');

    const s = makeSession({ refreshCount: undefined });
    service.loginSuccess(s, false);

    expect(localStorage.getItem('tm.remember')).toBe('false');

    const storedInSession = sessionStorage.getItem('tm.session');
    const storedInLocal = localStorage.getItem('tm.session');

    expect(storedInSession).not.toBeNull();
    expect(storedInLocal).toBeNull();

    const parsed = JSON.parse(storedInSession!);
    expect(parsed.refreshCount).toBe(0);

    expect(service.session?.refreshCount).toBe(0);
    expect(startSpy).toHaveBeenCalledTimes(1);
  });

  it('logout: clears timer/session/storage and navigates to /login?reason=expired', () => {
    (service as any).tokenExpiryTimer = setTimeout(() => {}, 999999);
    (service as any).session$.next(makeSession());
    localStorage.setItem('tm.session', JSON.stringify(makeSession()));
    sessionStorage.setItem('tm.session', JSON.stringify(makeSession()));

    service.logout();

    expect(service.session).toBeNull();
    expect((service as any).tokenExpiryTimer).toBeNull();
    expect(localStorage.getItem('tm.session')).toBeNull();
    expect(sessionStorage.getItem('tm.session')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { reason: 'expired' } });
  });

  it('normalizeUser: fullName > first+last > email local part', () => {
    const a = service.normalizeUser({ email: 'x@y.com', fullName: '  John X  ', roles: [] });
    expect(a.fullName).toBe('John X');

    const b = service.normalizeUser({ email: 'x@y.com', firstName: '  Jane ', lastName: ' Doe ', roles: [] });
    expect(b.fullName).toBe('Jane Doe');

    const c = service.normalizeUser({ email: 'hello@domain.tld', roles: [] });
    expect(c.fullName).toBe('hello');
  });

  it('extractRoles: supports arrays, JSON strings, token strings, objects with roles, and default EMPLOYEE', () => {
    expect(service.extractRoles(['admin', 'manager'])).toEqual(expect.arrayContaining(['ADMIN', 'MANAGER']));

    expect(service.extractRoles('["admin","employee"]')).toEqual(expect.arrayContaining(['ADMIN', 'EMPLOYEE']));

    expect(service.extractRoles(" manager, 'employee' ")).toEqual(expect.arrayContaining(['MANAGER', 'EMPLOYEE']));

    expect(service.extractRoles({ roles: 'ADMIN' })).toEqual(expect.arrayContaining(['ADMIN']));

    const roles = service.extractRoles(null);
    expect(console.warn).toHaveBeenCalled();
    expect(roles).toEqual(['EMPLOYEE']);
  });

  it('private loadUserByEmail: returns null for empty email', async () => {
    const res = await (service as any).loadUserByEmail('   ');
    expect(res).toBeNull();
  });

  it('private loadUserByEmail: success path maps userByEmail response', async () => {
    const p = (service as any).loadUserByEmail('  USER@TEST.LOCAL  ');

    const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body?.variables?.email).toBe('user@test.local');

    req.flush({
      data: {
        userByEmail: {
          id: 'id1',
          firstName: 'Alice',
          lastName: 'Doe',
          email: 'ALICE@TEST.LOCAL',
          phone: null,
          role: 'ADMIN',
          poste: 'Dev',
        },
      },
    });

    const res = await p;
    expect(res).toEqual(
      expect.objectContaining({
        id: 'id1',
        email: 'ALICE@TEST.LOCAL',
        firstName: 'Alice',
        lastName: 'Doe',
        poste: 'Dev',
        roles: expect.arrayContaining(['ADMIN']),
      })
    );
  });

  it('private loadUserByEmail: GraphQL errors -> catchError returns null', async () => {
    const p = (service as any).loadUserByEmail('err@test.local');

    const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
    req.flush({
      errors: [{ message: 'Boom' }],
      data: { userByEmail: null },
    });

    const res = await p;
    expect(console.warn).toHaveBeenCalled();
    expect(res).toBeNull();
  });

  it('private loadUserByEmail: HTTP error -> catchError returns null', async () => {
    const p = (service as any).loadUserByEmail('httpfail@test.local');

    const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
    req.flush('nope', { status: 500, statusText: 'Server Error' });

    const res = await p;
    expect(console.warn).toHaveBeenCalled();
    expect(res).toBeNull();
  });

  it('private userFromResponse: null -> null, else normalizes fields and extracts roles', () => {
    expect((service as any).userFromResponse(null)).toBeNull();

    const u = (service as any).userFromResponse({
      id: '1',
      email: 'a@b.com',
      firstName: null,
      lastName: 'Doe',
      phone: null,
      role: 'MANAGER',
      poste: null,
    });

    expect(u).toEqual(
      expect.objectContaining({
        id: '1',
        email: 'a@b.com',
        lastName: 'Doe',
        firstName: undefined,
        poste: undefined,
        phone: undefined,
        roles: expect.arrayContaining(['MANAGER']),
      })
    );
  });

  it('login: throws when GraphQL server is not reachable (response.ok=false)', async () => {
    mockFetchOnce({}, false);

    await expect(service.login('a@b.com', 'pwd', true)).rejects.toThrow(
      'Error connecting to GraphQL server'
    );
  });

  it('login: throws when server does not confirm connection (ok=false)', async () => {
    mockFetchOnce({ data: { login: { ok: false, firstConnection: false } } }, true);

    await expect(service.login('a@b.com', 'pwd', true)).rejects.toThrow(
      'Server did not confirm the connection'
    );
  });

  it('login: success with profile present -> loginSuccess called, refreshProfile not called', async () => {
    mockFetchOnce({ data: { login: { ok: true, firstConnection: true } } }, true);

    const profile: Partial<SessionUser> = {
      id: 'p1',
      email: 'a@b.com',
      roles: ['MANAGER'],
      firstName: 'A',
      lastName: 'B',
      poste: 'X',
    };

    const loadSpy = jest.spyOn(service as any, 'loadUserByEmail').mockResolvedValue(profile);
    const loginSuccessSpy = jest.spyOn(service, 'loginSuccess');
    const refreshProfileSpy = jest.spyOn(service, 'refreshProfile');

    const res = await service.login('a@b.com', 'pwd', true);

    expect(loadSpy).toHaveBeenCalled();
    expect(loginSuccessSpy).toHaveBeenCalled();

    expect(refreshProfileSpy).not.toHaveBeenCalled();

    expect(res.user.email).toBe('a@b.com');
    expect(res.user.roles).toEqual(expect.arrayContaining(['MANAGER']));
    expect(res.user.firstConnection).toBe(true);
  });

  it('login: success but profile missing -> calls refreshProfile (and still creates session)', async () => {
    mockFetchOnce({ data: { login: { ok: true, firstConnection: false } } }, true);

    jest.spyOn(service as any, 'loadUserByEmail').mockResolvedValue(null);
    const refreshProfileSpy = jest.spyOn(service, 'refreshProfile').mockResolvedValue(null);

    const res = await service.login('missing@b.com', 'pwd', false);

    expect(res.user.email).toBe('missing@b.com');
    expect(refreshProfileSpy).toHaveBeenCalledTimes(1);
    expect(service.isAuthenticated).toBe(true);
  });

  it('refreshProfile: returns null if no session', async () => {
    (service as any).session$.next(null);
    await expect(service.refreshProfile()).resolves.toBeNull();
  });

  it('refreshProfile: returns null if profile not found', async () => {
    (service as any).session$.next(makeSession({ user: { email: 'x@y.com', roles: ['EMPLOYEE'], id: 'u1' } as any }));
    jest.spyOn(service as any, 'loadUserByEmail').mockResolvedValue(null);

    await expect(service.refreshProfile()).resolves.toBeNull();
  });

  it('refreshProfile: success updates user, persists to remember storage, returns updated user', async () => {
    // shouldRemember => false => persist in sessionStorage
    localStorage.setItem('tm.remember', 'false');

    (service as any).session$.next(
      makeSession({
        user: { id: 'u1', email: 'x@y.com', roles: ['EMPLOYEE'], fullName: 'X' },
      })
    );

    jest.spyOn(service as any, 'loadUserByEmail').mockResolvedValue({
      firstName: 'New',
      lastName: 'Name',
      roles: ['ADMIN'],
    });

    const persistSpy = jest.spyOn(service as any, 'persistSession');

    const updated = await service.refreshProfile();

    expect(updated).toEqual(
      expect.objectContaining({
        firstName: 'New',
        lastName: 'Name',
        roles: expect.arrayContaining(['ADMIN']),
      })
    );

    expect(persistSpy).toHaveBeenCalled();
    expect(sessionStorage.getItem('tm.session')).not.toBeNull();
  });

  it('refreshProfile: catches errors and returns null', async () => {
    (service as any).session$.next(makeSession());
    jest.spyOn(service as any, 'loadUserByEmail').mockRejectedValue(new Error('boom'));

    const res = await service.refreshProfile();

    expect(console.warn).toHaveBeenCalled();
    expect(res).toBeNull();
  });

  it('startTokenExpiryMonitoring: no session -> returns; with session sets timeout; clearTokenExpiryMonitoring clears previous', () => {
    const clearSpy = jest.spyOn(global, 'clearTimeout');

    (service as any).session$.next(null);
    (service as any).startTokenExpiryMonitoring();
    expect((service as any).tokenExpiryTimer).toBeNull();

    // set an existing timer then restart
    (service as any).tokenExpiryTimer = setTimeout(() => {}, 1000);

    // refreshCount >= MAX_REFRESH_COUNT hits the empty branch (still schedules)
    (service as any).session$.next(makeSession({ refreshCount: environment.MAX_REFRESH_COUNT }));
    (service as any).startTokenExpiryMonitoring();

    expect(clearSpy).toHaveBeenCalled();
    expect((service as any).tokenExpiryTimer).not.toBeNull();
  });

  it('private handleTokenExpiry: no session -> returns', async () => {
    (service as any).session$.next(null);
    await (service as any).handleTokenExpiry();
  });

  it('private handleTokenExpiry: max refresh reached -> logout', async () => {
    (service as any).session$.next(makeSession({ refreshCount: environment.MAX_REFRESH_COUNT }));
    const logoutSpy = jest.spyOn(service, 'logout');

    await (service as any).handleTokenExpiry();

    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });

  it('private handleTokenExpiry: refreshToken success path', async () => {
    (service as any).session$.next(makeSession({ refreshCount: 0 }));
    const refreshSpy = jest.spyOn(service, 'refreshToken').mockResolvedValue();

    await (service as any).handleTokenExpiry();

    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it('private handleTokenExpiry: refreshToken failure -> logout', async () => {
    (service as any).session$.next(makeSession({ refreshCount: 0 }));
    jest.spyOn(service, 'refreshToken').mockRejectedValue(new Error('fail'));
    const logoutSpy = jest.spyOn(service, 'logout');

    await (service as any).handleTokenExpiry();

    expect(console.error).toHaveBeenCalled();
    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });

  it('refreshToken: throws when no active session', async () => {
    (service as any).session$.next(null);
    await expect(service.refreshToken()).rejects.toThrow('No active session');
  });

  it('refreshToken: throws when max refresh count reached', async () => {
    (service as any).session$.next(makeSession({ refreshCount: environment.MAX_REFRESH_COUNT }));
    await expect(service.refreshToken()).rejects.toThrow('Max refresh count reached');
  });

  it('refreshToken: throws when fetch not ok', async () => {
    (service as any).session$.next(makeSession({ refreshCount: 0 }));
    mockFetchOnce({}, false);

    await expect(service.refreshToken()).rejects.toThrow('Token refresh request failed');
  });

  it('refreshToken: throws when GraphQL returns ok=false', async () => {
    (service as any).session$.next(makeSession({ refreshCount: 0 }));
    mockFetchOnce({ data: { refresh: { ok: false } } }, true);

    await expect(service.refreshToken()).rejects.toThrow('Token refresh was not successful');
  });

  it('refreshToken: success updates session, persists, and restarts monitoring', async () => {
    localStorage.setItem('tm.remember', 'true');
    const startSpy = jest.spyOn(service as any, 'startTokenExpiryMonitoring');
    const persistSpy = jest.spyOn(service as any, 'persistSession');

    (service as any).session$.next(makeSession({ refreshCount: 0, expiresAt: null }));

    mockFetchOnce({ data: { refresh: { ok: true } } }, true);

    await service.refreshToken();

    expect(service.session?.refreshCount).toBe(1);
    expect(typeof service.session?.expiresAt).toBe('number');
    expect(persistSpy).toHaveBeenCalled();
    expect(startSpy).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalled();
  });

  it('resetPasswordFirstLogin: throws when no active session', async () => {
    (service as any).session$.next(null);
    await expect(service.resetPasswordFirstLogin('a', 'b')).rejects.toThrow('No active session');
  });

  it('resetPasswordFirstLogin: throws when fetch not ok', async () => {
    (service as any).session$.next(makeSession());
    mockFetchOnce({}, false);

    await expect(service.resetPasswordFirstLogin('a', 'b')).rejects.toThrow('Password update failed');
  });

  it('resetPasswordFirstLogin: throws when ok=false', async () => {
    (service as any).session$.next(makeSession());
    mockFetchOnce({ data: { changeMyPassword: { ok: false } } }, true);

    await expect(service.resetPasswordFirstLogin('a', 'b')).rejects.toThrow(
      'Password update was not successful'
    );
  });

  it('resetPasswordFirstLogin: success updates session user.firstConnection=false and persists', async () => {
    localStorage.setItem('tm.remember', 'true');
    (service as any).session$.next(makeSession({ user: { firstConnection: true } as any }));

    const persistSpy = jest.spyOn(service as any, 'persistSession');
    mockFetchOnce({ data: { changeMyPassword: { ok: true } } }, true);

    await service.resetPasswordFirstLogin('old', 'new');

    expect(service.session?.user.firstConnection).toBe(false);
    expect(persistSpy).toHaveBeenCalled();
  });

  it('private executeGraphQLMutation: throws when response not ok', async () => {
    mockFetchOnce({}, false);
    await expect(
      (service as any).executeGraphQLMutation('q', { a: 1 }, 'MyMutation')
    ).rejects.toThrow('MyMutation request failed');
  });

  it('private executeGraphQLMutation: throws when result has GraphQL errors', async () => {
    mockFetchOnce({ errors: [{ message: 'Nope' }] }, true);
    await expect(
      (service as any).executeGraphQLMutation('q', { a: 1 }, 'MyMutation')
    ).rejects.toThrow('Nope');
  });

  it('private executeGraphQLMutation: returns data on success', async () => {
    mockFetchOnce({ data: { x: 1 } }, true);
    await expect((service as any).executeGraphQLMutation('q', {}, 'X')).resolves.toEqual({ x: 1 });
  });

  it('requestPasswordReset: throws when ok=false, succeeds when ok=true', async () => {
    const execSpy = jest.spyOn(service as any, 'executeGraphQLMutation');

    execSpy.mockResolvedValueOnce({ requestPasswordReset: { ok: false } });
    await expect(service.requestPasswordReset('a@b.com')).rejects.toThrow(
      'Password reset request was not successful'
    );

    execSpy.mockResolvedValueOnce({ requestPasswordReset: { ok: true } });
    await expect(service.requestPasswordReset('a@b.com')).resolves.toBeUndefined();
  });

  it('requestPasswordResetWithTemp: throws when ok=false, succeeds when ok=true', async () => {
    const execSpy = jest.spyOn(service as any, 'executeGraphQLMutation');

    execSpy.mockResolvedValueOnce({ requestPasswordResetWithTemp: { ok: false } });
    await expect(service.requestPasswordResetWithTemp('a@b.com')).rejects.toThrow(
      'Password reset request was not successful'
    );

    execSpy.mockResolvedValueOnce({ requestPasswordResetWithTemp: { ok: true } });
    await expect(service.requestPasswordResetWithTemp('a@b.com')).resolves.toBeUndefined();
  });

  it('resetPasswordWithToken: throws when ok=false, succeeds when ok=true', async () => {
    const execSpy = jest.spyOn(service as any, 'executeGraphQLMutation');

    execSpy.mockResolvedValueOnce({ resetPassword: { ok: false } });
    await expect(service.resetPasswordWithToken('t', 'new')).rejects.toThrow(
      'Password reset was not successful'
    );

    execSpy.mockResolvedValueOnce({ resetPassword: { ok: true } });
    await expect(service.resetPasswordWithToken('t', 'new')).resolves.toBeUndefined();
  });
});
