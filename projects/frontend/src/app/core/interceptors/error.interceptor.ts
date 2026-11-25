import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError, from, switchMap } from 'rxjs';
import { ToastService } from '../../shared/toast.service';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

// Un solo refresh por ráfaga de errores 401 y reintento a la petición original.
let refreshPromise: Promise<boolean> | null = null;
let refreshingReq: HttpRequest<any> | null = null;

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  const router = inject(Router);

  // No intentamos refrescar la petición del refresh mismo.
  if (req.url.includes('/api/users/refresh')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) {
        if (err.status === 403) {
          toast.show('Acceso denegado', err.error?.message || err.statusText);
        } else if (!req.url.includes('/users/login')) {
          toast.show(err.error?.message || err.statusText || 'Error en la red', err.error?.suggestion || '');
        }
        return throwError(() => err);
      }

      const attemptRefresh = () => {
        if (!refreshPromise) {
          refreshPromise = auth.refresh().finally(() => {
            refreshPromise = null;
          });
        }
        return refreshPromise;
      };

      if (refreshingReq) {
        // Cola: todos esperan la misma renovación (single flight).
        return from(attemptRefresh()).pipe(switchMap(() => throwError(() => err)));
      }

      refreshingReq = req;
      return from(attemptRefresh()).pipe(
        switchMap((ok: boolean) => {
          refreshingReq = null;
          if (!ok) {
            void auth.logout();
            void router.navigate(['/login']);
            return throwError(() => err);
          }
          const token = auth.token();
          if (!token) return throwError(() => err);
          // Reintento con el token renovado.
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
        })
      );
    })
  );
};
