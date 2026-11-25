import { Component, inject, computed, signal } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { AuthService } from './auth/auth.service';

interface NavItem {
  label: string; icon: string; href: string;
}

@Component({
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  selector: 'app-root',
  template: `
    <div class="app-shell">
      <header class="header">
        <div class="nav">
          <a class="brand" routerLink="/login">EduCoro AI</a>
          @if (auth.user(); as u) {
            <span class="user-badge">{{ u.fullName }} · {{ u.role }}</span>
            @for (item of nav(); track item.href) {
              <a class="nav-item" [class.active]="r(item.href)" [routerLink]="item.href">
                <i class="bi {{ item.icon }}"></i> {{ item.label }}
              </a>
            }
            <a class="nav-item" (click)="salir()"><i class="bi bi-box-arrow-right"></i> Salir</a>
          }
          @else if (auth.hasUser() === false) {
            <a class="nav-item" routerLink="/login"><i class="bi bi-person-fill"></i> Iniciar sesión</a>
          }
        </div>
      </header>
      <main class="flex-grow-1">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell { display: flex; flex-direction: column; min-height: 100vh; }
    main { flex: 1; }
    .header {
      backdrop-filter: blur(14px) saturate(1.4);
      -webkit-backdrop-filter: blur(14px) saturate(1.4);
      border-bottom: 1px solid rgba(255,255,255,0.4);
    }
    .nav { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 0 16px; height: 56px; }
    .nav .brand { font-weight: 700; color: var(--edu-primary-solid); text-decoration: none; margin-right: 8px; }
    .user-badge { background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.35); border-radius: 999px; padding: 2px 10px; font-size: 12px; margin-right: 8px; }
    @media (max-width: 575px) { .nav { height: 44px; padding: 0 8px; } .nav .brand { display: none; } }
  `]
})
export class App {
  private router = inject(Router);
  private auth = inject(AuthService);

  nav = computed<NavItem[]>(() => {
    const role = this.auth.role();
    const items: NavItem[] = [];
    if (role === 'Docente') {
      items.push({ label: 'Portal Docente', icon: 'bi-clipboard-pulse-fill', href: '/dash/docente' });
    }
    if (role === 'Estudiante') {
      items.push({ label: 'Mi récord', icon: 'bi-mortarboard-fill', href: '/dash/estudiante' });
    }
    if (role === 'Coordinador' || role === 'Admin') {
      items.push({ label: 'Coordinación', icon: 'bi-people-fill', href: '/dash/coordinacion' });
      items.push({ label: 'Usuarios', icon: 'bi-person-badge', href: '/dash/usuarios' });
      items.push({ label: 'Docente', icon: 'bi-clipboard-pulse-fill', href: '/dash/docente' });
      items.push({ label: 'Visualizar sistema', icon: 'bi-eye-fill', href: '/system' });
    }
    return items;
  });

  r(url: string) { return this.router.isActive(url, false); }

  async salir() {
    await this.auth.logout();
  }
}


