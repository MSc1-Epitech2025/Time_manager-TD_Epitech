import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, firstValueFrom, map, of } from 'rxjs';

export type Role = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export interface SessionUser {
  id: string;
  email: string;
  roles: Role[];
  firstName?: string;
  lastName?: string;
  fullName?: string;
  poste?: string;
  phone?: string;
}

export type Session = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: SessionUser;
};

type UserResponse = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  role?: string | null;
  poste?: string | null;
};

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

const STORAGE_KEY = 'tm.session';
const REMEMBER_KEY = 'tm.remember';
const API_ROOT = 'http://localhost:8030';
const GRAPHQL_ENDPOINT = `${API_ROOT}/graphql`;
const USER_BY_EMAIL_QUERY = `
  query UserByEmail($email: String!) {
    userByEmail(email: $email) {
      id
      firstName
      lastName
      email
      phone
      role
      poste
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private session$ = new BehaviorSubject<Session | null>(null);

  public readonly sessionChanges$ = this.session$.asObservable();

  constructor(private http: HttpClient) {}

  get session(): Session | null {
    return this.session$.value;
  }

  get isAuthenticated(): boolean {
    return !!this.session;
  }

  get token(): string | null {
    return this.session?.accessToken ?? null;
  }

  hydrateFromStorage() {
    const raw = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const normalized = this.normalizeSession(parsed);
      this.session$.next(normalized);
    } catch (err) {
      console.warn('Invalid stored session', err);
      this.clearStorage();
    }
  }

  loginSuccess(session: Session, remember = true) {
    localStorage.setItem(REMEMBER_KEY, String(remember));
    this.clearStorage();
    this.persistSession(session, remember);
    this.session$.next(session);
  }

  logout() {
    this.session$.next(null);
    this.clearStorage();
  }

  async login(email: string, password: string, remember = true) {
    const query = `
      mutation Login($input: AuthRequestInput!) {
        login(input: $input) {
          ok
        }
      }
    `;

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ query, variables: { input: { email, password } } }),
    });

    if (!response.ok) {
      throw new Error('Error connecting to GraphQL server');
    }

    const result = await response.json();
    const ok = result.data?.login?.ok;

    if (!ok) throw new Error("Server did not confirm the connection");

    const profile = await this.loadUserByEmail(email).catch(() => null);

    const session: Session = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: this.normalizeUser({
        id: profile?.id ?? '',
        email: profile?.email ?? email,
        roles: profile?.roles ?? [],
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        fullName: profile?.fullName,
        poste: profile?.poste,
        phone: profile?.phone,
      }),
    };

    this.loginSuccess(session, remember);

    if (!profile) {
      await this.refreshProfile().catch(() => {});
    }

    return this.session ?? session;
  }

  async refreshProfile(): Promise<SessionUser | null> {
    const sess = this.session;
    if (!sess) return null;

    try {
      const profile = await this.loadUserByEmail(sess.user.email);
      if (!profile) return null;

      const updated: Session = {
        ...sess,
        user: this.normalizeUser({
          ...sess.user,
          ...profile,
        }),
      };

      this.session$.next(updated);
      this.persistSession(updated, this.shouldRemember());
      return updated.user;
    } catch (err) {
      console.warn('Failed to refresh profile', err);
      return null;
    }
  }

  private persistSession(session: Session, remember: boolean) {
    (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private shouldRemember(): boolean {
    return (localStorage.getItem(REMEMBER_KEY) ?? 'true') === 'true';
  }

  private clearStorage() {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }

  private normalizeSession(raw: any): Session {
    const expiresAt = typeof raw?.expiresAt === 'number'
      ? raw.expiresAt
      : (typeof raw?.expiresIn === 'number' ? Date.now() + raw.expiresIn * 1000 : null);

    const userRaw = raw?.user ?? {};
    const normalizedUser = this.normalizeUser({
      id: String(userRaw.id ?? ''),
      email: String(userRaw.email ?? '').toLowerCase(),
      roles: this.extractRoles(userRaw.roles ?? userRaw.role),
      firstName: userRaw.firstName,
      lastName: userRaw.lastName,
      fullName: userRaw.fullName,
      poste: userRaw.poste,
      phone: userRaw.phone,
    });

    const accessToken = typeof raw?.accessToken === 'string' ? raw.accessToken.trim() : '';

    return {
      accessToken: accessToken ? accessToken : null,
      refreshToken: raw?.refreshToken ?? null,
      expiresAt,
      user: normalizedUser,
    };
  }

  private normalizeUser(user: Partial<SessionUser>): SessionUser {
    const roles = this.extractRoles(user.roles ?? []);
    const firstName = user.firstName?.toString().trim() || undefined;
    const lastName = user.lastName?.toString().trim() || undefined;
    const displayName = user.fullName?.toString().trim()
      || [firstName, lastName].filter(Boolean).join(' ').trim()
      || (user.email ?? '').split('@')[0];

    return {
      id: user.id ? String(user.id) : '',
      email: user.email ? String(user.email).toLowerCase() : '',
      roles,
      firstName,
      lastName,
      fullName: displayName,
      poste: user.poste,
      phone: user.phone,
    };
  }

  private extractRoles(input: unknown): Role[] {
    const collected = new Set<Role>();

    const addToken = (value: string) => {
      const upper = value.trim().toUpperCase();
      if (!upper) return;
      if (upper.includes('ADMIN')) collected.add('ADMIN');
      if (upper.includes('MANAGER')) collected.add('MANAGER');
      if (upper.includes('EMPLOYEE')) collected.add('EMPLOYEE');
    };

    const parse = (value: unknown) => {
      if (!value) return;

      if (Array.isArray(value)) {
        value.forEach((item) => parse(item));
        return;
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return;

        try {
          const parsedJson = JSON.parse(trimmed);
          parse(parsedJson);
          return;
        } catch {
          // not JSON, fall through
        }

        const normalized = trimmed.replace(/[\[\]"']/g, ' ');
        normalized
          .split(/[^A-Z0-9]+/i)
          .map((token) => token.trim())
          .filter(Boolean)
          .forEach(addToken);
        return;
      }

      if (typeof value === 'object') {
        const maybeRoles = (value as Record<string, unknown>)['roles'];
        if (maybeRoles) {
          parse(maybeRoles);
        }
      }
    };

    parse(input);

    if (!collected.size) {
      console.warn('No role found, assigning EMPLOYEE role by default');
      return ['EMPLOYEE'];}
    return Array.from(collected);
  }

  private async loadUserByEmail(email: string): Promise<Partial<SessionUser> | null> {
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    if (!normalizedEmail) return null;

    return firstValueFrom(
      this.http.post<GraphqlResponse<{ userByEmail: UserResponse | null }>>(
        GRAPHQL_ENDPOINT,
        {
          query: USER_BY_EMAIL_QUERY,
          variables: { email: normalizedEmail },
        },
        { withCredentials: true }
      ).pipe(
        map((resp) => {
          if (resp.errors?.length) {
            throw new Error(resp.errors.map((e) => e.message).join(', '));
          }
          return this.userFromResponse(resp.data?.userByEmail ?? null);
        }),
        catchError((err) => {
          console.warn('Unable to retrieve profile', err);
          return of(null);
        })
      )
    );
  }

  private userFromResponse(resp: UserResponse | null): Partial<SessionUser> | null {
    if (!resp) return null;
    return {
      id: resp.id,
      email: resp.email,
      firstName: resp.firstName ?? undefined,
      lastName: resp.lastName ?? undefined,
      poste: resp.poste ?? undefined,
      phone: resp.phone ?? undefined,
      roles: this.extractRoles(resp.role),
    };
  }
}
