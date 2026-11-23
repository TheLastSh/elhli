# architecture_decisions.md

Historial de decisiones de diseño.

## 2026-11-19 — Inicialización del backend EduCoro AI

- **Decisión:** Arrancar `/projects/backend` con **Node.js ESM** (`"type": "module"`) y **Express 5**, siguiendo `AGENTS.md` y `skills/Backend_Architecture_CRUD.md`.
- **Patrón de servidor:** Clase `WebServer` en `bin/server.js` que integra:
  - `express` 5 + `http.createServer`
  - `Socket.IO` (evento base previsto: `attendance_registered`) expuesto vía `app.set('io', this.io)`
  - `helmet`, `cors` (origin/credentials abiertos en dev), `express.json`/`urlencoded` (10mb), `express-fileupload` (temp files)
  - Middleware estático en `/public` con fallback SPA a `index.html`
- **Punto de entrada:** `index.js` carga `dotenv/config` e invoca `new WebServer().listen()` en `process.env.PORT || 3500`.
- **Dependencias base:** `express@5`, `mongoose`, `dotenv`, `cors`, `helmet`, `jsonwebtoken`, `bcryptjs`, `express-fileupload`, `socket.io`.
- **Scripts:** `npm run dev` (`node --watch index.js`) y `npm start`.
- **Scaffolding:** carpetas `api/`, `databases/`, `middlewares/`, `helpers/`, `public/` + `.env.example` (sin secretos); `databases/connection.js` preparado para `MONGO_URI`.
- **Verificación:** `npm install` OK (0 vulnerabilidades); smoke test: servidor responde en `http://localhost:3500`.
- **Nota:** el motor local es Node 24.x; `engines` declara `>=26` según stack objetivo (solo warning EBADENGINE en install).

## 26-11-23 — Backend funcional (Fase 2)

- **Módulos:** `students/`, `courses/`, `grades/`, `attendance/`, `users/` (auth), `reports/` (PDF), `health/` — cada uno con model + controller + routes en `api/`.
- **Conectores y middlewares:** `auth`, `role`, `validate` (express-validator), `rateLimit`, `asyncHandler`, `AppError`.
- **Reglas:** Son implementadas en model y controlador: ponderación 30/35/35, reprobación por inasistencia (>25% → status Reprobado), alerta preventiva (>20%), validación de CI V/E único.
- **Sockets:** eventos emitidos desde controladores: `attendance_registered`, `grades_updated`, `alert_created`, `student_updated`.
- **Tests:** `npm test` — `node:test` + Supertest: 9 tests (validación de students, CRUD, reglas de calificación, asistencia, reports, 404s, auth login/refresh/logout/me) + 2 tests de reglas de negocio.
- **Validación manual:** POST /api/students, GET /api/students/:id, PUT, POST /api/grades, GET /api/attendance, GET /api/reports/students/:id/estadisticas, GET /api/reports/students/:id/boletin.pdf, GET /api/health.

## 26-11-23 — Frontend Angular 22 (Fase 3)

- **Stack:** Angular 22.3.0 standalone + Signals + Router (Bootstrap 5.3+, Bootstrap Icons, socket.io-client); proyecto en `projects/frontend/`; build en `dist/frontend/browser/`, copiados a `backend/public/` (árbol estático: index.html, main.js, styles.css, media/).
- **Core:** `environment`, `ApiService` (fetch wrapper con `ok`/`code`/`message`/`suggestion`), `AuthService` (localStorage token+refresh), guards por rol (`requireRole`), interceptores `jwt` + `error` (401 → refresh; errores → Toast con sugerencia).
- **Páginas:** Login, DashDocente (tabla de notas editable 30/35/35, panel de asistencia en vivo por QR scan, refresco por Socket.IO), DashEstudiante (promedio, asistencia, boletín PDF), Coordinacion (CRUD de estudiantes).
- **Validación:** CI V/E único; reglas de negocio reflejadas en UI (estado badge, alertas de riesgo/attendance).
- **Validación:** build ✅ (685 kB, puede tener advertencia de bundle >500kB). Estáticos verificados: `GET /` → 200, `GET /main-*.js` → 200.

## 26-11-23 — Saneamiento de infraestructura (Fase 0)

- **MongoDB:** En Docker: contenedor `mongo:8`, `-p 27017:27017`, volumen `educoro_ai_mongo_data` (docker-compose.yml en `projects/backend/`). Mongoose 9 compatible con el imagen.
- **Entorno local actual:** Docker CLI y gh CLI **no instalados** → falta instalar Docker Desktop con WSL 2 y gh CLI (Fase 0.11 y Fase 7).
- **Node:** v26.12.1 ya instalado localmente ✅ (engines `>=26`).
- **Healthcheck:** `GET /api/health` → `{ok, service, version, db, uptimeSeconds}` (Fase 0.6).
- **SPA Fallback:** después de API/estáticos, excluye `/api`, `/socket.io`, `/uploads`; `notFound` + `errorHandler` registrados al final (Fase 0.4/0.5).
- **CORS:** configurable con `CORS_ORIGIN` (any en dev); `origin: true` solo en desarrollo (Fase 0.7).
- **fileUpload:** `os.tmpdir()` en lugar de `/tmp/` (Fase 0.8).
- **Estructura:** carpetas `logs/`, `assets/`, `scripts/`, `seeders/`, `microservices/` creadas; `ecosystem.cofig,js` → `ecosystem.config.cjs` (PM2) (Fase 0.1/0.2).
- **.gitignore:** nuevo; `.env.example` ampliado con `CORS_ORIGIN`, `UPLOAD_DIR`.
- **Verificación del servidor:** `/api/health` responde; `/api/nope` → 404 JSON legible; `/` sirve `public/index.html`; `npm run dev` arranca sin errores.
- **Archivado:** `backup.doc` y `estructura-carpetas.txt` archivados en `docs/archivados/` (Fase 0.13).
- **MongoDB disponible localmente:** puerto 27017 en LISTEN, `mongod` corriendo (PID 13216). Disponible aunque Docker (Fase 0.10) sea el estándar seguro.
