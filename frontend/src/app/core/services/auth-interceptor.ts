// src/app/core/auth-interceptor.ts
import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, from, switchMap, throwError, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private auth = inject(AuthService);
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return from(this.auth.ensureValidAccessToken()).pipe(
      switchMap((token) => {
        const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

        return next.handle(authReq).pipe(
          catchError((err: HttpErrorResponse) => {
            if (err.status !== 401) return throwError(() => err);

            return from(this.auth.ensureValidAccessToken()).pipe(
              switchMap((newToken) => {
                if (!newToken) {
                  this.auth.logout();
                  this.router.navigate(['/login'], { queryParams: { reason: 'expired' } });
                  return throwError(() => err);
                }
                const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
                return next.handle(retried);
              }),
              catchError((e) => {
                this.auth.logout();
                this.router.navigate(['/login'], { queryParams: { reason: 'expired' } });
                return throwError(() => e);
              })
            );
          })
        );
      })
    );
  }
}
