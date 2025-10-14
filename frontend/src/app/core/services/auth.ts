import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface AuthResponse {
  data: {
    login: {
      token: string;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly endpoint = 'http://localhost:8030/graphql';

  isLoggedIn = signal(false);
  token = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    const query = `
      mutation {
        login(input: { email: "${email}", password: "${password}" }) {
          token
        }
      }
    `;

    return this.http.post<AuthResponse>(this.endpoint, { query }).pipe(
      map((res) => {
        const token = res.data?.login?.token;
        if (token) {
          localStorage.setItem('tm-token', token);
          this.token.set(token);
          this.isLoggedIn.set(true);
        }
        return token;
      }),
      catchError((err) => {
        console.error('❌ Login failed:', err);
        return of(null);
      })
    );
  }

  logout() {
    localStorage.removeItem('tm-token');
    this.isLoggedIn.set(false);
    this.token.set(null);
  }

  restoreSession() {
    const token = localStorage.getItem('tm-token');
    if (token) {
      this.token.set(token);
      this.isLoggedIn.set(true);
    }
  }
}
