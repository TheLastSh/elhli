import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom, map } from 'rxjs';

export interface Grade { _id: string; studentId: string; subject: string; cut1?: number; cut2?: number; cut3?: number; finalGrade: number; createdAt: string }
export interface GradeInfo { studentId: string; fullName: string; section: string; totalCalificaciones: number; promedioGeneral: number; status: string; enRiesgo: boolean }

@Injectable({ providedIn: 'root' })
export class GradesService {
  constructor(private api: ApiService) {}

  list(studentId?: string): Promise<Grade[]> {
    return firstValueFrom(this.api.get<{ ok: boolean; data: Grade[] }>('/api/grades', studentId ? { studentId } : undefined).pipe(map((r) => r.data ?? [])));
  }
  getOne(id: string): Promise<Grade> {
    return firstValueFrom(this.api.get<{ ok: boolean; grade: Grade }>(`/api/grades/${id}`).pipe(map((r) => r.grade)));
  }
  save(grade: Partial<Grade>, id?: string): Promise<{ ok: boolean; grade: Grade; promedio: number; studentStatus: string }> {
    return firstValueFrom(this.api.post<{ ok: boolean; grade: Grade; promedio: number; studentStatus: string }>(id ? `/api/grades/${id}` : '/api/grades', grade));
  }
  promedio(studentId: string): Promise<GradeInfo> {
    return firstValueFrom(this.api.get<{ ok: boolean; info: GradeInfo }>(`/api/grades/${studentId}/promedio`).pipe(map((r) => r.info)));
  }
}
