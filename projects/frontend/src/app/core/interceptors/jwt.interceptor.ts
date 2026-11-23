import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const token = localStorage.getItem('edu_access_token');
  const req2 = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(req2);
};
