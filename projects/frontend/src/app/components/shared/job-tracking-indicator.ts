import { Component, Input, signal } from '@angular/core';

// Indicador de proceso activo — glassmorphism. Estados: pendiente (spinner), en curso (pulse), concluido (badge).
@Component({
  selector: 'w-job-tracking-indicator',
  template: `
    <div class="w-glass-card job-indicator">
      @if (!started()) {
        <span class="spinner-border job-spinner text-secondary" role="status" aria-label="Esperando"></span>
      }
      @if (started() && !done()) {
        <span class="pulse-badge" aria-label="En curso"></span>
      }
      @if (done()) {
        <span class="done-badge text-white" aria-label="Concluido"></span>
      }
      @if (avatar) { <img class="job-avatar" [src]="avatar" alt="Avatar del proceso" /> }
      <div class="job-text">
        <div class="job-name fw-semibold">{{ name || 'Pendiente de asignación' }}</div>
        <div class="job-title small text-secondary">{{ title }}</div>
      </div>
      <div class="job-actions">
        @if (!done() && started()) { <button class="btn btn-sm btn-outline-secondary" (click)="complete()">Finalizar</button> }
        @if (!started()) { <button class="btn btn-sm btn-outline-primary" (click)="start()">Iniciar tracking</button> }
      </div>
    </div>
  `,
  styles: [
    `:host { display: inline-block; }
     .job-indicator { display: flex; align-items: center; gap: 10px; padding: 10px 14px; flex-wrap: wrap; }
     .job-spinner { width: 1.1em; height: 1.1em; }
     .pulse-badge {
       display: inline-block;
       width: 10px; height: 10px;
       border-radius: 50%;
       background: var(--edu-alert);
       box-shadow: 0 0 8px var(--edu-alert);
       animation: jobPulse 1.5s infinite;
     }
     .done-badge { background: #16A34A !important; }
     .job-avatar { width: 30px; height: 30px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.5); }
     .job-text { flex: 1; }
     .job-actions { display: flex; gap: 6px; }
     @keyframes jobPulse {
       0% { opacity: 0.4; box-shadow: 0 0 4px var(--edu-alert); }
       50% { opacity: 1; box-shadow: 0 0 12px var(--edu-alert); }
       100% { opacity: 0.4; box-shadow: 0 0 4px var(--edu-alert); }
     }
     @media (max-width: 575px) { .job-indicator { justify-content: flex-start; } }`
  ]
})
export class JobTrackingIndicator {
  @Input() name = '';
  @Input() title = 'Proceso en seguimiento';
  @Input() avatar?: string;
  started = signal(false);
  done = signal(false);

  start() { this.started.set(true); this.done.set(false); }
  complete() { this.done.set(true); }
}
