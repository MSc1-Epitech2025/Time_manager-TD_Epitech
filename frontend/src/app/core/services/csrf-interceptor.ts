import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  private readonly CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
  private readonly CSRF_TOKEN_KEY = 'tm-csrf-token';

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.shouldAddCsrfToken(req)) {
      const token = this.getCsrfToken();
      const modifiedReq = req.clone({
        setHeaders: { [this.CSRF_HEADER_NAME]: token },
      });
      return next.handle(modifiedReq);
    }
    return next.handle(req);
  }

  private shouldAddCsrfToken(req: HttpRequest<any>): boolean {
    const method = req.method.toUpperCase();
    return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
  }

  private getCsrfToken(): string {
    let token = sessionStorage.getItem(this.CSRF_TOKEN_KEY);
    if (!token) {
      token = this.generateCsrfToken();
      sessionStorage.setItem(this.CSRF_TOKEN_KEY, token);
    }
    return token;
  }

  private generateCsrfToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
}
