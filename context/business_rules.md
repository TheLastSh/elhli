# business_rules.md — Reglas de Negocio de EduCoro AI

## 1. Ponderación y Cálculo de Calificaciones
- El rendimiento por asignatura se evalúa en **3 cortes** con ponderación **30% - 35% - 35%**[cite: 2, 3].
- Las notas de cada corte (`cut1`, `cut2`, `cut3`) se registran en escala de **0 a 20 puntos**[cite: 3].
- La nota final (`finalGrade`) se calcula ponderando los cortes según `30%`, `35%` y `35%`[cite: 2, 3].

## 2. Aprobación y Riesgo Académico
- **Nota mínima aprobatoria:** **10 puntos sobre 20** (criterio UNEFA)[cite: 2].
- Un estudiante con nota acumulada o promedio inferior a **10 puntos** se considera **En Riesgo** (o reprobado según corresponda) y debe activar alerta visual/preventiva[cite: 2, 3, 4].

## 3. Control de Asistencia e Inasistencias
- Estados de asistencia: `Presente`, `Ausente` y `Justificado`[cite: 3].
- **Reprobación automática por inasistencia:** Superar el **25%** de inasistencias implica reprobación automática[cite: 2].
- **Alerta temprana:** Al superar el **20%** de inasistencias (o promedio `< 10`), el sistema debe activar notificación preventiva/tutoría[cite: 4].

## 4. Roles y Permisos
- **Profesor / Docente:** Puede gestionar asistencia y registrar/modificar calificaciones de sus asignaturas/secciones[cite: 3, 5, 6].
- **Coordinador / Admin:** Gestión administrativa, supervisión y modificación de notas según permisos de rol[cite: 3, 6].
- **Estudiante:** Consulta de su récord, notas por corte, promedio, asistencia y descarga de constancia/boletín PDF[cite: 3, 4, 6].