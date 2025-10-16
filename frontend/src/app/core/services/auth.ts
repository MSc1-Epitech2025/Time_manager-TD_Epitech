// src/app/core/auth.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

type Role = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: { id: string; email: string; role: Role };
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; email: string; role: Role };
};

const STORAGE_KEY = 'tm.session';
const REMEMBER_KEY = 'tm.remember';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private session$ = new BehaviorSubject<Session | null>(null);
  private refreshPromise: Promise<string | null> | null = null;

  constructor(private http: HttpClient) { }

  get session(): Session | null { return this.session$.value; }
  get isAuthenticated(): boolean { return !!this.session?.accessToken; }
  get token(): string | null { return this.session?.accessToken ?? null; }

  private get storage(): Storage {
    const remember = (localStorage.getItem(REMEMBER_KEY) ?? 'true') === 'true';
    return remember ? localStorage : sessionStorage;
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      console.error('Token invalide', e);
      return null;
    }
  }

  hydrateFromStorage() {
    const raw = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try { this.session$.next(JSON.parse(raw) as Session); } catch { }
  }

  loginSuccess(session: Session, remember = true) {
    localStorage.setItem(REMEMBER_KEY, String(remember));
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, JSON.stringify(session));
    this.session$.next(session);
  }

  logout() {
    this.session$.next(null);
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }

  async login(email: string, password: string, remember = true) {
    const query = `
    mutation {
      login(input: { email: "${email}", password: "${password}" }) {
        token
      }
    }
  `;

    const response = await fetch('http://localhost:8030/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error('Erreur de connexion au serveur GraphQL');
    }

    const result = await response.json();
    const token = result.data?.login?.token;

    if (!token) throw new Error('Le serveur n’a pas renvoyé de token');

    const decoded = this.decodeToken(token);
    const role = decoded?.role?.toUpperCase?.() ?? 'EMPLOYEE';
    const id = decoded?.id ?? 'unknown';
    const mail = decoded?.sub ?? email;

    const session: Session = {
      accessToken: token,
      refreshToken: '',
      expiresAt: Date.now() + 30 * 1000,
      user: { id, email: mail, role },
    };

    this.loginSuccess(session, remember);
    return session;
  }

  private accessTokenValid(): boolean {
    const exp = this.session?.expiresAt ?? 0;
    return Date.now() < exp - 10_000;
  }

  async ensureValidAccessToken(): Promise<string | null> {
    if (this.accessTokenValid()) return this.session!.accessToken;

    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.doRefresh().finally(() => (this.refreshPromise = null));
    return this.refreshPromise;
  }

  private async doRefresh(): Promise<string | null> {
    const sess = this.session;
    if (!sess?.refreshToken) return null;

    try {
      const resp = await firstValueFrom(this.http.post<any>('/api/auth/refresh', {
        refreshToken: sess.refreshToken,
      }));
      const updated: Session = {
        ...sess,
        accessToken: resp.accessToken,
        refreshToken: resp.refreshToken ?? sess.refreshToken,
        expiresAt: Date.now() + resp.expiresIn * 1000,
      };
      const remember = (localStorage.getItem(REMEMBER_KEY) ?? 'true') === 'true';
      const target = remember ? localStorage : sessionStorage;
      target.setItem(STORAGE_KEY, JSON.stringify(updated));
      this.session$.next(updated);
      return updated.accessToken;
    } catch {
      this.logout();
      return null;
    }
  }
}
