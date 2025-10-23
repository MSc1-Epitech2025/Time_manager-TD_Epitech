import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth';

const BACKEND_HOSTS = new Set([
  'http://localhost:8030',
  'https://localhost:8030',
]);

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private auth = inject(AuthService);
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const shouldAttachCredentials = req.withCredentials || this.isBackendRequest(req.url);
    const authReq = shouldAttachCredentials && !req.withCredentials
      ? req.clone({ withCredentials: true })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.auth.logout();
          this.router.navigate(['/login'], { queryParams: { reason: 'expired' } });
        }
        return throwError(() => err);
      })
    );
  }

  private isBackendRequest(url: string): boolean {
    try {
      const parsed = new URL(url, window.location.origin);
      const origin = `${parsed.protocol}//${parsed.host}`;
      if (BACKEND_HOSTS.has(origin)) return true;
      return parsed.origin === window.location.origin;
    } catch {
      return true;
    }
  }
}
