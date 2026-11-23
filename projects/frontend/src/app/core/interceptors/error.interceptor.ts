import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, retryWhen, scan, timer, throwError } from 'rxjs';
import { ToastService } from '../../shared/toast.service';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(
    retryWhen((errors) => timer(300, 500).pipe(scan((acc, _) => acc + 1, 0))),
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 || err.status === 403) {
        const msg = err.error?.message || err.statusText;
        if (err.status === 401) {
          auth.refresh().then((ok: boolean) => { if (!ok) void router.navigate(['/login']); }).catch(() => { void router.navigate(['/login']); });
        } else {
          toast.show('Acceso denegado', msg);
        }
      } else {
        toast.show(err.error?.message || err.statusText || 'Error en la red', err.error?.suggestion || '');
      }
      return throwError(() => err);
    })
  );
};
