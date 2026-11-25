import Grade from '../api/grades/grade.model.js';
import Attendance from '../api/attendance/attendance.model.js';
import Student from '../api/students/student.model.js';
import {
  ATTENDANCE_REPROBA,
  buildAcademicAlert,
  computeStudentAverage,
  evaluateStudentStatus,
  saveAlertIfNew,
} from './businessRules.js';

export const computePorcentajeInasistencias = async (studentId) => {
  const items = await Attendance.find({ studentId });
  const total = items.length;
  const ausentes = items.filter((a) => a.status === 'Ausente').length;
  return total ? (ausentes / total) * 100 : 0;
};

/**
 * Recalcula el estado de un estudiante usando ambos criterios (§2 y §3):
 * promedio académico y porcentaje de asistencias. Se usa tras guardar nota
 * o registrar asistencia, para que el status se mantenga coherente.
 */
export const recomputeStudentStatus = async (studentId) => {
  const [avg, pct, student] = await Promise.all([
    computeStudentAverage(Grade, studentId),
    computePorcentajeInasistencias(studentId),
    Student.findById(studentId).select('status'),
  ]);
  const status = evaluateStudentStatus({
    finalGrade: avg,
    porcentajeInasistencias: pct,
    currentStatus: student?.status || 'Activo',
  });
  if (status !== undefined) {
    await Student.updateOne({ _id: studentId }, { status });
  }
  return { status, avg, pct };
};
