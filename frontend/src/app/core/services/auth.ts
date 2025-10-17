// src/app/core/services/auth.ts
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
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
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
    return !!this.session?.accessToken;
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
      console.warn('Session stockée invalide', err);
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
          token
        }
      }
    `;

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { input: { email, password } } }),
    });

    if (!response.ok) {
      throw new Error('Erreur de connexion au serveur GraphQL');
    }

    const result = await response.json();
    const token = result.data?.login?.token;

    if (!token) throw new Error('Le serveur n’a pas renvoyé de token');

    const decoded = this.decodeToken(token) ?? {};
    const roles = this.extractRoles(decoded['role']);
    const id = String(decoded['uid'] ?? decoded['id'] ?? '');
    const mail = String(decoded['sub'] ?? email ?? '').toLowerCase();
    const firstName = decoded['given_name'] ? String(decoded['given_name']) : undefined;
    const expSeconds = typeof decoded['exp'] === 'number' ? decoded['exp'] : undefined;
    const expiresAt = expSeconds ? expSeconds * 1000 : Date.now() + 15 * 60 * 1000;

    const session: Session = {
      accessToken: token,
      refreshToken: null,
      expiresAt,
      user: this.normalizeUser({
        id,
        email: mail,
        roles,
        firstName,
      }),
    };

    this.loginSuccess(session, remember);
    await this.refreshProfile().catch(() => {});
    return this.session ?? session;
  }

  async ensureValidAccessToken(): Promise<string | null> {
    const sess = this.session;
    if (!sess) return null;
    if (this.accessTokenValid(sess)) return sess.accessToken;
    console.warn('Token expiré — déconnexion automatique');
    this.logout();
    return null;
  }

  async refreshProfile(): Promise<SessionUser | null> {
    const sess = this.session;
    if (!sess) return null;

    try {
      const email = sess.user.email;
      if (!email) return null;

      const profile = await firstValueFrom(
        this.http.post<GraphqlResponse<{ userByEmail: UserResponse | null }>>(GRAPHQL_ENDPOINT, {
          query: USER_BY_EMAIL_QUERY,
          variables: { email },
        }).pipe(
          map((resp) => {
            if (resp.errors?.length) {
              throw new Error(resp.errors.map((e) => e.message).join(', '));
            }
            return this.userFromResponse(resp.data?.userByEmail ?? null);
          }),
          catchError((err) => {
            console.warn('Impossible de récupérer le profil', err);
            return of(null);
          })
        )
      );

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
      console.warn('Echec du rafraîchissement du profil', err);
      return null;
    }
  }

  private accessTokenValid(session: Session): boolean {
    const exp = session.expiresAt ?? 0;
    return !!exp && Date.now() < exp - 10_000;
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

  private decodeToken(token: string): Record<string, unknown> | null {
    try {
      const payload = token.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      return JSON.parse(atob(padded));
    } catch (e) {
      console.error('Token invalide', e);
      return null;
    }
  }

  private normalizeSession(raw: any): Session {
    const expiresAt = typeof raw?.expiresAt === 'number'
      ? raw.expiresAt
      : (typeof raw?.expiresIn === 'number' ? Date.now() + raw.expiresIn * 1000 : Date.now() + 15 * 60 * 1000);

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

    return {
      accessToken: String(raw?.accessToken ?? ''),
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
    const normalize = (value: string): Role | null => {
      const upper = value.replace(/[\[\]"]/g, '').trim().toUpperCase();
      if (upper.includes('ADMIN')) return 'ADMIN';
      if (upper.includes('MANAGER')) return 'MANAGER';
      if (upper.includes('EMPLOYEE')) return 'EMPLOYEE';
      return null;
    };

    if (!input) return ['EMPLOYEE'];

    if (Array.isArray(input)) {
      const roles = input
        .map((item) => typeof item === 'string' ? item : String(item))
        .map(normalize)
        .filter((r): r is Role => !!r);
      return roles.length ? Array.from(new Set(roles)) : ['EMPLOYEE'];
    }

    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return this.extractRoles(parsed);
      } catch {
        // ignore, treat as raw string
      }
      const role = normalize(input);
      return role ? [role] : ['EMPLOYEE'];
    }

    if (typeof input === 'object' && input !== null && 'roles' in (input as Record<string, unknown>)) {
      return this.extractRoles((input as Record<string, unknown>)['roles']);
    }

    return ['EMPLOYEE'];
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
