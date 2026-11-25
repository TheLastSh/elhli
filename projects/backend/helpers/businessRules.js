import { AppError } from './appError.js';

// Reglas de negocio centralizadas — sólo declaraciones de context/business_rules.md.
// Nota: los umbrales están en UNA sola fuente de verdad y aplican también a las pruebas (tests/business-rules.test.js).
export const PASS_GRADE = 10;                 // §2: nota mínima aprobatoria (UNEFA)
export const ATTENDANCE_PREVENTIVE = 20;      // §3: alerta temprana de inasistencia
export const ATTENDANCE_REPROBA = 25;         // §3: reprobación automática por inasistencia

// §1: ponderación 30% - 35% - 35% sobre 3 cortes.
export const calculateFinalGrade = (cut1, cut2, cut3) => {
  if (typeof cut1 !== 'number' || typeof cut2 !== 'number' || typeof cut3 !== 'number') return null;
  return cut1 * 0.30 + cut2 * 0.35 + cut3 * 0.35;
};

export const computeAverageFinalGrade = (grades) => {
  const finals = (grades || []).filter((g) => typeof g.finalGrade === 'number').map((g) => g.finalGrade);
  if (finals.length === 0) return null;
  return finals.reduce((a, b) => a + b, 0) / finals.length;
};

export const computeStudentAverage = async (GradeModel, studentId) => {
  const grades = await GradeModel.find({ studentId }).select('finalGrade');
  return computeAverageFinalGrade(grades);
};

// §1: notas 0-20, permitiendo decimales.
export const validateCuts = (cut1, cut2, cut3) => {
  for (const [name, value] of [['cut1', cut1], ['cut2', cut2], ['cut3', cut3]]) {
    if (value === undefined || value === null) continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 20) {
      throw new AppError(`La nota de ${name} debe estar entre 0 y 20`, 400, 'INVALID_NOTE', 'Verifica las notas de los 3 cortes');
    }
  }
};

// §1: al guardar finalGrade externamente, debe coincidir con la fórmula.
export const checkFinalGradeFormula = (body) => {
  if (body.finalGrade === undefined || body.finalGrade === null) return;
  const calc = calculateFinalGrade(body.cut1, body.cut2, body.cut3);
  if (calc !== null && Math.abs(body.finalGrade - calc) > 0.01) {
    throw new AppError('finalGrade debe ser igual a 0.30*cut1 + 0.35*cut2 + 0.35*cut3', 400, 'INVALID_FINAL_GRADE', `Formula esperada: ${calc}`);
  }
};

// §2: promedio < 10 → 'En Riesgo' (revertible a 'Activo'); §3: > 25 → 'Reprobado' (conservador/sticky).
export const evaluateStudentStatus = ({ finalGrade, porcentajeInasistencias = null, currentStatus = 'Activo' }) => {
  if (currentStatus === 'Retirado') return 'Retirado';
  if (typeof porcentajeInasistencias === 'number' && porcentajeInasistencias > ATTENDANCE_REPROBA) return 'Reprobado';
  // Reprobado es sticky: aunque el promedio caiga, un Reprobado se mantiene.
  if (currentStatus === 'Reprobado') return 'Reprobado';
  if (typeof finalGrade === 'number' && finalGrade < PASS_GRADE) return 'En Riesgo';
  return 'Activo';
};

export const buildAcademicAlert = (finalGrade) => ({
  type: 'riesgo_academico',
  severity: 'alerta',
  message: `Promedio académico ${finalGrade.toFixed(2)}/20. Nota mínima aprobatoria: ${PASS_GRADE} (criterio UNEFA).`,
  promedio: finalGrade,
  at: new Date()
});

export const buildAttendanceAlerts = (porcentaje) => ({
  pct: porcentaje,
  alerts: [
    ...(porcentaje > ATTENDANCE_REPROBA
      ? [{
        type: 'reprobado_por_inasistencia',
        severity: 'alerta',
        message: `Reprobación automática por inasistencia: ${porcentaje.toFixed(2)}% de inasistencias (> ${ATTENDANCE_REPROBA}%).`,
        porcentaje,
        at: new Date()
      }]
      : []),
    ...(porcentaje > ATTENDANCE_PREVENTIVE
      ? [{
        type: 'alerta_preventiva_inasistencia',
        severity: 'aviso',
        message: `Alerta temprana: ${porcentaje.toFixed(2)}% de inasistencias (> ${ATTENDANCE_PREVENTIVE}%).`,
        porcentaje,
        at: new Date()
      }]
      : [])
  ]
});

// Deduplica alertas de un tipo para un estudiante dentro del último día
// (resuelve el punto de polido: no saturar el historial con lo mismo cada vez).
export const saveAlertIfNew = async (AlertModel, alert, { days = 1 } = {}) => {
  if (!alert || alert.type === undefined) return null;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  startOfDay.setDate(startOfDay.getDate() - days);
  const query = { type: alert.type, createdAt: { $gte: startOfDay } };
  if (alert.studentId) query.studentId = alert.studentId;
  const candidates = await AlertModel.find(query).lean();
  if (candidates.length > 0) return null;
  return AlertModel.create({ ...alert });
};
