# Frontend_Angular22_Skills.md — Guía de Desarrollo del Frontend Angular 22

## 1. Proyecto Base

- Angular 22+ (standalone, sin NgModule global por defecto).
-Bootstrap 5.3+, Bootstrap Icons (o Lucide).
- HttpClient + interceptores: autenticación JWT y manejo global de errores.
- Guards por rol: Docente, Estudiante, Coordinador, Admin.
- Signals (signal(), computed(), effect()) para el estado reactivo de notas, promedios y alertas.

## 2. Estructura recomendada

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/           # interceptores, guards, singleton de Auth
│   │   ├── shared/         # componentes reutilizables (toast, alerta, badge)
│   │   ├── services/       # api.service, auth.service, notas.service, etc.
│   │   ├── components/
│   │   │   ├── login/
│   │   │   ├── dashboard-docente/     # tablas de notas + panel de asistencia en vivo
│   │   │   ├── dashboard-estudiante/  # notas, promedio, asistencia, constancia PDF
│   │   │   └── coordinacion/          # supervisión global y alertas
│   │   ├── pages/
│   │   └── ...
├── src/environments/
```

## 3. Patrones Clave

- **Componentes Standalone**: `standalone: true`, exportEstilo: ImportsNgModule o direct profile.
- **Inyección de Dependencias**: usar `inject()` en lugar de `constructor`.
- **Control Flow**: template asincrónico:
  - `@if` para renderizado condicional (loading, error, vacío).
  - `@for` con `@empty` para listas y tablas.
- **HttpClient**: interceptor inyecta header `Authorization: Bearer <token>` si existe; mensaje global de error: Toast con `WAlertService`.
- **Store Reactivo**: signals para `notas$`, `promedio()`, `alertas$`.

## 4. Build

- Compilar con `ng build --configuration production`
- Los archivos generados se copian en `projects/backend/public/` (frontend servido por Node ESM).

## 5. Validación

- Prueba de campo: campos vacíos, campo numérico, mensajes de error, login por rol (401/403).
- Integración: consulta correcta a `/api/students`, `/api/grades`, `/api/attendance`, `/api/reports/`.
