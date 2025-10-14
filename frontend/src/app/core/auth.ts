import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Session = { token: string; user: { id: string; email: string; role: 'EMPLOYEE' | 'MANAGER' } } | null;

const STORAGE_KEY = 'tm.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _session$ = new BehaviorSubject<Session>(null);
  session$ = this._session$.asObservable();

  get session(): Session { return this._session$.value; }
  get token(): string | null { return this.session?.token ?? null; }
  get isAuthenticated(): boolean { return !!this.token; }

  hydrateFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try { this._session$.next(JSON.parse(raw)); } catch { }
  }

  loginSuccess(session: Session) {
    this._session$.next(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  logout() {
    this._session$.next(null);
    localStorage.removeItem(STORAGE_KEY);
  }
}
