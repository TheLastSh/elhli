import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom, map } from 'rxjs';

export interface Attendance { _id: string; studentId: string; date: string; section: string; status: string; createdAt: string; updatedAt: string }
export interface AttendanceStats { total: number; ausentes: number; presentes: number; justificados: number; porcentajeInasistencias: number }

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  constructor(private api: ApiService) {}

  list(studentId?: string, section?: string): Promise<Attendance[]> {
    return firstValueFrom(this.api.get<{ ok: boolean; data: Attendance[] }>('/api/attendance', { studentId, section }).pipe(map((r) => r.data ?? [])));
  }
  scan(qrCode: string): Promise<{ ok: boolean; attendance: Attendance }> {
    return firstValueFrom(this.api.post<{ ok: boolean; attendance: Attendance }>('/api/attendance/scan', { qrCode }));
  }
  save(attendance: Partial<Attendance>): Promise<{ ok: boolean; attendance: Attendance; stats: AttendanceStats; alerts: any[] }> {
    return firstValueFrom(this.api.post('/api/attendance', attendance));
  }
  porcentaje(studentId: string): Promise<AttendanceStats> {
    return firstValueFrom(this.api.get<{ ok: boolean; stats: AttendanceStats }>(`/api/attendance/estudiante/${studentId}/porcentaje`).pipe(map((r) => r.stats)));
  }
}
