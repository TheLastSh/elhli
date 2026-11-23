# UI_UX_Design_System.md — Guía de Estilo y Dinámica de la Interfaz (EduCoro AI)

Basado en la identidad visual de `context/system_context.md` §5 y la paleta sugerida.

## 1. Identidad visual

- **Azul Universitario:** `#1E3A8A`
- **Azul Real / Académico:** `#1D4ED8` (navegación, títulos primarios, botones primarios)
- **Índigo:** `#1E40AF` (encabezados de tablas de notas, tarjetas de asignaturas, menús activos)
- **Azul Claro Interactivo:** `#3B82F6` (enlaces, botones de detalle, selecciones)
- **Alerta / Ámbar:** `#D97706` (evaluaciones pendientes, plazos próximos, alertas)
- **Fondos neutros:** `#F8FAFC` (claro) / `#0F172A` (oscuro)

## 2. Tipografía

- Inter o Roboto (compatibilidad con Google Fonts)
- Títulos: semibold/bold, sin uso excesivo de caps

## 3. Componentes clave (Angular / Bootstrap 5.3+)

- **Tarjetas de asignatura:** `card` con título del curso, turno, docente; highlight riesgo
- **Tabla de notas:** `table table-bordered` editable por corte; cálculo visible del promedio parcial; color de texto: verde para promedios ≥ 10, rojo para riesgo
- **Badge de estado:** `badge` Estudiante / Docente / Coordinador; `badge bg-warning text-dark` para En Riesgo
- **Toast:** para operaciones exitosas y lecturas de datos (calendario, notas guardadas)
- **Badge de asistencia:** banderines verde (presentes), rojo (absentes > 20%)
- **Spinner:** para carga de datos largos

## 4. Accesibilidad

- Contraste mínimo AA (colores neutros adaptables)
- Etiquetas claras en todos los inputs
- Teclado navegable
- mensajes de error legibles (usar componente compartido `w-alert`)

## 5. Validaciones V/E

- Validación de CI usando `ci` único bajo un esquema de identificación V/E:
  - Formato de CI V: `V-XXXXXXXX`
  - Formato de CI E: `E-XXXXXXXX` (único, con rechazo si ya existe en mongo por: `Model.findOne({ ci })`).
- Validación de RUT/email con `express-validator` en backend y expresiones regulares en frontend.
- Validación de leyes académicas: notas 0–20, enums de sección (`IA-1`, `IA-2`, `SIST-1`), estados de asistencia.
- Validación de las ponderaciones de calificación: nota final debe ser igual a `0.30 * c1 + 0.35 * c2 + 0.35 * c3` (tolerancia de 0.01).
- Alertas tempranas: mensajes preventivos cuando el promedio < 10 o absencias > 20%.
