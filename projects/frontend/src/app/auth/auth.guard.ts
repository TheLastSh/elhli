import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { homeRouteFor } from './home-route';
import { ToastService } from '../shared/toast.service';

export function requireRole(...roles: string[]): CanActivateFn {
  return async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);
    const ctx = await auth.whoami();
    if (!ctx) {
      return router.navigate(['/login']).then(() => false);
    }
    // Rol Admin comparte los dashboards de Coordinador (User.model.js + Business_Rules.md §4).
    const allowed = roles.includes(ctx.role) || (roles.includes('Coordinador') && ctx.role === 'Admin');
    if (!allowed) {
      // Autenticado pero sin permiso: vuelve a su home, no al login.
      toast.show('Acceso denegado', `Tu rol (${ctx.role}) no puede acceder a ${state.url}`);
      return router.navigate([homeRouteFor(ctx.role)]).then(() => false);
    }
    (route as any).ctx = ctx;
    return true;
  };
}
