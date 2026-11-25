import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, UserRow } from '../../services/users.service';
import { StudentsService, Student } from '../../services/students.service';
import { ToastService } from '../../shared/toast.service';
import { BadgeStatus } from '../shared/badge-status';

@Component({
  standalone: true,
  selector: 'app-coordinacion-usuarios',
  imports: [CommonModule, FormsModule, BadgeStatus],
  template: `
    <div class="container p-4">
      <h1 class="mb-3">EduCoro AI — Usuarios</h1>
      <div class="d-flex gap-3 mb-4 align-items-center flex-wrap">
        <input class="form-control w-50" placeholder="Buscar por email o nombre" [(ngModel)]="q" (ngModelChange)="load()" />
        <button class="btn btn-outline-secondary" (click)="load()">Refrescar</button>
      </div>
      @if (loading()) { <div class="text-center py-3"><div class="spinner-border" role="status"></div></div> }
      @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }

      <h5 class="mb-2">Crear usuario</h5>
      <div class="card w-glass-card mb-4">
        <div class="card-body p-3">
          <div class="row g-2">
            <div class="col-md-2"><input class="form-control form-control-sm" placeholder="Email" [(ngModel)]="form.email" name="email" /></div>
            <div class="col-md-2"><input class="form-control form-control-sm" placeholder="Contraseña (6+)" type="password" [(ngModel)]="form.password" name="password" /></div>
            <div class="col-md-2"><input class="form-control form-control-sm" placeholder="Nombre completo" [(ngModel)]="form.fullName" name="fullName" /></div>
            <div class="col-md-2">
              <select class="form-select form-select-sm" [(ngModel)]="form.role" name="role">
                <option value="Docente">Docente</option><option value="Estudiante">Estudiante</option><option value="Coordinador">Coordinador</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-select form-select-sm" [(ngModel)]="form.studentId" name="studentId">
                <option value="">N/A o elegir estudiante</option>
                <option *ngFor="let s of students()" [value]="s._id">{{ s.fullName }} ({{ s.ci }})</option>
              </select>
            </div>
            <div class="col-auto"><button class="btn btn-sm btn-primary" (click)="crear()" [attr.disabled]="saving()">Crear</button></div>
          </div>
        </div>
      </div>

      <table class="table table-bordered w-glass-table">
        <thead class="table-indigo"><tr><th>Rol</th><th>Email</th><th>Nombre</th><th>Estudiante</th><th>Acciones</th></tr></thead>
        <tbody>
          @for (u of users(); track u._id) {
            <tr>
              <td><w-badge-status [status]="u.role" /></td>
              <td>{{ u.email }}</td>
              <td>{{ u.fullName }}</td>
              <td>{{ u.studentId || '-' }}</td>
              <td>
                <button class="btn btn-sm btn-outline-secondary" (click)="editar(u)">Editar</button>
                <button class="btn btn-sm btn-outline-danger" (click)="cambiarPwd(u)">Contraseña</button>
                <button class="btn btn-sm btn-outline-danger" [attr.disabled]="borrando()" (click)="eliminar(u)">Eliminar</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
      <div class="small text-secondary mt-2">Total: {{ total() }} usuarios.</div>

      @if (selected) {
        <div class="modal show d-block bg-dark bg-opacity-50" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header"><h6 class="modal-title">Editar usuario</h6></div>
              <div class="modal-body">
                <div class="row g-2">
                  <div class="col-md-6"><input class="form-control" placeholder="Email (solo lectura)" [value]="selected.email" /></div>
                  <div class="col-md-6">
                    <select class="form-select" [(ngModel)]="edit.role" name="role">
                      <option value="Docente">Docente</option><option value="Estudiante">Estudiante</option><option value="Coordinador">Coordinador</option>
                    </select>
                  </div>
                  <div class="col-md-6"><input class="form-control" placeholder="Full name" [(ngModel)]="edit.fullName" name="fullName" /></div>
                  <div class="col-md-6">
                    <select class="form-select" [(ngModel)]="edit.studentId" name="studentId">
                      <option value="">Ninguno</option>
                      <option *ngFor="let s of students()" [value]="s._id">{{ s.fullName }} ({{ s.ci }})</option>
                    </select>
                  </div>
                </div>
                <input class="form-control mt-2" type="password" placeholder="Contraseña nueva (opcional)" [(ngModel)]="editPwd" name="pwd" />
              </div>
              <div class="modal-footer">
                <button class="btn btn-sm btn-secondary" (click)="selected = null">Cancelar</button>
                <button class="btn btn-sm btn-primary" (click)="guardarEdicion()">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CoordinacionUsuarios implements OnInit {
  private usersSvc = inject(UsersService);
  private studentsSvc = inject(StudentsService);
  private toast = inject(ToastService);
  students = signal<Student[]>([]);
  users = signal<UserRow[]>([]);
  total = signal(0);
  loading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);
  borrando = signal(false);
  q = '';
  pagina = 1;
  form = { email: '', password: '', fullName: '', role: 'Docente', studentId: '' };
  edit: Partial<UserRow> = {};
  editPwd = '';
  selected: UserRow | null = null;

  ngOnInit() {
    void this.load();
    void this.studentsSvc.list({ limit: 200 }).then((r) => this.students.set(r.data));
  }

  load() {
    this.usersSvc.list({ page: this.pagina, limit: 25, q: this.q.trim() })
      .then((r) => { this.users.set(r.users); this.total.set(r.pagination.total); })
      .catch((e) => this.error.set('No se pudieron cargar usuarios: ' + (e?.message || '')))
      .finally(() => this.loading.set(false));
  }

  crear() {
    if (this.saving()) return;
    const u = this.form;
    if (!u.email || !u.password || !u.fullName) { this.toast.show('Completa email, contraseña y nombre'); return; }
    this.saving.set(true);
    this.usersSvc.create(u).then(() => { this.toast.show('Usuario creado'); this.form = { email: '', password: '', fullName: '', role: 'Docente', studentId: '' }; void this.load(); }).catch((e) => this.toast.show('Error al crear usuario', e?.message)).finally(() => this.saving.set(false));
  }

  editar(u: UserRow) { this.selected = u; this.edit = { fullName: u.fullName, role: u.role, studentId: u.studentId || '' }; this.editPwd = ''; }

  async guardarEdicion() {
    if (!this.selected) return;
    this.saving.set(true);
    try {
      await this.usersSvc.update(this.selected._id, { fullName: this.edit.fullName, role: this.edit.role, studentId: this.edit.studentId });
      if (this.editPwd) { await this.usersSvc.changePassword(this.selected._id, this.editPwd); this.toast.show('Contraseña actualizada'); }
      this.toast.show('Usuario actualizado');
      this.selected = null; void this.load();
    } catch (e: any) { this.toast.show('No se pudo actualizar', e?.message); }
    finally { this.saving.set(false); }
  }

  async cambiarPwd(u: UserRow) {
    const pwd = prompt(`Nueva contraseña para ${u.email} (mín. 6 caracteres):`);
    if (!pwd) return;
    if (pwd.length < 6) { this.toast.show('La contraseña debe tener al menos 6 caracteres'); return; }
    this.saving.set(true);
    try { await this.usersSvc.changePassword(u._id, pwd); this.toast.show('Contraseña actualizada'); }
    catch (e: any) { this.toast.show('Error al cambiar contraseña', e?.message); }
    finally { this.saving.set(false); }
  }

  async eliminar(u: UserRow) {
    if (this.borrando()) return;
    const ok = confirm(`¿Eliminar usuario ${u.email}?`);
    if (!ok) return;
    this.borrando.set(true);
    try { await this.usersSvc.delete(u._id); this.toast.show('Usuario eliminado'); void this.load(); }
    catch (e: any) { this.toast.show('No se pudo eliminar', e?.message); }
    finally { this.borrando.set(false); }
  }
}
