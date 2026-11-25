import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private api(path: string) { return `${environment.apiBase}${path}`; }
  private authHeader() { return { Authorization: `Bearer ${localStorage.getItem('edu_access_token')}` }; }

  get<T = any>(path: string, params?: Record<string, any>): Observable<T> { return this.http.get<T>(this.api(path), { params, headers: this.authHeader() }); }
  post<T = any>(path: string, body?: any): Observable<T> { return this.http.post<T>(this.api(path), body, { headers: this.authHeader() }); }
  put<T = any>(path: string, body?: any): Observable<T> { return this.http.put<T>(this.api(path), body, { headers: this.authHeader() }); }
  delete<T = any>(path: string): Observable<T> { return this.http.delete<T>(this.api(path), { headers: this.authHeader() }); }

  /** Descarga autenticada de un endpoint de archivos (blob). R 475 */
  async download(path: string, filename: string) {
    const blob = await firstValueFrom(this.http.get(this.api(path), { responseType: 'blob', headers: this.authHeader() }));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
