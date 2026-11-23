import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GradesService, GradeInfo } from '../../services/grades.service';
import { AttendanceService, AttendanceStats } from '../../services/attendance.service';
import { ReportsService } from '../../services/reports.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-dash-estudiante',
  imports: [CommonModule],
  template: `
    <div class="container p-4">
      <h1 class="mb-3">Mi EduCoro</h1>

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="card shadow-sm">
            <div class="card-body">
              <h6 class="card-title small text-secondary">Promedio General</h6>
              <div class="display-4 text-primary fw-bold">{{ info()?.promedioGeneral?.toFixed(2) }}</div>
              @if (info()?.enRiesgo) { <div class="alert alert-danger small">En Riesgo académico (promedio < 10)</div> }
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card shadow-sm">
            <div class="card-body">
              <h6 class="card-title small text-secondary">Asistencia</h6>
              <div class="display-4 text-primary fw-bold">{{ stats()?.porcentajeInasistencias?.toFixed(1) ?? '-' }}</div>
              <div class="small text-secondary">{{ stats()?.presentes ?? 0 }} presentes / {{ stats()?.ausentes ?? 0 }} ausentes / {{ stats()?.justificados ?? 0 }} justificados</div>
              @if ((stats()?.porcentajeInasistencias ?? 0) > 20) { <div class="alert alert-warning small mt-2 mb-0">Alerta: mas del 20% inasistencias</div> }
            </div>
          </div>
        </div>
      </div>

      <h3>Notas por Corte</h3>
      <table class="table table-bordered table-hover bg-white shadow-sm">
        <thead class="table-indigo text-center"><tr><th>Catedra</th><th>C1 (30%)</th><th>C2 (35%)</th><th>C3 (35%)</th><th>Final</th></tr></thead>
        <tbody>
          <tr *ngFor="let g of grades()">
            <td>{{ g.subject }}</td>
            <td class="text-center">{{ g.cut1 != null ? g.cut1 : '-' }}</td>
            <td class="text-center">{{ g.cut2 != null ? g.cut2 : '-' }}</td>
            <td class="text-center">{{ g.cut3 != null ? g.cut3 : '-' }}</td>
            <td class="text-center">{{ g.finalGrade != null ? g.finalGrade.toFixed(2) : '-' }}</td>
          </tr>
        </tbody>
      </table>

      <h4 class="mt-4">Boletin y Registro</h4>
      <button class="btn btn-outline-primary btn-sm mb-2" (click)="downloadBoletin()">Descargar boletin (PDF)</button>
    </div>
  `
})
export class DashEstudiante implements OnInit {
  private gradesSvc = inject(GradesService);
  private attendanceSvc = inject(AttendanceService);
  private reportsSvc = inject(ReportsService);
  private auth = inject(AuthService);

  info = signal<GradeInfo | null>(null);
  stats = signal<AttendanceStats | null>(null);
  grades = signal<any[]>([]);
  studentId = '';

  constructor() { void this.auth.me().then((u) => { if (u?.studentId) this.studentId = u.studentId; }); }

  ngOnInit() { void this.refresh(); }

  private async refresh() {
    if (!this.studentId) {
      const u = await this.auth.me();
      this.studentId = u?.studentId ?? '';
      if (!this.studentId) return;
    }
    this.info.set(await this.gradesSvc.promedio(this.studentId));
    this.grades.set(await this.gradesSvc.list(this.studentId));
    this.stats.set(await this.attendanceSvc.porcentaje(this.studentId));
  }

  downloadBoletin() {
    if (!this.studentId) return;
    const a = document.createElement('a');
    a.href = `http://localhost:3500/api/reports/students/${this.studentId}/boletin.pdf`;
    a.target = '_blank';
    a.download = `boletin-${this.studentId}.pdf`;
    a.click();
  }
}
