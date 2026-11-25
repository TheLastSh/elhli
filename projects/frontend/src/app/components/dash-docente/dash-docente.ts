import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GradesService, Grade } from '../../services/grades.service';
import { StudentsService, Student } from '../../services/students.service';
import { AttendanceService, Attendance } from '../../services/attendance.service';
import { ToastService } from '../../shared/toast.service';
import { AuthService } from '../../auth/auth.service';
import { initializeSocket } from '../shared/socket';
import { BadgeStatus } from '../shared/badge-status';

interface Guardar { ok: boolean; [k: string]: any; }

@Component({
  standalone: true,
  selector: 'app-dash-docente',
  imports: [CommonModule, FormsModule, BadgeStatus],
  template: `
    <div class="container-fluid p-4">
      <h1 class="mb-4">EduCoro AI - Portal Docente</h1>
      @if (readOnly()) {
        <div class="alert alert-info small mb-3">Vista de lectura: funcionalidades de escritura no están disponibles para tu rol. Si necesitas modificar notas o asistencias, pídeselo a Coordinación.</div>
      }
      @if (loadError()) { <div class="alert alert-danger">{{ loadError() }}</div> }

      <div class="row mb-3">
        <div class="col-md-4">
          <label class="form-label small text-secondary" for="section">Sección</label>
          <select id="section" class="form-select" [(ngModel)]="section" (ngModelChange)="refreshAll()" name="section">
            <option *ngFor="let s of sections" [value]="s">{{ s }}</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label small text-secondary" for="studentSel">Filtrar por estudiante</label>
          <select id="studentSel" class="form-select" [(ngModel)]="filterStudentId" (ngModelChange)="refreshGrades()" name="filterStudent">
            <option value="">Todos</option>
            <option *ngFor="let s of students()" [value]="s._id">{{ nameOf(s) }}</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label small text-secondary" for="estRiesgo">Estado de los estudiantes de la sección</label>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            @for (st of students(); track st._id) {
              <w-badge-status [status]="st.status || 'Activo'" title="{{ st.fullName }}" style="cursor:help" />
            }
          </div>
        </div>
      </div>

      <h3 class="mb-3">Calificaciones - 30% - 35% - 35%</h3>
      @if (gradesLoaded()) {
        @if (grades().length === 0) {
          <p class="text-muted">No hay calificaciones registradas para esta sección aún.</p>
        }
      }
      <table class="table table-bordered table-hover table-sm w-glass-table">
        <thead class="table-indigo text-center">
          <tr>
            <th class="text-start">Estudiante</th>
            <th class="text-center">Corte 1</th>
            <th class="text-center">Corte 2</th>
            <th class="text-center">Corte 3</th>
            <th class="text-center">Final (autocalculado)</th>
            @if (!readOnly()) { <th class="text-center">Acción</th> }
          </tr>
        </thead>
        <tbody>
          @for (g of grades(); track g._id) {
            <tr>
              <td>{{ nameOf(g.student) || g.studentId }}</td>
              @if (readOnly()) {
                <td class="text-center font-monospace">{{ fmtNum(g.cut1) }}</td>
                <td class="text-center font-monospace">{{ fmtNum(g.cut2) }}</td>
                <td class="text-center font-monospace">{{ fmtNum(g.cut3) }}</td>
                <td class="text-center font-monospace">{{ fmtNum(g.finalGrade) }}</td>
              } @else {
                <td><input class="form-control form-control-sm text-center" type="number" step="0.01" min="0" max="20" [attr.disabled]="saving()" [(ngModel)]="g.cut1" /></td>
                <td><input class="form-control form-control-sm text-center" type="number" step="0.01" min="0" max="20" [attr.disabled]="saving()" [(ngModel)]="g.cut2" /></td>
                <td><input class="form-control form-control-sm text-center" type="number" step="0.01" min="0" max="20" [attr.disabled]="saving()" [(ngModel)]="g.cut3" /></td>
                <td class="text-center font-monospace">{{ fmtNum(g.finalGrade) }}</td>
                <td class="text-center">
                  <button class="btn btn-sm btn-primary" [attr.disabled]="saving()" (click)="saveGrade(g)">Guardar</button>
                </td>
              }
            </tr>
          }
          @if (!readOnly() && newGrade.studentId) {
            <tr>
              <td colspan="6" class="text-center">
                <span class="badge bg-secondary">Nueva evaluación</span>
                <input class="form-control form-control-sm d-inline w-25" style="width:25%" placeholder="Asignatura" [(ngModel)]="newGrade.subject" name="subjectNew" />
                <button class="btn btn-sm btn-outline-primary" (click)="addGrade()" [attr.disabled]="!newGrade.subject">Añadir</button>
              </td>
            </tr>
          }
        </tbody>
      </table>

      <h3 class="mt-4">Asistencia en Vivo</h3>
      <div class="d-flex gap-2 align-items-center mb-3">
        <input id="qr" class="form-control w-50" placeholder="Código QR del carné" [(ngModel)]="qrCode" />
        <button class="btn btn-sm btn-outline-primary" (click)="scan()" [attr.disabled]="scanMsg() !== ''">Escanear</button>
      </div>
      @if (scanMsg()) { <p class="small mb-2">{{ scanMsg() }}</p> }

      <div class="card w-glass-card mb-3">
        <div class="card-body py-2">
          <span class="text-secondary small">Registro de asistencia del estudiante seleccionado:</span>
          <div class="d-flex align-items-center gap-2 flex-wrap mt-2">
            <select class="form-select form-select-sm w-50" [(ngModel)]="formManual.studentId" name="fmStudent">
              <option value="">Estudiante...</option>
              <option *ngFor="let s of students()" [value]="s._id">{{ nameOf(s) }}</option>
            </select>
            <input type="date" class="form-control form-control-sm w-30" name="fmDate" [(ngModel)]="formManual.date" />
            <select class="form-select form-select-sm w-30" [(ngModel)]="formManual.status" name="fmStatus">
              <option>Presente</option><option>Ausente</option><option>Justificado</option>
            </select>
            <button class="btn btn-sm btn-outline-primary" (click)="guardarAsistenciaManual()" [attr.disabled]="manualSaving()">Registrar</button>
          </div>
        </div>
      </div>

      <table class="table table-sm">
        <thead class="text-center"><tr><th>Fecha</th><th>Estudiante</th><th>Estado</th></tr></thead>
        <tbody>
          <tr *ngFor="let a of attendance(); let i = index">
            <td class="text-center">{{ a.date | date: 'shortDate' }}</td>
            <td>{{ nameOf(studentMap.get(a.studentId)) }}</td>
            <td class="text-center"><w-badge-status [status]="a.status" /></td>
          </tr>
          <tr *ngIf="attendance().length === 0"><td class="text-muted text-center" colspan="3">Sin registros para esta sección.</td></tr>
        </tbody>
      </table>
    </div>
  `
})
export class DashDocente implements OnInit {
  private gradesSvc = inject(GradesService);
  private studentsSvc = inject(StudentsService);
  private attendanceSvc = inject(AttendanceService);
  private socket = inject(initializeSocket);
  private toast = inject(ToastService);

