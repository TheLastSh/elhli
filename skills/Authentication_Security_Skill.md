# Authentication_Security_Skill.md — Autenticación JWT y Seguridad Web

## 1. Arquitectura JWT (2 tokens)

### Access Token
- Duración: `JWT_EXPIRES_IN` (defecto: 1d)
- Envío: header `Authorization: Bearer <accessToken>`
- Creación: vía endpoint `/api/auth/login` y `/api/auth/refresh`

### Refresh Token
- Duración: `JWT_REFRESH_EXPIRES_IN` (defecto: 7d)
- Envío: header `RefreshToken: <refreshToken>` (header personalizado o httpOnly cookie)
- Flujos: al iniciar sesión (login), al refrescar acceso (beforeEach interceptor), y vinculado a usuario.

### Logout
- Invalidar access y refresh tokens válidos del usuario.

## 2. bcryptjs

- Validación de contraseñas: `bcrypt.compare(password, storedHash)`
- Hash: `bcrypt.hash(password, 10)` (costo definido en `helpers/bcrypt.js`)
- Nunca almacenar la contraseña como texto.

## 3. Login Adaptativo

- Intentar login principal → si 4xx, intentar credenciales alternas.
- Ejemplos adaptativos:
  - Si falla con email, probar con CI.
  - Si el estudiante está en Riesgo, mostrar alerta visual.
- Respuesta de login: `{ ok: true, user: { id, role, fullName, ci?, email }, accessToken, refreshToken }`.

## 4. Middleware de Autorización

### Auth Middleware
- Verifica token con `jsonwebtoken.verify`.
- Adjunta `req.user` (`{ id, role }`)
- Responses: 401 sin `ok: true`

### Role Middleware
- Permisos:
  - **Docente:** `POST /api/grades/:id` (registrar/modificar), `POST /api/attendance`, asistencia en tiempo real.
  - **Coordinador:** permisos de modificación de notas y supervisión.
  - **Estudiante:** GET de datos (notas, asistencia, constancia).
-Responses: 403 si rol no autorizado (documentar uso de userMid).

## 5. Seguridad Extra

- Regenerar y anular el access token en casos de logout
- Limitar intentos de login por IP (`express-rate-limit`)
- No exponer passwordHash en respuestas JSON.
- Usar `httpStatus` (helpers/httpStatus.js).
- Log de errores con envío a estudiantes en Riesgo: Página de alerta previa en Angular (DockedElement).
