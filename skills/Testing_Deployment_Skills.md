# Testing_Deployment_Skills.md — Pruebas, Despliegues y Mantenimiento

Guía táctica y metodología paso a paso para desarrollo, pruebas, despliegue y mantenimiento de EduCoro AI.

## 1. Pruebas de Desarrollo

### Pruebas Unitarias (Backend)
- Uso de `node:test` + `assert` (no dependencia externa).
- Ubicación: `projects/backend/tests/`
- Comando: `npm run test` → `node --test`
- Pruebas: validación de cálculos de notas, ponderación 30% - 35% - 35%, umbrales de riesgo (promedio < 10 → 'En Riesgo'), alerta temprana (> 20% inasistencias), y hash de contraseñas.

### Pruebas de Integración (API)
- Uso de Supertest para pruebas end-to-end de endpoints.
- Pruebas por rol: Docente, Estudiante, Coordinador, Admin.
- Prueba de JWT: generar token de prueba con `jsonwebtoken.sign`.
- Prueba de autenticación: login exitoso, refresh, logout.
- Prueba de validaciones: CI V/E, email, notas 0-20, enums de sección/estado.

## 2. Validación de Validación (Backend)

### Validación de CI
- Formato de CI V: `V-XXXXXXXX`
- Formato de CI E: `E-XXXXXXXX` (único)
- Validación de email: `Validator.isEmail()`

### Validación de Estudiantes
- Validación de campos V/E: `validarIds([ { key: 'ci' }, ...])`.

## 3. Deployment Local

### Arquitectura de Despliegue
- Backend en Node.js ESM + Express 5 + Mongoose + Socket.IO
- MongoDB vía docker-compose: `mongo:8`
- Frontend en Angular 22 + Bootstrap 5.3+
- Deploy local vía PM2

### Esquema Estándar (PM2)

```javascript
module.exports = {
  apps: [{
    name: 'educoro-ai-backend',
    script: './index.js',
    exec_mode: 'fork',
    instances: 1,
    env: { NODE_ENV: 'development', PORT: 3500 },
    env_production: { NODE_ENV: 'production', PORT: 3500 },
    autorestart: true,
    watch: false,
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
  }],
};
```

### Rsync de Desarrollo
- Copiar archivos del proyecto a servidor via SSH o rsync.

### Alta Disponibilidad
- Desplegar con Docker para MVP.

### Backup de MongoDB
```bash
mongodump --uri="$MONGO_URI" --out="$DIR_BACKUP/mongodb_dump"
```

## 4. Validación de Despliegue

### Comprobaciones Locales
- `npm run test` (Backend) - pruebas unitarias
- Validación de cálculos con scripts de prueba
- Log de errores limpios

### Validación de Smoke Test
- GET /api/health
- Validación depués de despliegue

### Respaldo Preventivo
- Antes de actualizar: ejecutar mongodump del entorno.

### Deploy
- Desplegar en staging y producción
- Rollback si falla.

### Maint

## 5. Validación de Despliegue

### Prueba de Smoke Test
- GET /api/health → 200 con respuesta JSON
- GET / → 200 (HTML)
- GET /socket.io/socket.io.js → 200 (archivo)

### Log de errores
- Revisión de logs/out.log y logs/err.log

### Validación de Herramientas
- Checklist de despliegue en documentación `memory/architecture_decisions.md`

### Validación de Aplicación
- Login por rol (Docente, Estudiante, Coordinador)
- Consultas a métricas: Notas, Promedio, Asistencia
- Generar PDF de boletín estudiantil
- Escaneo de QR para asistencia

### Rollback
- Si el build falla: revertir commits
- Si PM2 falla: verificar logs en logs/out.log y logs/err.log
