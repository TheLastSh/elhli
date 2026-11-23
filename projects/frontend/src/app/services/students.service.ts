import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom, map } from 'rxjs';

export interface Student { _id: string; ci: string; fullName: string; email: string; section: string; status: string; qrCode?: string }

@Injectable({ providedIn: 'root' })
export class StudentsService {
  constructor(private api: ApiService) {}

  list(params?: Record<string, any>): Promise<{ data: Student[]; pagination: { page: number; total: number } }> {
    return firstValueFrom(this.api.get<{ ok: boolean; data: Student[]; pagination: { page: number; total: number } }>('/api/students', params).pipe(map((r) => ({ data: r.data ?? [], pagination: r.pagination ?? { page: 1, total: 0 } }))));
  }
  getOne(id: string): Promise<Student> {
    return firstValueFrom(this.api.get<{ ok: boolean; student: Student }>(`/api/students/${id}`).pipe(map((r) => r.student)));
  }
  create(s: Partial<Student>): Promise<Student> {
    return firstValueFrom(this.api.post<{ ok: boolean; student: Student }>('/api/students', s).pipe(map((r) => r.student)));
  }
  update(id: string, s: Partial<Student>): Promise<Student> {
    return firstValueFrom(this.api.put<{ ok: boolean; student: Student }>(`/api/students/${id}`, s).pipe(map((r) => r.student)));
  }
}
