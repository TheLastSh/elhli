import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GradesService, Grade } from '../../services/grades.service';
import { StudentsService, Student } from '../../services/students.service';
import { AttendanceService, Attendance, AttendanceStats } from '../../services/attendance.service';
import { ToastService } from '../../shared/toast.service';
import { initializeSocket } from '../shared/socket';

@Component({
  standalone: true,
  selector: 'app-dash-docente',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid p-4">
      <h1 class="mb-4">EduCoro AI - Portal Docente</h1>

      <div class="row mb-3">
        <div class="col-md-4"><label class="form-label small text-secondary" for="section">Seccion</label>
          <select id="section" class="form-select" [(ngModel)]="section" (ngModelChange)="refreshGrades()" name="section">
            <option *ngFor="let s of sections" [value]="s">{{ s }}</option>
          </select>
        </div>
      </div>

      <h3 class="mb-3">Calificaciones - 30% - 35% - 35%</h3>
      <table class="table table-bordered table-hover table-sm bg-white shadow-sm">
        <thead class="table-indigo text-center">
          <tr>
            <th class="text-start">Estudiante</th><th class="text-center">Corte 1</th><th class="text-center">Corte 2</th><th class="text-center">Corte 3</th><th class="text-center">Final</th><th class="text-center">Accion</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let g of grades(); let i = index">
            <td>{{ g.student?.fullName || g.studentId }}</td>
            <td><input class="form-control form-control-sm text-center" type="number" step="0.01" min="0" max="20" [(ngModel)]="g.cut1" (ngModelChange)="computeFinal(g)" style="width:80px" /></td>
            <td><input class="form-control form-control-sm text-center" type="number" step="0.01" min="0" max="20" [(ngModel)]="g.cut2" (ngModelChange)="computeFinal(g)" style="width:80px" /></td>
            <td><input class="form-control form-control-sm text-center" type="number" step="0.01" min="0" max="20" [(ngModel)]="g.cut3" (ngModelChange)="computeFinal(g)" style="width:80px" /></td>
            <td class="text-center font-monospace">{{ g.finalGrade !== null ? g.finalGrade.toFixed(2) : '-' }}</td>
            <td class="text-center"><button class="btn btn-sm btn-primary" (click)="saveGrade(g)">Guardar</button></td>
          </tr>
          <tr>
            <td colspan="6" class="text-center">
              <select class="form-select form-select-sm d-inline" [(ngModel)]="newGrade.studentId" name="studentSel">
                <option value="">Estudiante...</option>
                <option *ngFor="let s of students()" [value]="s._id">{{ s.fullName }} ({{ s.ci }})</option>
              </select>
              <button class="btn btn-sm btn-outline-primary" (click)="addGrade()" [disabled]="!newGrade.studentId">Nueva evaluacion</button>
            </td>
          </tr>
        </tbody>
      </table>

      <h3 class="mt-4">Panel de Asistencia en Vivo</h3>
      <div class="d-flex gap-2 align-items-center">
        <input id="qr" class="form-control w-50" placeholder="Codigo QR del carnival" [(ngModel)]="qrCode" />
        <button class="btn btn-sm btn-outline-primary" (click)="scan()">Escanear</button>
      </div>
      <table class="table table-sm mt-3 bg-white shadow-sm">
        <thead class="text-center"><tr><th>Fecha</th><th>Estado</th><th>% Inasistencias</th></tr></thead>
        <tbody>
          <tr><td>Hoy</td><td class="text-center"><span class="badge bg-warning text-dark">Ausente</span></td><td class="text-center font-monospace">{{ porcentaje()?.toFixed(1) ?? '-' }}</td></tr>
          <tr *ngFor="let a of attendance()"><td>{{ a.date | date: 'shortDate' }}</td><td class="text-center">{{ a.status }}</td><td class="text-center"></td></tr>
        </tbody>
      </table>
    </div>
  `
})
export class DashDocente implements OnInit, OnDestroy {
  private gradesSvc = inject(GradesService);
  private studentsSvc = inject(StudentsService);
  private attendanceSvc = inject(AttendanceService);
  private socket = inject(initializeSocket);
  private toast = inject(ToastService);

  sections = ['IA-1', 'IA-2', 'SIST-1'];
  section = 'IA-1';

  grades = signal<any[]>([]);
  students = signal<Student[]>([]);
  attendance = signal<Attendance[]>([]);
  porcentaje = signal<number | null>(null);
  qrCode = '';
  newGrade = { studentId: '' as string };

  ngOnInit() {
    void this.refreshAll();
    this.socket.on('attendance_registered', () => { void this.refreshGrades(); });
    this.socket.on('grades_updated', () => { void this.refreshGrades(); });
    this.socket.on('alert_created', () => this.toast.show('Alerta academica'));
  }
  ngOnDestroy() { this.socket.disconnect(); }

  private async refreshAll() {
    const [g, s] = await Promise.all([this.gradesSvc.list(), this.studentsSvc.list({ section: this.section })]);
    this.students.set(s.data);
    this.grades.set((g || []).map((x) => ({ ...x, student: this.students().find((s) => s._id === x.studentId) })));
  }
  private async refreshGrades() {
    const g = await this.gradesSvc.list();
    this.grades.set((g || []).map((x) => ({ ...x, student: this.students().find((s) => s._id === x.studentId) })));
  }
  computeFinal(g: any) {
    g.finalGrade = (g.cut1 ?? 0) * 0.30 + (g.cut2 ?? 0) * 0.35 + (g.cut3 ?? 0) * 0.35;
  }
  async saveGrade(g: any) {
    await this.gradesSvc.save(g, g._id);
    this.toast.show('Nota guardada');
    await this.refreshGrades();
  }
  async addGrade() {
    const student = this.students().find((s) => s._id === this.newGrade.studentId);
    if (!student) return;
    await this.gradesSvc.save({ studentId: student._id, subject: 'Inteligencia Artificial', cut1: 0, cut2: 0, cut3: 0 }, undefined);
    this.newGrade.studentId = '';
    this.toast.show('Evaluacion agregada');
    await this.refreshGrades();
  }
  async scan() {
    const r = await this.attendanceSvc.scan(this.qrCode);
    if (r?.ok) {
      this.toast.show('Asistencia registrada', r.attendance?.status);
      await this.refreshGrades();
    } else {
      this.toast.show('No se pudo registrar asistencia');
    }
  }
}
