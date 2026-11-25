import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../auth/auth.service';
import { initializeSocket } from '../shared/socket';

export interface SystemAlert {
  _id: string;
  type: string;
  severity: string;
  message: string;
  studentId: string | null;
  createdAt: string;
}

export interface SystemOverview {
  ok: boolean;
  timestamp: string;
  api: { nodeVersion: string; env: string; uptimeSeconds: number };
  db: { state: string; collections: number };
  realtime: { socketsConnected: number };
  metrics: {
    totalStudents: number;
    activeStudents: number;
    totalCourses: number;
    averageFinalGrade: number | null;
    attendancePct: number;
    alertsLast24h: number;
    alertsTotal: number;
  };
  recentAlerts: SystemAlert[];
}

@Component({
  standalone: true,
  selector: 'app-system-overview',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="d-flex gap-2 align-items-center">
          <a class="btn btn-outline-secondary" *ngIf="auth.isCoordinador()" [routerLink]="['/dash/coordinacion']">
            <i class="bi bi-arrow-left-circle"></i> Volver a Coordinación
          </a>
          <h1>Visualizar sistema — EduCoro AI</h1>
        </div>
        <button class="btn btn-outline-primary" (click)="refresh()">Recargar</button>
      </div>

      @if (error()) {
        <div class="alert alert-danger">{{ error() }}</div>
      }

      @let s = data();
      @if (!s) {
        @if (loading()) {
          <div class="text-center py-5"><div class="spinner-border" role="status" aria-label="Cargando"></div></div>
        }
      } @else {
        <div class="row g-3 mb-4">
          <!-- Tarjeta API -->
          <div class="col-md-6 col-lg-3">
            <div class="card w-glass-card h-100">
              <div class="card-header bg-primary-custom text-white py-2">🖥️ API</div>
              <div class="card-body">
                <div class="d-flex justify-content-between mb-1"><span>Node.js</span><span><span class="badge bg-dark text-white">{{ s.api.nodeVersion }}</span></span></div>
                <div class="d-flex justify-content-between mb-1"><span>Entorno</span><span>{{ s.api.env }}</span></div>
                <div class="d-flex justify-content-between mb-1"><span>Uptime</span><span>{{ s.api.uptimeSeconds }} s</span></div>
                <div class="d-flex justify-content-between"><span class="text-muted">Estado</span><span><span class="badge bg-success text-white">conectada</span></span></div>
              </div>
            </div>
          </div>

          <!-- Tarjeta MongoDB -->
          <div class="col-md-6 col-lg-3">
            <div class="card w-glass-card h-100">
              <div class="card-header bg-primary-custom text-white py-2">🗃️ MongoDB</div>
              <div class="card-body">
                <div class="d-flex justify-content-between mb-1">
                  <span>Estado</span>
                  <span><span class="badge" [ngClass]="s.db.state === 'conectada' ? 'bg-success text-white' : 'bg-secondary text-white'">{{ s.db.state }}</span></span>
                </div>
                <div class="d-flex justify-content-between"><span class="text-muted">Colecciones</span><span>{{ s.db.collections }}</span></div>
              </div>
            </div>
          </div>

          <!-- Tarjeta Socket.IO -->
          <div class="col-md-6 col-lg-3">
            <div class="card w-glass-card h-100">
              <div class="card-header bg-primary-custom text-white py-2">🔌 Socket.IO</div>
              <div class="card-body">
                <p class="mb-0"><strong>{{ s.realtime.socketsConnected }}</strong> conectados</p>
                <small class="text-muted">Asistencia y notas en tiempo real</small>
              </div>
            </div>
          </div>

          <!-- KPIs -->
          <div class="col-md-6 col-lg-3">
            <div class="card w-glass-card h-100">
              <div class="card-header bg-primary-custom text-white py-2">📊 KPIs</div>
              <div class="card-body">
                <div class="d-flex justify-content-between mb-1">
                  <span><span class="badge bg-indigo text-white">Estudiantes</span></span>
                  <span><strong>{{ s.metrics.totalStudents }}</strong> (activos: {{ s.metrics.activeStudents }})</span>
                </div>
                <div class="d-flex justify-content-between mb-1">
                  <span><span class="badge bg-indigo text-white">Promedio final</span></span>
                  <span><strong>{{ s.metrics.averageFinalGrade === null ? '—' : s.metrics.averageFinalGrade.toFixed(2) }}</strong> / 20</span>
                </div>
                <div class="d-flex justify-content-between mb-1">
                  <span><span class="badge bg-indigo text-white">Asistencia</span></span>
                  <span><strong>{{ s.metrics.attendancePct.toFixed(1) }}%</strong> <span class="text-muted">(alertas 24h: {{ s.metrics.alertsLast24h }}, totales: {{ s.metrics.alertsTotal }})</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Alertas recientes -->
        <h5 class="mb-3">Alertas recientes</h5>
        <div class="card w-glass-card">
          <ul class="list-group list-group-flush">
            @for (a of s.recentAlerts; track a._id) {
              <li class="list-group-item">
                <span class="badge" [ngClass]="alertBadge(a.severity)">{{ a.type }}</span>
                <span class="ms-2 text-muted small">{{ fmtAlertDate(a) }}</span>
                <div class="small text-muted">{{ a.message }}</div>
              </li>
            }
            @if (s.recentAlerts.length === 0) {
              <li class="list-group-item text-muted text-center">Sin alertas registradas</li>
            }
          </ul>
        </div>
      }
    </div>
  `
})
export class SystemOverview implements OnInit, OnDestroy {
  private apiSvc = inject(ApiService);
  private auth = inject(AuthService);
  data = signal<SystemOverview | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  private socket = initializeSocket();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  private socketEvents = ['alert_created', 'attendance_registered', 'grades_updated', 'student_updated'];

  ngOnInit() {
    void this.refresh();
    // Panel actualiza en tiempo real ante eventos; debounce de 1.5s evita ráfagas de 4 peticiones
    for (const ev of this.socketEvents) {
      this.socket.on(ev, () => {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => void this.refresh(), 1500);
      });
    }
  }

  ngOnDestroy() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  async refresh() {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.data.set(await firstValueFrom(this.apiSvc.get<SystemOverview>('/api/system/overview')));
    } catch {
      this.error.set('No se pudo obtener la visualización del sistema. Revisa que el servidor esté corriendo.');
    } finally {
      this.loading.set(false);
    }
  }

  private fmtAlertDate(a: SystemAlert): string {
    return a.createdAt ? new Date(a.createdAt).toLocaleString() : '';
  }

  private alertBadge(severity: string): string {
    const map: Record<string, string> = {
      alerta: 'bg-warning text-dark',
      aviso: 'bg-info text-dark',
      resolucion: 'bg-success text-white'
    };
    return map[severity] ?? 'bg-secondary text-white';
  }
}
