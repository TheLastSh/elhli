# Backend_Architecture_CRUD.md — Estándar de API REST, Mongoose y Sockets (EduCoro AI)

## 1. Entorno y Estándar Modular
- **Entorno:** Node.js 26+ con ES Modules (`"type": "module"` en `package.json`) y framework Express 5.x.
- **Ubicación:** `/projects/backend/`[cite: 2, 9].
- **Organización por módulos:** Cada módulo del dominio debe agruparse en `/projects/backend/api/<modulo>/` (modelos, controladores y rutas)[cite: 3, 9].
- **Servicios transversales:** Conexión a base de datos en `/databases/`, clase `WebServer` en `/bin/server.js`, punto de entrada en `index.js` (puerto `3500`), utilidades en `/helpers/`, middlewares en `/middlewares/` y archivos estáticos compilados del frontend en `/public/`[cite: 2, 9].

## 2. Servidor Base (`WebServer` y Socket.IO)
- Configurar Express 5, HTTP server y `Socket.IO` en `/bin/server.js` exponiendo `io` en la app (`this.app.set('io', this.io)`)[cite: 2, 9].
- Integrar `helmet`, `cors`, parseo JSON/URL-encoded, `express-fileupload` hacia `/uploads/` y servidos de archivos estáticos desde `/public/`[cite: 2, 9].
- Iniciar la aplicación desde `index.js` escuchando en el puerto `3500` (o `process.env.PORT`)[cite: 2, 9].

## 3. Modelos de Datos (Mongoose) y Reglas Académicas
- **Estudiantes (`student.model.js` en `/api/students/`):**
  - `ci`: `String` (único, validación `V` o `E`)[cite: 3].
  - `fullName`: `String`[cite: 3].
  - `email`: `String` (único)[cite: 3].
  - `section`: `String` (`enum: ['IA-1', 'IA-2', 'SIST-1']`)[cite: 3].
  - `status`: `String` (`enum: ['Activo', 'Retirado', 'En Riesgo']`)[cite: 3].
  - `qrCode`: `String`[cite: 3].
- **Calificaciones (`grade.model.js`):**
  - `studentId`: `ObjectId` (`ref: 'Student'`)[cite: 3].
  - `subject`: `String` (ej. `'Inteligencia Artificial'`)[cite: 3].
  - `cut1`, `cut2`, `cut3`: `Number` (`0` a `20`)[cite: 3].
  - `finalGrade`: `Number` calculado con ponderación `30% - 35% - 35%`[cite: 2, 3].
  - Nota mínima aprobatoria: `10` sobre `20`; notas acumuladas menores a `10` implican estado/alerta de riesgo[cite: 2, 3].
- **Asistencia (`attendance.model.js` en `/api/attendance/`):**
  - `studentId`: `ObjectId` (`ref: 'Student'`)[cite: 3].
  - `date`: `Date`[cite: 3].
  - `section`: `String`[cite: 3].
  - `status`: `String` (`enum: ['Presente', 'Ausente', 'Justificado']`)[cite: 3].
  - Considerar umbral de alerta temprana (`> 20%` de inasistencias) y reprobación automática (`> 25%` de inasistencias)[cite: 2, 4].

## 4. Controladores, Rutas, Roles y Tiempo Real
- Implementar controladores y rutas Express 5 para estudiantes, cursos, calificaciones y asistencia bajo `/api/`[cite: 2, 3, 9].
- Al registrar asistencia o escanear un QR en `attendance.controller.js`, emitir el evento Socket.IO `'attendance_registered'` con los datos registrados para refrescar el panel docente en tiempo real[cite: 3].
- Proteger rutas sensibles y restringir la modificación de notas a los roles `'Profesor'` o `'Coordinador'` mediante `/middlewares/auth.middleware.js`[cite: 3].
- Soportar generación de boletín/reporte en PDF en `/helpers/pdf-reportcard.js`[cite: 3].

## 5. Manejo de Errores y Memoria
- Devolver respuestas de error claras y legibles para que el frontend/móvil puedan mostrar avisos útiles al usuario[cite: 9].
- Registrar decisiones técnicas en `/memory/architecture_decisions.md` y soluciones a fallos en `/memory/error_solutions.md`[cite: 9].