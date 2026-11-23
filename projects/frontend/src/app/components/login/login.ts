import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-5 card shadow-lg">
          <div class="card-body p-4">
            <h2 class="text-center mb-4">EduCoro AI</h2>
            <form (ngSubmit)="doLogin()" novalidate>
              <div class="mb-3">
                <label class="form-label small text-secondary" for="email">Email o CI <span class="text-danger">*</span></label>
                <input id="email" class="form-control" [(ngModel)]="form.email" name="email" required placeholder="V-12345678" />
              </div>
              <div class="mb-3">
                <label class="form-label small text-secondary" for="password">Contraseña <span class="text-danger">*</span></label>
                <input id="password" type="password" class="form-control" [(ngModel)]="form.password" name="password" required />
              </div>
              <button type="submit" class="btn btn-lg w-100 bg-primary text-white" [disabled]="loading()">
                {{ loading() ? 'Iniciando...' : 'Ingresar' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private loading = signal(false);
  form = { email: '', password: '' };

  async doLogin() {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      const { user } = await this.auth.login(this.form.email, this.form.password);
      if (user?.role) {
        await this.router.navigate(['/dash', user.role.toLowerCase()]);
      } else {
        this.toast.show('Credenciales invalidas');
      }
    } catch {
      this.toast.show('Email o contraseña incorrectos');
    } finally {
      this.loading.set(false);
    }
  }
}
