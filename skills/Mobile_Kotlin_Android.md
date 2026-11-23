# Mobile_Kotlin_Android.md — Aplicación Móvil Android con Kotlin Nativo

## 1. Componentes del Proyecto

### Estructura: MVVM
- **Activity/Fragment**: Páginas de la app (Login, Dashboard, Notas, Asistencia, PDF).
- **ViewModel**: Lógica de negocio y observación de datos.
- **Repository**: Servicios REST con Retrofit + OkHttp.
- **Data Classes**: Entidades backend (Students, Grades, Attendance).
- **Room** (opcional, en Fase 2): Caché local para offline.

### Herramientas y Tecnologías
- **Dependencias:** Retrofit (HTTP), OkHttp (cliente HTTP), Coroutines (tareas asíncronas), Retrofit AndroidX Architecture Components.
- **UI:** Jetpack Compose (Recomendado) o XML Views.
- **Dependencias de build:**gradle, dependencies repo mavenCentral.
- **Firebase Crashlytics** (opcional).

### Permisos (AndroidManifest.xml)
- Permisos necesarios:
  - `INTERNET`
  - `WRITE_EXTERNAL_STORAGE` (para descargar PDF)
  - Permisos de ubicación (opcional, si aplica)
- Validar permisos de manera asincrona

### Configuración de Gradle
- **version.json**: Se copia en `uploads/apks/version.json`

## 2. Funcionalidades Completas

### Login Adaptativo
- Uso de credenciales con corrutinas y retrofit
- Login Especial: Login por RF ID con servidor de QR de login local, no habilitar el login con estudiantes.

### Sesiones y Tokens
- Tokens guardados en `EncryptedSharedPreferences` (cifrado AES-GCM nativo de Android).
- Token de acceso: valido 1 hora
- Token de actualización: valido 7 días
- **Refresh automático**: Al iniciar app, verificar token y renovar si es necesario.

### Funcionalidades

#### Notas (Fase 2)
- Endpoints: GET, POST, PUT grades por estudiante
- Actualizar promedio automáticamente
- Validación: Estado de update de notas en tiempo real

#### Asistencia (Fase 2)
- Endpoints: GET/POST attendance
- Selector de estado (Presente, Ausente, Justificado)
- Escaneo QR via `qrcode` (escaneo de carné a través del backend)

#### PDF del Boletín (Fase 2)
- GET /api/reports/students/:id/boletin.pdf
- Descargar PDF localmente
- Validar descarga antes de cerrar

#### Alertas (Fase 2)
- Validación de notas en tiempo real
- Showcase de alertas de riesgo de reprobación (Notificar si promedio < 10)

#### Validación de Session (Fase 2)
- Session de usuario activa en chat con servidor
- Revisar token en app
- Validación de sesión del servidor con análisis de tiempo

### Pruebas
- **Validación de compilación:** `./gradlew assembleDebug` (o `assembleRelease`).
- **Prueba local:** `./gradlew test` para tests de lógica de negocio.
- **Integración:** Pruebas de retrofit con MockWebServer.

## 4. Validación de Formato

### Manual
- Validación de credenciales de login
- Validación de campos
- Validación de tokens
- Validación de compilación (`./gradlew assembleDebug`)
- Validación de log de compilación (`./gradlew clean` para limpiar)

### Validación de API
- Prueba de Push Notification para notificar nuevas alerts
- Validación de Token

### Validación de Archivo de Versiones
- Se archiva en `uploads/apks/version.json`

### Validación de Versiones (`version.json`)
```json
{
  "appName": "NombreApp",
  "packageName": "com.ejemplo.app",
  "latestVersion": "1.0.0",
  "versionCode": 100,
  "releaseDate": "YYYY-MM-DD",
  "apkUrl": "/uploads/apks/app-release-1.0.0.apk",
  "mandatoryUpdate": false,
  "changelog": [
    "Mejoras de rendimiento",
    "Corrección de errores menores"
  ]
}
```

## 5. Seguridad

- Tokens guardados en `EncryptedSharedPreferences` (AES-GCM)
- Validación de credenciales de login
- Validación de propiedad de estudiantes
- Validación de contraseñas (BCrypt)
- Validación de email
- Validación de CI
- Validación de RUT
- Validación de estudiantes

## 6. Despliegue

- Build del APK para distribución: `./gradlew assembleRelease`
- Firma de APK (keys.json)
- Subida del APK a `uploads/apks/`
- Actualizar `version.json` con los datos reales

## 7. Validación del Deploy

- Validación de login por rol (Docente, Estudiante, Coordinador)
- Validación de consulta de notas (`GET /api/students/:id/grades`)
- Validación de asistencia
- Validación de boletín PDF
- Validación de QR en lector de carné
