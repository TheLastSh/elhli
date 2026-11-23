import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentsService, Student } from '../../services/students.service';
import { ToastService } from '../../shared/toast.service';
import { BadgeStatus } from '../shared/badge-status';

@Component({
  standalone: true,
  selector: 'app-coordinacion',
  imports: [CommonModule, FormsModule, BadgeStatus],
  template: `
    <div class="container p-4">
      <h1 class="mb-4">EduCoro AI - Coordinacion</h1>

      <h4>Estudiantes</h4>
      <div class="d-flex gap-2 align-items-center mb-3">
        <input class="form-control w-25" placeholder="CI" [(ngModel)]="nuevo.ci" name="ci" />
        <input class="form-control w-25" placeholder="Nombre completo" [(ngModel)]="nuevo.fullName" name="fullName" />
        <input class="form-control w-25" placeholder="Email" [(ngModel)]="nuevo.email" name="email" />
        <select class="form-select w-25" [(ngModel)]="nuevo.section" name="section">
          <option *ngFor="let s of sections" [value]="s">{{ s }}</option>
        </select>
        <button class="btn btn-outline-primary" (click)="crear()">Crear</button>
      </div>
      <table class="table table-bordered bg-white shadow-sm">
        <thead class="table-indigo text-center"><tr><th>CI</th><th>Nombre</th><th>Seccion</th><th>Email</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let s of estudiantes()">
            <td>{{ s.ci }}</td><td>{{ s.fullName }}</td><td>{{ s.section }}</td><td>{{ s.email }}</td>
            <td><w-badge-status [status]="s.status" /></td>
            <td><button class="btn btn-sm btn-outline-secondary" (click)="editar(s)">Ed</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class Coordinacion implements OnInit {
  private studentsSvc = inject(StudentsService);
  private toast = inject(ToastService);
  sections = ['IA-1', 'IA-2', 'SIST-1'];
  estudiantes = signal<Student[]>([]);
  nuevo: Partial<Student> = { section: 'IA-1' };

  ngOnInit() { void this.refresh(); }
  private async refresh() { this.estudiantes.set(await this.studentsSvc.list({}).then((r) => r.data)); }

  crear() {
    if (!this.nuevo.ci || !this.nuevo.fullName || !this.nuevo.email) { this.toast.show('Complete CI, nombre y email'); return; }
    this.studentsSvc.create(this.nuevo).then(() => { this.toast.show('Estudiante creado'); this.nuevo = { section: 'IA-1' }; void this.refresh(); }).catch(() => this.toast.show('Error al crear estudiante'));
  }
  editar(s: Student) { this.toast.show('Edicion de ' + s.fullName); }
}
