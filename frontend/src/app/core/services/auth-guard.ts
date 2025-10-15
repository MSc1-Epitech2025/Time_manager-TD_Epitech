import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth';

function checkAuth(): boolean | UrlTree {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated
    ? true
    : router.createUrlTree(['/login'], { queryParams: { reason: 'unauth' } });
}

export const authCanMatch: CanMatchFn = () => checkAuth();
export const authCanActivate: CanActivateFn = () => checkAuth();

export const roleCanActivate: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const session = auth.session;

  if (!session || !auth.isAuthenticated) {
    return router.createUrlTree(['/login'], { queryParams: { reason: 'unauth' } });
  }

  const role = session.user.role?.toUpperCase?.() ?? '';
  if (role.includes('MANAGER') || role.includes('ADMIN')) {
    return true;
  }

  return router.createUrlTree(['/employee']);
};
