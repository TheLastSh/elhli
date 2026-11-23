import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { SystemOverview } from './components/system-overview/system-overview';
import { requireRole } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'system', component: SystemOverview, canActivate: [requireRole('Coordinador')] },
  // Lazy-load de los dashboards para mantener bundle inicial pequeño
  {
    path: 'dash/docente',
    loadComponent: () => import('./components/dash-docente/dash-docente').then((m) => m.DashDocente),
    canActivate: [requireRole('Docente')]
  },
  {
    path: 'dash/estudiante',
    loadComponent: () => import('./components/dash-estudiante/dash-estudiante').then((m) => m.DashEstudiante),
    canActivate: [requireRole('Estudiante')]
  },
  {
    path: 'dash/coordinacion',
    loadComponent: () => import('./components/coordinacion/coordinacion').then((m) => m.Coordinacion),
    canActivate: [requireRole('Coordinador')]
  },
  { path: '**', redirectTo: 'login' }
];
