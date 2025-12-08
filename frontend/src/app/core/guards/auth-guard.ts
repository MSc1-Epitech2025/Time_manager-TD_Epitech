import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService, Role } from '@core/services/auth';

function checkAuth(): boolean | UrlTree {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated
    ? true
    : router.createUrlTree(['/login'], { queryParams: { reason: 'unauth' } });
}

function getAuthenticatedSession() {
  const auth = inject(AuthService);
  const router = inject(Router);

  const session = auth.session;
  if (!session || !auth.isAuthenticated) {
    return { session: null, redirect: router.createUrlTree(['/login'], { queryParams: { reason: 'unauth' } }) };
  }
  return { session, redirect: null };
}

function checkRole(requiredRoles: Role[]): boolean | UrlTree {
  const { session, redirect } = getAuthenticatedSession();
  if (redirect) return redirect;

  const router = inject(Router);
  const userRoles = session!.user.roles ?? [];
  const hasAccess = requiredRoles.some(role => includesRole(userRoles, role));
  
  return hasAccess ? true : router.createUrlTree(['/employee']);
}

export const authCanMatch: CanMatchFn = () => checkAuth();
export const authCanActivate: CanActivateFn = () => checkAuth();

export const adminGuard: CanActivateFn = () => checkRole(['ADMIN']);
export const managerGuard: CanActivateFn = () => checkRole(['MANAGER', 'ADMIN']);

export const planningUrlGuard: CanActivateFn = (route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean | UrlTree => {
  const { session, redirect } = getAuthenticatedSession();
  if (redirect) return redirect;

  const router = inject(Router);
  const roles = session!.user.roles ?? [];
  const isManager = includesRole(roles, 'MANAGER') || includesRole(roles, 'ADMIN');

  const displayName = deriveDisplayName(session!.user).trim();

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

function includesRole(list: Role[], role: Role): boolean {
  return list.includes(role);
}

function deriveDisplayName(user: { fullName?: string; email?: string; id?: string }): string {
  const full = user.fullName?.split(' ')[0]?.trim();
  if (full) return full;
  const fromMail = user.email?.split('@')[0]?.trim();
  if (fromMail) return fromMail;
  return String(user.id ?? 'user');
}
