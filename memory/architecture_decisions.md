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

## 26-11-23 — Repositorio y publicación en GitHub (Fase 7)

- **Repo:** creado en raíz `C:\Users\Eduardo Rojas\Documents\EducoroIA\EduCoro AI\EduCoro AI`, nombre de autor `Eduardo Rojas <tlshinobidevelop@gmail.com>` (en consola, por usuario de WINDOWS).
- **Primer commit:** `24fb7db` — "chore: inicialización del repositorio EduCoro AI" (todos los archivos: backend, frontend, mobile, context, memory, skills).
- **gh CLI:** instalado v2.105.0 via winget (`winget install --id GitHub.cli`); binario en `C:\Program Files\GitHub CLI\gh.exe`. **Pendiente:** autenticación del usuario (vinculado a su cuenta de GitHub; falta confirmación del email: `gh auth status`).
- **Próximos pasos para el usuario:**
  1. `C:\Program Files\GitHub CLI\gh.exe auth status` → debe mostrar cuenta con su email.
  2. Si no: ejecutar `C:\Program Files\GitHub CLI\gh.exe auth login --hostname github.com --web --scopes repo,workflow`, abrir la URL, ingresar el código que pedirá (si se pierde, borrar la app y volver a intentar).
  3. `gh repo create elhli --public --source=. --remote=origin --push` (desde raíz).
  4. Verificar: `gh repo view` → `https://github.com/tlshinobidevelop/elhli`.

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

## 26-11-23 — Saneamiento backend y panel de observabilidad (Fase A)

- **Dev watch:** `npm run dev` = `nodemon --ignore node_modules --ignore public --ignore logs --ignore uploads` (nueva devDep). Verificado: 0 restarts espurios. Node 26 `--watch` reestaba mounts de `node_modules` (ej. `express`, `mimeScore.js`).
- **Tests:** `npm test` = `node --test --test-timeout=30000 tests/*.test.js`. Test debug residual `tests/debug-attendance.test.js`: no existe en disco ni en `git ls-files` (124 archivos, status limpio). Resultado: 11/11 pass.
- **Login email-o-CI:** validación local de email (regex básico) + CI `V-XXXXXXXX/E-XXXXXXXX` (skill Validations_Security_Skill); el controller ya admite `findUserByLogin` (email → CI). Nota: `express-validator@7` no exporta `isEmail` desde 'express-validator'.
- **Telegram:** `fetch` global (quito `node:fetch` inválido); parámetros `chat_id`/`allowed_updates` (los correctos de la API de Telegram); cableado en `listen()` si `TELEGRAM_BOT_TOKEN`. `.env.example` añade `TELEGRAM_BOT_TOKEN`.
- **server.js listen:** async; `await this.database()`; `database()` idempotente (`this._dbPromise`). Log esperado: `MongoDB conectado` → `Servedor ejecutándose en el puerto 3500` → `MongoDB: conectada`. Verificado.
- **Endpoint observabilidad:** `GET /api/system/overview` (Coordinador): api (nodeVersion, env, uptimeSeconds), db (state, collections), realtime (socketsConnected), metrics (totalStudents, activeStudents, totalCourses, averageFinalGrade, attendancePct, alertsLast24h, alertsTotal), recentAlerts (10 últimas). `io.sockets.size` no existe en Socket.IO 4 — el recuento real es `io.sockets.sockets.size`.
- **Frontend observabilidad:** ruta `/system` (guard Coordinador), tarjetas API/DB/Socket.IO/KPIs, lista de alertas recientes, actualización en vivo por Socket.IO (`alert_created`, `attendance_registered`, `grades_updated`, `student_updated`). Enlace desde la página Coordinación.
- **Lazy-load:** rutas `dash/*` con `loadComponent` → initial JS 685→383 kB.
- **Limpieza:** `BadgeStatus` quitado de DashDocente/DashEstudiante (no se usa en sus templates).
- **Warnings pendientes (refactor futuro):** bundle initial 698 kB vs budget 500 kB — residuo mayormente CSS de Bootstrap (styles-ZHGZZ3LC.css 314 kB); posible optimización con Bootstrap subset o styles HTML custom.

## 26-11-23 — Verificación de Fase A (procesos)
- Smoke: `GET /api/health` → 200 `{"ok":true,...,"db":"connected"}`; `GET /` → 200; `GET /api/nope` → 404 JSON; `GET /api/system/overview` → 401 (autenticación).
- Procesos Node cerrados; `mongod` (PID 13216) mantenido.

## 26-11-25 — Glassmorphism en frontend + comps de estilo (paso 5 de Plan Glassmorphism)

