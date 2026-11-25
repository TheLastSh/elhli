import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StudentsService, Student } from '../../services/students.service';
import { ToastService } from '../../shared/toast.service';
import { BadgeStatus } from '../shared/badge-status';

@Component({
  standalone: true,
  selector: 'app-coordinacion',
  imports: [CommonModule, FormsModule, BadgeStatus, RouterLink],
  template: `
    <div class="container p-4">
      <h1 class="mb-4">EduCoro AI - Coordinacion</h1>

      <h4 class="d-flex align-items-center gap-3">Estudiantes <a class="btn btn-outline-secondary" routerLink="/system">📊 Visualizar sistema</a></h4>
      <div class="d-flex gap-2 align-items-center mb-3">
        <input class="form-control w-25" placeholder="CI" [(ngModel)]="nuevo.ci" name="ci" />
        <input class="form-control w-25" placeholder="Nombre completo" [(ngModel)]="nuevo.fullName" name="fullName" />
        <input class="form-control w-25" placeholder="Email" [(ngModel)]="nuevo.email" name="email" />
        <select class="form-select w-25" [(ngModel)]="nuevo.section" name="section">
          <option *ngFor="let s of sections" [value]="s">{{ s }}</option>
        </select>
        <button class="btn btn-outline-primary" (click)="crear()">Crear</button>
      </div>
      @if (loading()) { <div class="text-center py-3"><div class="spinner-border" role="status"></div></div> }
      @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
      @if (!loading() && estudiantes().length === 0) { <p class="text-muted">No hay estudiantes registrados.</p> }
      <table class="table table-bordered w-glass-table">
        <thead class="table-indigo text-center"><tr><th>CI</th><th>Nombre</th><th>Sección</th><th>Email</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let s of estudiantes()">
            <td>{{ s.ci }}</td><td>{{ s.fullName }}</td><td>{{ s.section }}</td><td>{{ s.email }}</td>
            <td><w-badge-status [status]="s.status" /></td>
            <td><button class="btn btn-sm btn-outline-secondary" (click)="editar(s)">Más</button></td>
          </tr>
        </tbody>
      </table>

      @if (selected) {
        <div class="modal show d-block bg-dark bg-opacity-50" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header"><h6 class="modal-title">Editar estudiante</h6></div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label small text-secondary" for="editCi">CI</label>
                  <input id="editCi" class="form-control" readonly [value]="selected.ci" />
                </div>
                <div class="mb-3">
                  <label class="form-label small text-secondary" for="editNombre">Nombre</label>
                  <input id="editNombre" class="form-control" readonly [value]="selected.fullName" />
                </div>
                <div class="mb-3">
                  <label class="form-label small text-secondary" for="editStatus">Estado (Business_Rules.md §4/§2)</label>
                  <select id="editStatus" class="form-select" [(ngModel)]="editStatus" name="editStatus">
                    <option *ngFor="let st of statuses" [value]="st">{{ st }}</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-sm btn-outline-secondary" (click)="selected = null">Cancelar</button>
                <button class="btn btn-sm btn-primary" (click)="saveEstado()">Guardar estado</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class Coordinacion implements OnInit {
  private studentsSvc = inject(StudentsService);
  private toast = inject(ToastService);
  sections = ['IA-1', 'IA-2', 'SIST-1'];
  statuses = ['Activo', 'Retirado', 'En Riesgo', 'Reprobado'];
  estudiantes = signal<Student[]>([]);
  nuevo: Partial<Student> = { section: 'IA-1' };
  loading = signal(true);
  error = signal<string | null>(null);
  selected: Student | null = null;
  editStatus = 'Activo';

  // V/E: igual que validación en students.routes.js (V-/E- + 7 a 9 dígitos, case-insensitive)
  private ciValido(ci: string) { return /^[VE]-\d{7,9}$/i.test(String(ci || '').trim()); }

  ngOnInit() { void this.refresh(); }

  private async refresh() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const r = await this.studentsSvc.list({});
      this.estudiantes.set(r.data || []);
    } catch {
      this.error.set('No se pudieron cargar los estudiantes.');
    } finally {
      this.loading.set(false);
    }
  }

  crear() {
    this.nuevo.ci = (this.nuevo.ci || '').trim();
    if (!this.nuevo.ci) { this.toast.show('El CI es obligatorio'); return; }
    if (!this.ciValido(this.nuevo.ci)) { this.toast.show('Formato de CI inválido (ej. V-12345678)'); return; }
    if (!this.nuevo.fullName || !this.nuevo.email) { this.toast.show('Complete nombre y email'); return; }
    this.studentsSvc.create(this.nuevo)
      .then((s) => { this.toast.show('Estudiante creado', s?.fullName || ''); this.nuevo = { section: 'IA-1' }; void this.refresh(); })
      .catch((e: any) => this.toast.show('Error al crear estudiante', e?.message));
  }

  editar(s: Student) {
    // R. Nueva funcionalidad del "Más": editor inline de estado (Business_Rules.md §4).
    this.selected = s;
    this.editStatus = s.status || 'Activo';
  }

  async saveEstado() {
    if (!this.selected || !['Activo', 'Retirado'].includes(this.editStatus)) return;
    try {
      const updated = await this.studentsSvc.setStatus(this.selected._id, this.editStatus);
      this.estudiantes.update((list) => list.map((e) => (e._id === this.selected?._id ? { ...e, status: updated.status } : e)));
      this.toast.show('Estado actualizado', updated.status);
      this.selected = null;
      void this.refresh();
    } catch (e: any) {
      this.toast.show('No se pudo actualizar el estado', e?.message);
    }
  }
}
