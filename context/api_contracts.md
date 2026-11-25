# api_contracts.md — Contratos REST y Eventos WebSocket (actualizado v2)

## 1. Endpoints REST Principales
- **`/api/students`**: Gestión de estudiantes (`ci` con validación `V`/`E`, `fullName`, `email`, `section` en `['IA-1', 'IA-2', 'SIST-1']`, `status` en `['Activo', 'Retirado', 'En Riesgo', 'Reprobado']`) y `qrCode`[cite: 2, 3].
- **`/api/courses`**: Gestión de cursos, asignaturas y secciones[cite: 2, 5].
- **`/api/grades`**: Registro y consulta de calificaciones por corte (`studentId`, `subject`, `cut1`, `cut2`, `cut3`, `finalGrade`). Notas en 0–20; `finalGrade` debe coincidir con `0.30*cut1 + 0.35*cut2 + 0.35*c3`. Registros de riesgo (`finalGrade < 10`) persisten en `Alert` con `message`/`severity='alerta'`[cite: 2, 3].
- **`/api/attendance`**: Registro y consulta de asistencia diaria (`studentId`, `date`, `section`, `status` en `['Presente', 'Ausente', 'Justificado']`); `Justificado` no cuenta como inasistencia (§3)[cite: 2, 3].
- **`/api/system/overview`**: KPIs globales del sistema (`metrics.alertsTotal/alertsLast24h`, `recentAlerts` = alertas persistidas con `type/severity/message`, dedupe por día)[cite: new].

## 2. Eventos WebSocket (Socket.IO)
- **`attendance_registered`**: Emitido al registrar asistencia o escanear el código QR de un estudiante (Business_Rules.md §3, duplicado máximo por día → 409 `ALREADY_REGISTERED`)[cite: 3].
- **`grades_updated` / `student_updated`**: Refresco inmediato de notas y estado del estudiante al guardar evaluaciones desde el portal docente[cite: 3, 6, new].
- **`alert_created`**: Alertas de riesgo académico y por asistencia (ahora registradas en base, para `/api/system/overview` y dashboards)[cite: new].

## 3. Umbrales (Business_Rules.md)
- §2: Promedio final del estudiante `< 10/20` → `status: 'En Riesgo'` (recuperable) + alerta persistida.
- §3: > 20% inasistencias → alerta preventiva; > 25% → `status: 'Reprobado'` + alerta. `Retirado` es terminal.