- **Tokens** (`styles.scss`): paleta neutra + glass: `--edu-primary #1E3A8A`, `--edu-primary-solid #1D4ED8`, `--edu-indigo #1E40AF`, `--edu-accent #3B82F6`, `--edu-alert #D97706`, fondos `#F8FAFC/#0F172A`, bg glass `rgba(255,255,255,0.30/0.45)`, border `rgba(255,255,255,0.55)`, blur `16px` saturate 1.5; body con gradientes radiosos de fondo.
- **Utilidades glass:** `.w-glass` (blur + border + sombra suave), `.w-glass-2`, pseudo-elements con gradientes de bordes (mask xor), `.w-glass-card`, `.w-glass-table`.
- **Recubrimiento visual:** `app.ts` navbar (glass, gradiente 1E3A8A→1D4ED8, items con hover blur), `login.ts` (card `w-glass-card shadow-none`), `system-overview.ts` (5 tarjetas `w-glass-card`), `dash-docente.ts`, `dash-estudiante.ts`, `coordinacion.ts` (tablas glass, modal glass), badges de estado custom (`badge-ok/#16A34A`, `badge-risk/#D97706`, `badge-reprobado/#DC2626`).
- **Nuevo componente:** `w-job-tracking-indicator` — glass card con estados: spinner (esperando), badge pulse + árbol glass (en curso), badge done + pulse+animación jobPulse (concluido), botones Iniciar/Finalizar; estilo local.
- **Validación:** `ng build` OK; estáticos copiados; browser integrado: login card glass, `/system` 5 tarjetas `w-glass-card` (glassCards: 5), header con active nav.

## 26-11-24 — Pulido de reglas de negocio y observabilidad frontend (Fases 0–3)

- **BusinessRules.js** (`projects/backend/helpers/businessRules.js`): fuente única de verdad — `PASS_GRADE=10` (§2), `ATTENDANCE_PREVENTIVE=20`, `ATTENDANCE_REPROBA=25` (§3), `calculateFinalGrade` (30/35/35), `computeStudentAverage`, `validateCuts`, `checkFinalGradeFormula` (tolerancia 0.01), `evaluateStudentStatus` (En Riesgo recuperable, Reprobado sticky, Retirado terminal), `buildAcademicAlert`, `buildAttendanceAlerts`, `saveAlertIfNew` (dedupe por tipo+día).
- **Reglas polidas (backend):** `grade.controller.js` usa `checkRisk(studentId)`; persiste alertas en `Alert`; emite `student_updated`. `attendance.controller.js`: alertas preventivas/reprobación persistidas; duplicado QR → 409 `ALREADY_REGISTERED`; `scan` valida QR vacío. `grade.routes.js`: validación 0–20 de cortes + fórmula `finalGrade`. `reportcard.controller.js`: alertas con mensajes.
- **Socket:** `bin/server.js` añade `io.use(socket.handshake.auth?.token)`; `user.model.js` añade `'Admin'`; frontend `socket.ts` pasa token en el handshake.
- **Frontend:** interceptor con cola única de refresh 401 y toasts con `message`/`suggestion`; guard redirige a `/login` sin token; navbar por rol (Docente/Mi record/Visualizar sistema/Salir) con iconos Bootstrap; identidad visual (`#1E3A8A`, `#1D4ED8`, `#1E40AF`, `#3B82F6`, `#D97706`) en `styles.scss`; dashboards con estados loading/error/vacío; PDF del boletín autenticado vía ApiService blob; `coordinacion` con validación V/E.
- **Validación:** `npm test --prefix projects\backend` → 16/16 pass; frontend `ng build` OK; estáticos copiados a `projects/backend/public/`; servidor corriendo en :3500.

## 26-11-25 — Navegación por rol y JWT (Fases 1–3)

- **Navbar completo y reactivo:** `app.ts` muestra `Coordinación`, `Usuarios`, `Docente` y `Visualizar sistema` para Coordinador/Admin; `Docente` para Docente; `Mi récord` para Estudiante; brand vinculado a home y badge de usuario.
- **Auth Service reactivo:** `user`/`role` como signals; `login`, `me`, `refresh` y `logout` actualizan estado. `homeRouteFor()` centraliza `Docente→/dash/docente`, `Estudiante→/dash/estudiante`, `Coordinador/Admin→/dash/coordinacion`.
- **Guard:** redirige autenticados sin permiso a su vista principal con toast (no a `/login`).
- **Read-only Docente:** `/dash/docente` permite `Docente`, `Coordinador`, `Admin`; `data.writeRoles=['Docente']`; readOnly muestra banner, sin inputs ni Guardar.
- **JWT:** tokens con `jti`, `studentId`, `tokenVersion`; refresh hasheado con bcrypt en `User.refreshTokenHash`; logout invalida `tokenVersion`; 401 reintenta tras refresh (single flight, excluye `/users/refresh`).
- **Users UI:** pestaña `/dash/usuarios` (CRUD, contraseñas, eliminar).
- **Course scoping:** Docente solo ve/opera cursos/estudiantes de cursos; scope en grades/attendance/students.
- **Migraciones:** `scripts/migrate-final-null.js`, `scripts/backfill-qr.js`.
- **Validación:** `npm test` → 16/16; `npm run build --prefix projects\frontend` OK; `Start-Process node projects\backend\index.js` detached.
