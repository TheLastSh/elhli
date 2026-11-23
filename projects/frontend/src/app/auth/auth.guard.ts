import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export function requireRole(role: string): CanActivateFn {
  return async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const auth = inject(AuthService);
    const ctx = await auth.whoami();
    if (!ctx || ctx.role !== role) {
      return false;
    }
    (route as any).ctx = ctx;
    return true;
  };
}
