import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom, map } from 'rxjs';

export interface UserRow { _id: string; email: string; fullName: string; role: string; ci?: string; studentId?: string }
export interface UserListResp { ok: boolean; users: UserRow[]; pagination: { page: number; total: number; limit: number } }
export interface CreateUserResp { ok: boolean; user: UserRow }

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private api: ApiService) {}

  list(params?: { page?: number; limit?: number; q?: string }) {
    return firstValueFrom(this.api.get<UserListResp>('/api/users', params).pipe(map((r) => r)));
  }
  create(u: { email: string; password: string; fullName: string; role?: string; ci?: string; studentId?: string }) {
    return firstValueFrom(this.api.post<CreateUserResp>('/api/users', u));
  }
  update(id: string, u: Partial<UserRow>) {
    return firstValueFrom(this.api.put<CreateUserResp>(`/api/users/${id}`, u));
  }
  changePassword(id: string, password: string) {
    return firstValueFrom(this.api.put(`/api/users/${id}/password`, { password }));
  }
  delete(id: string) {
    return firstValueFrom(this.api.delete(`/api/users/${id}`));
  }
}
