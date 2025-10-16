// auth-guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';

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

export const planningUrlGuard: CanActivateFn = (route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const session = auth.session;
  if (!session || !auth.isAuthenticated) {
    return router.createUrlTree(['/login'], { queryParams: { reason: 'unauth' } });
  }

  const roleRaw = String(session.user.role ?? '');
  const role = roleRaw.toUpperCase();
  const isManager = role.includes('MANAGER') || role.includes('ADMIN');

  const email = session.user.email ?? '';
  const displayName = (email.split('@')[0] || session.user.id || 'user').trim();

  const qp = route.queryParams ?? {};
  const key = isManager ? 'manager' : 'employee';

  const hasCorrectKey = Object.prototype.hasOwnProperty.call(qp, key);
  const keyHasRightValue = (qp[key] ?? '') === displayName;
  const hasWrongKey = isManager ? Object.prototype.hasOwnProperty.call(qp, 'employee')
                                : Object.prototype.hasOwnProperty.call(qp, 'manager');

  if (!hasCorrectKey || !keyHasRightValue || hasWrongKey) {
    const queryParams: any = {};
    queryParams[key] = displayName;
    return router.createUrlTree(['/planning'], { queryParams });
  }

  return true;
};