  sections = ['IA-1', 'IA-2', 'SIST-1'];
  section = signal('IA-1');
  students = signal<Student[]>([]);
  grades = signal<Grade[]>([]);
  attendance = signal<Attendance[]>([]);
  studentMap = new Map<string, Student>();

  gradesLoaded = signal(false);
  loadError = signal<string | null>(null);
  saving = signal(false);
  manualSaving = signal(false);
  scanMsg = signal('');
  filterStudentId = '';
  qrCode = '';
  newGrade = { studentId: '', subject: '' };
  formManual: { studentId: string; date: string; status: string } = { studentId: '', date: new Date().toISOString().slice(0, 10), status: 'Presente' };
  private auth = inject(AuthService);
  readOnly = computed(() => ['Coordinador', 'Admin'].includes(this.auth.role() ?? ''));
  ngOnInit() {
    void this.refreshAll();
    this.socket.on('attendance_registered', () => void this.refreshAll());
    this.socket.on('grades_updated', () => void this.refreshGrades());
    this.socket.on('alert_created', () => void this.refreshAll());
  }

  private fmtNum(v: any) { return typeof v === 'number' ? v.toFixed(2) : (v ?? '-'); }
  nameOf(s: any) {
    if (!s) return '';
    return s.fullName || (typeof s === 'string' ? s : '');
  }
  private syncStudentMap() {
    this.studentMap = new Map(this.students().map((s) => [s._id, s]));
  }

