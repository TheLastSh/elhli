import { Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  standalone: true,
  imports: [RouterOutlet],
  selector: 'app-root',
  template: `
    <div class="app-shell">
      <header class="bg-primary text-white p-3 shadow-sm d-flex align-items-center justify-content-between">
        <span class="fw-semibold">EduCoro AI</span>
        <button class="btn btn-outline-light btn-sm" (click)="salir()">Salir</button>
      </header>
      <main>
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell { display: flex; flex-direction: column; min-height: 100vh; }
    main { flex: 1; }
  `]
})
export class App {
  private router = inject(Router);
  private auth = inject(AuthService);
  async salir() {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
