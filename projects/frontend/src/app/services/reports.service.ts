import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  constructor(private api: ApiService) {}

  /** Descarga autenticada de boletín (ver security: GET /api/reports/students/:id/boletin.pdf exige JWT) */
  downloadBoletin(studentId: string): Promise<void> {
    return this.api.download(`/api/reports/students/${studentId}/boletin.pdf`, `boletin-${studentId}.pdf`);
  }

  estadisticas(studentId: string): Promise<{ student: any; grades: any[]; promedioGeneral: number; porcentajeInasistencias: number; attendance: any; alerts: any[] }> {
    return firstValueFrom(this.api.get<{ ok: boolean; student: any; grades: any[]; promedioGeneral: number; porcentajeInasistencias: number; attendance: any; alerts: any[] }>(`/api/reports/students/${studentId}/estadisticas`).pipe(map((r) => ({ ...r }))));
  }
}