  private async refreshAll() {
    this.loadError.set(null);
    const section = this.section();
    try {
      const s = await this.studentsSvc.list({ section });
      const students = s.data ?? [];
      this.students.set(students);
      this.syncStudentMap();
      this.newGrade.studentId = '';
      await this.refreshGrades();
      const att = await this.attendanceSvc.list(undefined, section);
      this.attendance.set(att.slice(0, 50));
    } catch {
      this.loadError.set('No se pudieron cargar los datos del docente.');
    } finally {
      this.gradesLoaded.set(true);
    }
  }

  private async refreshGrades() {
    this.loadError.set(null);
    const studentId = this.filterStudentId;
    try {
      const grades = await this.gradesSvc.list();
      this.grades.set((grades || []).map((g) => ({ ...g, student: this.studentMap.get(g.studentId) })));
      this.gradesLoaded.set(true);
    } catch {
      this.loadError.set('No se pudieron cargar las calificaciones.');
    }
  }

  async scan() {
    this.scanMsg.set('');
    try {
      const r = await this.attendanceSvc.scan(this.qrCode);
      if (r?.ok) {
        this.scanMsg.set(`Asistencia registrada: ${r.attendance?.status}`);
        await this.refreshAll();
      } else {
        this.scanMsg.set('No se pudo registrar asistencia');
      }
    } catch (e: any) {
      this.scanMsg.set(e?.message || 'Código QR no válido o ya registrado hoy');
    }
  }

  async guardarAsistenciaManual() {
    if (this.manualSaving()) return;
    const { studentId, date, status } = this.formManual;
    if (!studentId) { this.toast.show('Elige un estudiante'); return; }
    this.manualSaving.set(true);
    try {
      await this.attendanceSvc.save({ studentId, date: date || new Date().toISOString().slice(0, 10), status });
      this.formManual.studentId = '';
      this.toast.show('Asistencia registrada');
      await this.refreshAll();
    } catch (e: any) {
      this.toast.show('No se pudo registrar asistencia', e?.message);
    } finally {
      this.manualSaving.set(false);
    }
  }

  async saveGrade(g: Grade) {
    if (this.readOnly()) return;
    this.saving.set(true);
    try {
      // El payload excluye finalGrade: el servidor recalcula a partir de los cortes (§1)
      const payload = { studentId: g.studentId, subject: g.subject, cut1: g.cut1, cut2: g.cut2, cut3: g.cut3 };
      await this.gradesSvc.save(payload, g._id);
      this.toast.show('Nota guardada');
      await this.refreshGrades();
    } catch (e: any) {
      this.toast.show('No se pudo guardar la calificación', e?.message);
    } finally {
      this.saving.set(false);
    }
  }

  async addGrade() {
    const student = this.newGrade.studentId;
    if (!student) return;
    const subject = this.newGrade.subject.trim();
    if (!subject) { this.toast.show('Escribe una asignatura'); return; }
    this.newGrade.subject = '';
    try {
      await this.gradesSvc.save({ studentId: student, subject, cut1: undefined, cut2: undefined, cut3: undefined }, undefined);
      this.newGrade.studentId = '';
      this.toast.show('Evaluación añadida');
      await this.refreshGrades();
    } catch (e: any) {
      this.toast.show('No se pudo añadir la evaluación', e?.message);
    }
  }
}
