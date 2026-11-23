# Error_Handling_Human_UX_Skill.md — Manejo de Errores Humanos

## 1. Envelope de Error Estándar (Backend)

Todas las respuestas de error deben seguir:

```javascript
res.status(err.status || 500).json({
  ok: false,
  code: 'ERROR_CODER', // código corto: STUDENT_NOT_FOUND, INVALID_CI, etc.
  message: 'Mensaje legible para el usuario',
  suggestion: 'Texto útil de qué hacer a continuación (ej: "Verifica el número de cédula")',
  details: err.errors || err.issues // opcional: detalles técnicos para logs
});
```

## 2. Servidor (Backend)

### AppError (helpers/appError.js)
- `new AppError(message, status, code, suggestion)`
- `throw new AppError('El email ya está en uso', 409, 'EMAIL_EXISTS', 'Intenta con otro email')`

### middleware de validación (asyncHandler)
- Envuelve handlers asincrónicos: `asyncHandler(async (req, res, next) => {...})`.
- Envuelve errores en AppError con `mapErrors()`.
- Para mongoose: capturar `ValidationError` y mapear a 400.

### Filtro de errores (errorMiddleware)
- Procesa AppError y errores generales.
- Ejemplo de registro de error: `console.error('[ERROR]', err.message)`

### Nota importante para Docentes/Estudiantes
- Aplicar middleware de errores en `src/app/shared/utils/errorHandler.ts` (Angular) para usuarios.
- Toast: usar `<p>` con error legible y sugerencia.

### Validación del CI en backend
- En el schema de mongoose:
  ```javascript
  ci: {
    type: String,
    unique: true,
    trim: true,
    required: [true, 'El CI es obligatorio']
  }
  ```

### Email en backend
- `email: { type: String, unique: true, trim: true }`

## 4. Frontend (Angular)

### Interceptor de Errores (ApiService)
- Interceptor global para manejar respuestas 401/403/409/422/500.
- Mostrar `WAlert` (Toast o Modal) con `message` y `suggestion` de la respuesta.
- Toast: estilo de mensajes usando `w-alert` con clases de bootstrap.
- Para redirecciones: no ocultar o botón para regresar.

### Componente de Validación (ValidationsService)
- Campos de formulario: `Validators.required`, `Validators.maxLength(8)`, `Validators.pattern(/^V-\d{8}$/)`.
- Detección de errores visuales: `hasError('required', ['email', 'fullName'])`.

### Método del Servicio
- Usar `checkCiExists(ci)` para prevalidar antes de guardar.
- Mostrar alerta visual al guardar estudiante.

## 5. Código de Error Completo para estudiante, profesores, coordinación y docentes
- Lista de errores con `status` y mensajes útiles, con sugerencias de acción.

### AsyncHandler
- Wrapper de errors en handler async de Express 5.
- Nuevo `next(err)`.

### Mapping de errores
- Mapeo entre errores de MongoDB (E11000) y código corto: `UNIQUE_CONSTRAINT_VIOLATION`.
- Cálculo de estatus: `mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'`.
- Función `cancellationToken`

## 6. Validación de Estudiante
- Validación de estado estudiantil para login, para evitar estudiantes poco en detalle.
- Defecto: log inactivo.
