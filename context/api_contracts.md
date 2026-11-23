# api_contracts.md — Contratos REST y Eventos WebSocket

## 1. Endpoints REST Principales
- **`/api/students`**: Gestión de estudiantes (`ci` con validación `V`/`E`, `fullName`, `email`, `section` en `['IA-1', 'IA-2', 'SIST-1']`, `status` en `['Activo', 'Retirado', 'En Riesgo']`, `qrCode`)[cite: 2, 3].
- **`/api/courses`**: Gestión de cursos, asignaturas y secciones[cite: 2, 5].
- **`/api/grades`**: Registro y consulta de calificaciones por corte (`studentId`, `subject`, `cut1`, `cut2`, `cut3`, `finalGrade`)[cite: 2, 3].
- **`/api/attendance`**: Registro y consulta de asistencia diaria (`studentId`, `date`, `section`, `status` en `['Presente', 'Ausente', 'Justificado']`)[cite: 2, 3].

## 2. Eventos WebSocket (Socket.IO)
- **`attendance_registered`**: Emitido al registrar asistencia o escanear el código QR de un estudiante para actualizar el panel docente en tiempo real[cite: 3].
- **Actualización de calificaciones:** Refresco inmediato de notas al guardar evaluaciones desde el portal docente[cite: 3, 6].