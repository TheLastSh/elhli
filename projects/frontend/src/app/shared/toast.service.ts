import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private container?: HTMLElement;

  private ensure(): HTMLElement {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'w-alert-toast';
      this.container.style.cssText = [
        'position:fixed', 'top:16px', 'right:16px', 'z-index:9999',
        'display:flex', 'flex-direction:column', 'gap:8px', 'align-items:flex-end'
      ].join(';');
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  show(message: string, suggestion?: string) {
    const el = document.createElement('div');
    el.className = 'toast show';
    el.style.cssText = 'min-width:260px;max-width:320px;background:#0F172A;color:#F8FAFC;border-radius:12px;padding:12px 16px;border-left:5px solid #1D4ED8;box-shadow:0 8px 24px rgba(0,0,0,.2)';
    el.innerHTML = `<div style="font-size:14px;font-weight:600">${this.escapeHtml(message)}</div>${suggestion ? `<div style="font-size:12px;margin-top:4px;opacity:.8">${this.escapeHtml(suggestion)}</div>` : ''}`;
    this.ensure().appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  private escapeHtml(s: string) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
