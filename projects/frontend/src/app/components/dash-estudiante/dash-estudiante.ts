import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GradesService, GradeInfo } from '../../services/grades.service';
import { AttendanceService, AttendanceStats, Attendance } from '../../services/attendance.service';
import { ReportsService } from '../../services/reports.service';
import { StudentsService } from '../../services/students.service';
import { AuthService } from '../../auth/auth.service';
import { BadgeStatus } from '../shared/badge-status';

@Component({
  standalone: true,
  selector: 'app-dash-estudiante',
  imports: [CommonModule, BadgeStatus],
  template: `
    <div class="container p-4">
      <h1 class="mb-3">Mi EduCoro</h1>
      @if (loadError()) { <div class="alert alert-warning">{{ loadError() }}</div> }
      @if (loading()) { <div class="text-center py-4"><div class="spinner-border" role="status"></div></div> }
      @if (!loading() && !dataLoaded() && !loadError()) { <p class="text-muted">Sin datos aún.</p> }

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="card w-glass-card">
            <div class="card-body">
              <h6 class="card-title small text-secondary">Promedio General</h6>
              <div class="display-4 text-primary fw-bold">{{ fmt(info()?.promedioGeneral) }}</div>
              <div class="mt-2"><w-badge-status [status]="info()?.status || 'Activo'" title="Estado Academic" /></div>
              @if (info()?.enRiesgo) { <div class="alert alert-danger small mt-2 mb-0">En Riesgo académico (promedio < 10)</div> }
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card w-glass-card">
            <div class="card-body">
              <h6 class="card-title small text-secondary">% Inasistencias</h6>
              <div class="display-4 text-primary fw-bold">{{ stats()?.porcentajeInasistencias?.toFixed(1) ?? '-' }}</div>
              <div class="small text-secondary">{{ stats()?.presentes ?? 0 }} presentes / {{ stats()?.ausentes ?? 0 }} ausentes / {{ stats()?.justificados ?? 0 }} justificados</div>
              @if ((stats()?.porcentajeInasistencias ?? 0) > 20) { <div class="alert alert-warning small mt-2 mb-0">Alerta: más del 20% de inasistencias</div> }
            </div>
          </div>
        </div>
      </div>

      <h4 class="mt-4">Mi carné</h4>
      @if (qrCode()) {
        <div class="card w-glass-card">
          <div class="card-body">
            <p class="text-center mb-2"><span class="badge bg-primary text-white">Código QR (escanee con el DOCENTE)</span></p>
            <p class="text-center font-monospace display-4">{{ qrCode() }}</p>
            <div class="text-center small text-secondary mt-2">Si no funciona, pídele al Docente que escriba el código manualmente.</div>
          </div>
        </div>
      }

      <h3>Notas por Corte</h3>
      <table class="table table-bordered table-hover w-glass-table">
        <thead class="table-indigo text-center"><tr><th>Catedra</th><th>C1 (30%)</th><th>C2 (35%)</th><th>C3 (35%)</th><th>Final</th></tr></thead>
        <tbody>
          <tr *ngFor="let g of grades()">
            <td>{{ g.subject }}</td>
            <td class="text-center">{{ fmt(g.cut1) }}</td>
            <td class="text-center">{{ fmt(g.cut2) }}</td>
            <td class="text-center">{{ fmt(g.cut3) }}</td>
            <td class="text-center">{{ fmt(g.finalGrade) }}</td>
          </tr>
        </tbody>
      </table>

      <h4 class="mt-4">Registro de Asistencias</h4>
      <table class="table table-bordered table-hover w-glass-table">
        <thead><tr><th>Fecha</th><th>Estado</th></tr></thead>
        <tbody>
          <tr *ngFor="let a of attendance()">
            <td>{{ a.date | date: 'shortDate' }}</td>
            <td class="text-center"><w-badge-status [status]="a.status" /></td>
          </tr>
          <tr *ngIf="attendance().length === 0"><td class="text-muted" colspan="2">Sin registros de asistencia.</td></tr>
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
  private studentsSvc = inject(StudentsService);
  private auth = inject(AuthService);

  info = signal<GradeInfo | null>(null);
  stats = signal<AttendanceStats | null>(null);
  grades = signal<any[]>([]);
  attendance = signal<Attendance[]>([]);
  qrCode = signal<string | null>(null);
  studentId = '';
  loading = signal(true);
  loadError = signal<string | null>(null);
  dataLoaded = signal(false);

  constructor() { void this.auth.me().then((u) => { if (u?.studentId) this.studentId = u.studentId; }); }

  ngOnInit() { void this.refresh(); }

  private fmt(v: any) { return typeof v === 'number' ? v.toFixed(2) : (v ?? '-'); }

  private async refresh() {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      if (!this.studentId) {
        const u = await this.auth.me();
        this.studentId = u?.studentId ?? '';
        if (!this.studentId) throw new Error('No tienes perfil de estudiante asociado');
      }
      const [info, grades, stats, att, student] = await Promise.all([
        this.gradesSvc.promedio(this.studentId),
        this.gradesSvc.list(this.studentId),
        this.attendanceSvc.porcentaje(this.studentId),
        this.attendanceSvc.list(this.studentId),
        this.studentsSvc.getOne(this.studentId)
      ]);
      this.info.set(info);
      this.grades.set(grades);
      this.stats.set(stats);
      this.attendance.set(att.slice(0, 50));
      this.qrCode.set(student.qrCode || null);
      this.dataLoaded.set(true);
    } catch {
      this.loadError.set('No se pudieron cargar tus datos académicos. Verifica tu conexión o tus permisos.');
    } finally {
      this.loading.set(false);
    }
  }

  async downloadBoletin() {
    if (!this.studentId) return;
    try {
      await this.reportsSvc.downloadBoletin(this.studentId);
    } catch {
      this.loadError.set('No se pudo descargar el boletín: sin permisos o sesión expirada.');
    }
  }
}
