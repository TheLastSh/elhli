# error_solutions.md

Registro de errores y parches aplicados.

## 26-11-23 — Incidencias de la última verificación + soluciones

1. **Test colgante** — `node --test tests/debug-attendance.test.js` tardó 6708 s (timeout) y falló login 401. El archivo ya no existe en disco ni en `git ls-files`; corrección: estandarizar `npm test` con `--test-timeout=30000` para evitar colgar futuros tests. Resultado: 11/11 pass.
2. **`npm run dev` con reinicios espurios** — `node --watch` reestaba mounts de `node_modules/*` (ej. express, mimeScore). Solución: `nodemon --ignore node_modules --ignore public --ignore logs --ignore uploads` (devDependency añadida). Log: 0 restarts.
3. **Login por CI rechazado por validador** — `check('email').isEmail()` rechazaba CI. Solución: `.custom()` validando email (regex) o CI (`^[VE]-\d{8}$`, case-insensitivo); controller ya admite login por CI. Nota: `express-validator@7` no exporta `isEmail` desde 'express-validator'.
4. **Conector Telegram roto/no-cableado** — `import fetch from 'node:fetch'` inválido; parámetros Telegram mal nombrados (`chatId`, `allowedUpdates` → `chat_id`, `allowed_updates`); `startTelegramConnector()` no se llamaba desde `listen()`. Solución: fetch global, parámetros corregidos, arranque condicional si `TELEGRAM_BOT_TOKEN`. Verificación: import del conector OK.
5. **Log de arranque engañoso** — `MongoDB: desconectada` antes de conectar (`database()` sin await). Solución: `listen()` async + `await this.database()`; `database()` idempotente. Log final verificado: `MongoDB conectado` → `Servedor ejecutándose en el puerto 3500` → `MongoDB: conectada`.
6. **Bundle JS > 500 kB (pre-existante)** — initial 698 kB (main 383 kB + styles 314 kB). Parcialmente mitigado: lazy-load de dashboards (main 685→383 kB). Residuo CSS-dominante (Bootstrap); opción futura: Bootstrap subset/CSS custom.

## 26-11-24 — Login "no hacía nada": URL se queda en /login sin mensaje

- **Bug:** `login.ts` navegaba a `['/dash', user.role.toLowerCase()]` → `'Coordinador'.toLowerCase()` = **`coordinador`**, pero la ruta definida es `dash/coordinacion` (`app.routes.ts:21`). Sin coincidencia, Angular cae en `{ path: '**', redirectTo: 'login' }`: la página queda en `/login` sin mensaje ni error. Verificado en browser integrado: login POST 200, sin navegación.
- **Fix:** mapeo explícito: `user.role === 'Coordinador' ? '/dash/coordinacion' : \`/dash/${user.role.toLowerCase()}\``.
- **Verificación (browser integrado):** fill + click → POST 200, URL final `http://localhost:3500/dash/coordinacion`, página Coordinación renderizada.

## 26-11-24 — Panel /system con alerta "No se pudo obtener la visualización del sistema"

- **Bug:** `system-overview.ts:156` llamaba `this.apiSvc.get('/system/overview')`; `ApiService.api()` = `environment.apiBase + path` → `http://localhost:3500/system/overview` (**sin el prefijo `/api`**). Resultado: 200 del SPA fallback (`bin/server.js`: `GET /*path` → index.html), respuesta HTML que Angular no puede parsear como JSON → el observable rechaza → `SystemOverview.refresh()` catch muestra el alert.
- **Evidencia en browser integrado:** `fetch('/system/overview')` → 200 text/html; `fetch('/api/system/overview')` con token → 200.
- **Fix:** path corregido a `/api/system/overview` (backend: `app.use('/api/system', ...)` en `bin/server.js:76` + `router.get('/overview')` en `system.routes.js:8`).
- **Verificación (browser integrado):** recarga `/system` → `alertCount: 0`, `cardCount: 5`, `api: true`, `db: true`, `Node.js v26.12` presente; `fetch /api/system/overview` → 200 + `ok: true`.

## 26-11-24 — Login "colgaba" sin mensajes + flood de 429

