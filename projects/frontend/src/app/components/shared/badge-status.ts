import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'w-badge-status',
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="styleMap[status] ?? 'bg-secondary'">{{ status }}</span>
  `,
  styles: [`
    :host { display: inline-block; }
    .badge { font-size: 10px; padding: 4px 8px; font-weight: 600; letter-spacing: .3px; }
    .bg-secondary { background: #64748B !important; }
    .bg-activo { background: #10B981 !important; }
    .bg-retirado { background: #9CA3AF !important; }
    .bg-riesgo { background: #F97316 !important; }
    .bg-reprobado { background: #EF4444 !important; }
    .bg-activoprevio { background: #06B6D4 !important; }
  `]
})
export class BadgeStatus {
  @Input({ required: true }) status = '';
  styleMap: Record<string, string> = {
    Activo: 'bg-activo',
    Retirado: 'bg-retirado',
    'En Riesgo': 'bg-riesgo',
    Reprobado: 'bg-reprobado',
    'Sin alerta': 'bg-activoprevio'
  };
}
