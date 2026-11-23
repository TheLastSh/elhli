# system_context.md — EduCoro AI

## 1. Nombre Oficial y Asignación
- **Nombre oficial:** EduCoro AI (Sistema de Gestión Académica e Inteligencia Educativa)[cite: 1, 2].
- **Cátedra / Código:** Inteligencia Artificial (ESI-31153) — Asignación `UNEFA-IA-PRJ-03`[cite: 1, 5].
- **Ámbito:** Universidad Nacional Experimental Politécnica de la Fuerza Armada (UNEFA) — Núcleo Falcón (extensiones Coro, Punto Fijo y Churuguara)[cite: 5].

## 2. Público Objetivo
- Profesores / docentes universitarios[cite: 1, 2].
- Estudiantes de UNEFA Núcleo Falcón (y liceos regionales)[cite: 1, 2].
- Coordinación de Control de Estudios / coordinadores académicos y representantes[cite: 1, 2].

## 3. Problemática Educativa
- Retardo en la publicación de evaluaciones y emisión de boletines o actas de notas[cite: 1, 2, 5].
- Falta de seguimiento en tiempo real del promedio acumulado y desconexión docente-estudiante para tareas y avisos[cite: 1, 2, 5].
- Pérdida o dificultad en el control de asistencia y falta de alertas tempranas de riesgo académico o repitencia[cite: 1, 2, 5].

## 4. Requerimientos Funcionales
- **Cursos y secciones:** Gestión de asignaturas y secciones (ej. `IA-1`, `IA-2`, `SIST-1`)[cite: 2, 3, 5].
- **Carga de notas por cortes:** Registro y cálculo de calificaciones por Corte 1, Corte 2 y Corte 3[cite: 2, 3].
- **Asistencia con código QR:** Pase de lista mediante escaneo de carné QR con actualización en tiempo real[cite: 2, 3, 4].
- **Constancias y boletines PDF:** Generación de reportes/boletines descargables en PDF con el desglose por corte[cite: 3].
- **Asistente IA y alertas académicas:** Detección temprana de estudiantes en riesgo e informes/avisos automatizados[cite: 1, 2, 4].

## 5. Identidad Visual y Guía de Estilos
- **Azul Universitario:** `#1E3A8A`
- **Azul Real / Académico Institucional:** `#1D4ED8` (navegación, títulos principales, botones primarios)[cite: 2, 6]
- **Índigo Universitario:** `#1E40AF` (encabezados de tablas de notas, tarjetas de asignaturas, menús activos)[cite: 6]
- **Azul Claro Interactivo:** `#3B82F6` (enlaces, botones de detalle, selección en formularios)[cite: 6]
- **Alerta / Ámbar o Dorado:** `#D97706` (evaluaciones pendientes, plazos próximos, alertas)[cite: 2, 6]
- **Fondos neutros:** `#F8FAFC` (claro) / `#0F172A` (oscuro)[cite: 2]
- **Tipografía:** `Inter` o `Roboto`[cite: 7].

## 6. Estrategia MCP y Ecosistema Técnico
- **Conector MCP / Notificaciones:** Bot de Telegram para consultar notas por corte, promedio y asistencia, además de notificar al publicarse notas y enviar alertas/correos preventivos a estudiantes en riesgo[cite: 2, 4, 6].
- **Stack:** Backend en Node.js 26 ESM + Express 5 + Mongoose + Socket.IO; Frontend en Angular 22+ Standalone + Signals + Bootstrap 5.3+; App móvil nativa en Kotlin para Android; despliegue en Linux con PM2[cite: 1, 3, 4, 7, 9].