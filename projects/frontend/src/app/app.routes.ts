import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { DashDocente } from './components/dash-docente/dash-docente';
import { DashEstudiante } from './components/dash-estudiante/dash-estudiante';
import { Coordinacion } from './components/coordinacion/coordinacion';
import { requireRole } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dash/docente', component: DashDocente, canActivate: [requireRole('Docente')] },
  { path: 'dash/estudiante', component: DashEstudiante, canActivate: [requireRole('Estudiante')] },
  { path: 'dash/coordinacion', component: Coordinacion, canActivate: [requireRole('Coordinador')] },
  { path: '**', redirectTo: 'login' }
];