- **Bug raíz:** `projects/frontend/src/app/core/interceptors/error.interceptor.ts` usaba `retryWhen((errors) => timer(300, 500).pipe(scan(...)))`. `timer(300, 500)` nunca termina → ante cualquier error (401/429/500) reenviaba la petición cada 500 ms indefinidamente. Symptoms: `AuthService.login()` (`.toPromise()`) nunca se resolvía → botón de login quedaba en "Iniciando..." sin toasts; y el bucle generó 151× "[ERROR] Demasiados intentos..." por rate limit.
- **Fix aplicado:**
  1. Interceptor: quitar `retryWhen`/`timer`/`scan`; `catchError` ahora propaga el error inmediatamente (toast + refresh 401 sin reintentos infinitos).
  2. Rate limit configurable: `middlewares/rateLimit.middleware.js` lee `LOGIN_RATE_MAX` / `LOGIN_RATE_WINDOW_MS` (defaults: 5, 900000); añadidos commentedos en `.env.example`.
  3. Verificación: `POST /api/users/login` → HTTP 200 (`ok: true`, user Coordinador, accessToken/refreshToken). Sin nuevos 429 en log tras reinicios; server corriendo (PID varían con nodemon) en :3500, `GET /` → 200, `/api/health` → 200.
  4. Frontend recompletado: `npm run build` → `main-IRF6WHDT.js` copiado a `projects/backend/public/`; smoke back end incluido.

## 26-11-24 — Alertas de riesgo y reprobación NO se mostraban en /system (bug pulido)

- **Bug:** `grade.controller.js#checkRisk` y `attendance.controller.js#checkAttendanceAlerts` solo *emitían* `alert_created` por Socket.IO; nunca guardaban en `Alert`. Resultado: `GET /api/system/overview` devolvía `recentAlerts: []` → el panel nuevo "#system" mostraba siempre "Sin alertas registradas", aunque las reglas creían generar alertas.
- **Fix:** `helpers/businessRules.js` (`saveAlertIfNew`, `buildAcademicAlert`, `buildAttendanceAlerts`) usado por `grade.controller.js` y `attendance.controller.js` para persistir alertas (dedupe por día); `Alert.find` usa `createdAt` real.
- **Verificación (browser integrado):** POST /api/students + POST /api/grades (2/2/2) → `studentStatus: "En Riesgo"`; recarga `/system` → "1 conectados" + item de `recentAlerts` visible con mensaje "Promedio académico 2.00/20. Nota mínima aprobatoria: 10 (criterio UNEFA).".
- **Extra:** `Student.updateOne` en `checkRisk` ahorra estado actualizado (`freshStudent`); nuevos tests de integración en `tests/business-rules-integration.test.js` (16/16 pass).

## 26-11-24 — Duplicado de QR mudo (409 sin mensaje legible)

- **Bug:** `scan()` respondía 500 con el raw error de Mongoose (`E11000`) cuando ya había registrado una asistencia el mismo día.
- **Fix:** `scan` pre-consulta (`Attendance.findOne({studentId, date >= hoy 00:00})`) → AppError `409 ALREADY_REGISTERED` ("Asistencia ya registrada hoy para este estudante... revisa el panel de asistencia"), válida 30 min agregada en `Validations_Security.md`/`api_contracts.md`. Test en integración.

## 26-11-24 — Estados vacíos en dashboards

- **Problema:** `dash-docente`, `dash-estudiante` y `coordinacion` renderizaban tablas vacías sin mensajes (ni ni error ni carga), como sí se pedía en Fase 3.
- **Fix:** estados `@if (loading())`, `@if (error())`, `@if (empty)` en los 3 dashboards + `spinner-border` (fase 3 frontend).

## 26-11-24 — Frontend: estilo inaccesible (navbar sin colores)

