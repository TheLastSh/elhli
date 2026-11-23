import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  constructor(private api: ApiService) {}

  estadisticas(studentId: string): Promise<{ student: any; grades: any[]; promedioGeneral: number; porcentajeInasistencias: number; attendance: any; alerts: any[] }> {
    return firstValueFrom(this.api.get<{ ok: boolean; student: any; grades: any[]; promedioGeneral: number; porcentajeInasistencias: number; attendance: any; alerts: any[] }>(`/api/reports/students/${studentId}/estadisticas`).pipe(map((r) => ({ ...r }))));
  }
}
