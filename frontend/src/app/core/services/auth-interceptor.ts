import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, catchError, switchMap, from } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth';
import { environment } from '@environments/environment';

const BACKEND_HOSTS = new Set([
  'http://localhost:8030',
  'https://localhost:8030',
]);

const MAX_REFRESH_COUNT = environment.MAX_REFRESH_COUNT; //here

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
          const session = this.auth.session;
          const refreshCount = session?.refreshCount ?? 0;

          if (session && refreshCount < MAX_REFRESH_COUNT) { //here
            return from(this.auth.refreshToken()).pipe(
              switchMap(() => {
                const retryReq = authReq.clone({ withCredentials: true });
                return next.handle(retryReq);
              }),
              catchError((refreshErr) => {
                this.auth.logout();
                this.router.navigate(['/login'], { queryParams: { reason: 'expired' } });
                return throwError(() => refreshErr);
              })
            );
          }

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