- **Bug visual:** selectores `.bg-primary-custom`, `.table-indigo`, `.bg-indigo`, `.bi` faltaban en `styles.scss` → headers de haderos con texto blanco sobre fondo blanco y sin iconos en nav.
- **Fix:** tokens en `styles.scss` (paleta de `system_context.md` §5): `--edu-primary #1E3A8A`, `--edu-primary-solid #1D4ED8`, `--edu-indigo #1E40AF`, `--edu-accent #3B82F6`, `--edu-alert #D97706`, `--edu-bg #F8FAFC`, `--edu-dark #0F172A`; clases definidas arriba; estilo `.header/.nav-item.active` usado por `app.ts`.

## 26-11-25 — Navegación por rol: entornos sin "Docente" y "Mi record"

- **Bug:** el navbar muestra "Docente" solo si `role === 'Docente'`; también aparece "Visualizar sistema" para cualquier rol, pero el guard rechaza a Docente/Estudiante; al loguear un Estudiante no ves su dashboard; el Coordinador no ve enlace a Coordinación (solo la página por login) y sólo tiene "Visualizar sistema".
- **Fix:** navbar reactivo con Items por rol; marca "Coordinación" y "Docente (lectura)" para Coordinador/Admin; "Volver a Coordinación" en /system.

## 26-11-25 — JWT roto: refresh eterno y 401 persistente

- **Bugs encontrados:**
  1. `User.refreshTokenHash` tenía `select: false` y `refresh()` no usaba `.select('+refreshTokenHash')`: el hash llega `undefined`, `bcrypt.compare` siempre falla → 401.
  2. `errorInterceptor` no reintenta la petición tras refrescar, solo lanza el error.
  3. `permit()` no trata `Admin` como `Coordinador` (front-end sí).
  4. Tokens no tienen `jti` ni `tokenVersion`, logout solo borra refresh.
- **Fix:** tokens con `jti` + `tokenVersion`; middleware `authenticate` carga User y chequea `tokenVersion`; refresh hashing fix; logout incrementa `tokenVersion`; interceptor con single-flight y reintento tras refresh (`next(req.clone(...))` con Bearer nuevo).

## 26-11-25 — Credenciales 429: módulo de autenticación refactorizado (Fase 3 - JWT)

- **Fix en frontend:** `AuthService` con signals (`user`, `role`, `hasUser`), `homeRouteFor()`, login que navega a `/dash/coordinacion` (Admin).
- **Fix en backend:** middleware de autenticación seguro; endpoints `/api/users` (`GET /`, `GET /:id`, `PUT /:id`, `PUT /:id/password`, `DELETE /:id`) solo para Coordinador/Admin; JWT v2 con `studentId`, `tokenVersion`, `jti`.
- **Verificación (node):** `POST /api/users/login` → 200 `{ok,user,accessToken,refreshToken}`; `GET /api/users` → 200 list.
- **Pendiente de verificar por flujo interactivo:** login 200 + navegación correcta en navegador (los intentos en browser dieron 429, posible desbalanceo de rate limit tras recargas).

## 26-11-25 — Notas pueden marcar "En Riesgo" sin estar evaluadas (Fase 2 - Bloque A)

- **Bug:** al crear una nueva evaluación sin cortes, `Grade.finalGrade` default 0 (modelo) y `computeAverageFinalGrade` sumaba 0, marcando a los estudiantes como En Riesgo.
- **Fix:** `finalGrade` ahora es `null` por defecto; `recalc` pone `null` si faltan cortes; `computeAverageFinalGrade` filtra no-numéricos; backups: scripts `scripts/migrate-final-null.js`.

## 26-11-25 — Actualización de estado: sticky Reprobado y duplicado de asistencias

- **Fix:** `evaluateStudentStatus` devuelve `Reprobado` antes de chequear `final<10` si el status actual ya es Reprobado (sticky).
- **Fix:** `attendance.controller.create` y `scan` bloquean con 409 `ALREADY_REGISTERED` cuando el estudiante ya tiene registro hoy; útil por "Scope-driven" (Docente solo accede a su cargo).
- **Fix frontend:** DashDocente tiene modo lectura para Coordinador/Admin (reduce el riesgo de que una vista de supervisión admita edición pasiva).

## 26-11-25 — Notas pueden marcar "En Riesgo" sin estar evaluadas (Fase 2 - Bloque A) [dup]