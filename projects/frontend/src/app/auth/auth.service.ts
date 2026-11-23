import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface User { _id: string; email: string; role: string; fullName: string; ci?: string; studentId?: string; createdAt?: string }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'edu_access_token';
  private refreshKey = 'edu_refresh_token';

  constructor(private http: HttpClient, private router: Router) {}

  private api(path: string) { return `${environment.apiBase}${path}`; }

  token(): string | null { return localStorage.getItem(this.tokenKey); }
  refreshToken(): string | null { return localStorage.getItem(this.refreshKey); }

  async login(email: string, password: string): Promise<{ user?: User; message?: string }> {
    const res = await this.http.post<{ ok: boolean; user?: User; accessToken?: string; refreshToken?: string; message?: string }>(
      this.api('/api/users/login'), { email, password }).toPromise();
    if (res?.accessToken) {
      localStorage.setItem(this.tokenKey, res.accessToken);
      localStorage.setItem(this.refreshKey, res.refreshToken || '');
    }
    return { user: res?.user, message: res?.message };
  }

  async me(): Promise<User | null> {
    try {
      const res = await this.http.get<{ ok: boolean; user: User }>(this.api('/api/users/me')).toPromise();
      return res?.user ?? null;
    } catch { return null; }
  }

  async refresh(): Promise<boolean> {
    const refreshToken = this.refreshToken();
    if (!refreshToken) return false;
    try {
      const res = await this.http.post<{ ok: boolean; accessToken?: string }>(this.api('/api/users/refresh'), { refreshToken }).toPromise();
      if (res?.accessToken) localStorage.setItem(this.tokenKey, res.accessToken);
      return !!res?.accessToken;
    } catch { return false; }
  }

  async logout() {
    try { await this.http.post(this.api('/api/users/logout'), {}).toPromise(); } catch {}
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
    void this.router.navigate(['/login']);
  }

  async whoami(): Promise<{ user: User; role: string } | null> {
    const user = await this.me();
    if (!user) return null;
    return { user, role: user.role };
  }
}
