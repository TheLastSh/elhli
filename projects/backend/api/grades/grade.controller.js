import Grade from './grade.model.js';
import Student from '../students/student.model.js';
import Attendance from '../attendance/attendance.model.js';
import Alert from '../alerts/alert.model.js';
import { AppError } from '../../helpers/appError.js';
import { asyncHandler } from '../../helpers/asyncHandler.js';
import { calculateFinalGrade, computeAverageFinalGrade, computeStudentAverage, evaluateStudentStatus, saveAlertIfNew } from '../../helpers/businessRules.js';
import { scopeStudents, isStudentInDocenteScope } from '../../helpers/docenteScope.js';

const emit = (req, event, payload) => {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
};

const toPublic = (g) => ({
  _id: g._id,
  studentId: g.studentId,
  subject: g.subject,
  cut1: g.cut1,
  cut2: g.cut2,
  cut3: g.cut3,
  finalGrade: g.finalGrade,
  createdAt: g.createdAt,
  updatedAt: g.updatedAt
});

export const recalc = async (id) => {
  const g = await Grade.findById(id);
  if (!g) return null;
  const allNumbers = [g.cut1, g.cut2, g.cut3].every((c) => typeof c === 'number');
  g.finalGrade = allNumbers ? calculateFinalGrade(g.cut1, g.cut2, g.cut3) : null;
  await g.save();
  return g;
};

const computePorcentajeInasistencias = async (studentId) => {
  const items = await Attendance.find({ studentId });
  const total = items.length;
  const ausentes = items.filter((a) => a.status === 'Ausente').length;
  return total ? (ausentes / total) * 100 : 0;
};

// Polished (Business_Rules.md §2): promedio global del estudiante → status + alerta persistida.
// Delegado a helpers/studentStatus.js; el `En Riesgo` es recuperable y `Reprobado` es sticky.
function calculateAcademicAlert(finalGrade) {
  return {
    type: 'riesgo_academico',
    severity: 'alerta',
    message: `Promedio académico ${finalGrade.toFixed(2)}/20. Nota mínima aprobatoria: 10 (criterio UNEFA).`,
    promedio: finalGrade,
    at: new Date()
  };
}

export const checkRisk = async (studentId) => {
  const [avg, student] = await Promise.all([computeStudentAverage(Grade, studentId), Student.findById(studentId).select('status')]);
  if (avg != null && avg < 10) {
    await saveAlertIfNew(Alert, { ...calculateAcademicAlert(avg), studentId: studentId.toString() });
  }
  const status = evaluateStudentStatus({ finalGrade: avg, currentStatus: student?.status || 'Activo' });
  if (status !== undefined) await Student.updateOne({ _id: studentId }, { status }).exec();
  return avg != null && avg < 10 ? { type: 'riesgo_academico', promedio: avg, studentId: studentId.toString(), at: new Date() } : null;
};

export const create = asyncHandler(async (req, res) => {
  const { studentId, subject, cut1, cut2, cut3 } = req.body;
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  if (req.user?.role === 'Docente') {
    const inScope = await isStudentInDocenteScope(req.user, student._id);
    if (!inScope) throw new AppError('Acceso denegado: estudiante fuera de tu alcance', 403, 'FORBIDDEN', 'Solo puedes crear calificaciones de tus cursos');
  }
  const grade = await Grade.create({ studentId, subject, cut1, cut2, cut3 });
  const recalced = await recalc(grade._id);
  await checkRisk(student._id);
  const freshStudent = await Student.findById(student._id).select('status');
  emit(req, 'grades_updated', { studentId: student._id.toString(), status: freshStudent?.status });
  emit(req, 'student_updated', { studentId: student._id.toString(), status: freshStudent?.status });
  res.status(201).json({ ok: true, grade: toPublic(recalced), promedio: recalced.finalGrade, studentStatus: freshStudent?.status });
});

export const list = asyncHandler(async (req, res) => {
  const { studentId, subject } = req.query;
  const query = await scopeStudents(req.user, {});
  if (studentId) query.studentId = studentId;
  if (subject) query.subject = subject;
  const data = await Grade.find(query).sort({ createdAt: -1 });
  res.json({ ok: true, data: data.map(toPublic) });
});

export const getOne = asyncHandler(async (req, res) => {
  const grade = await Grade.findById(req.params.id);
  if (!grade) throw new AppError('Calificación no encontrada', 404, 'NOT_FOUND', 'No existe una calificación con ese id');
  if (req.user?.role === 'Docente') {
    const inScope = await isStudentInDocenteScope(req.user, grade.studentId);
    if (!inScope) throw new AppError('Acceso denegado: calificación fuera de tu alcance', 403, 'FORBIDDEN', 'Solo puedes ver calificaciones de tus cursos');
  }
  res.json({ ok: true, grade: toPublic(grade) });
});

export const update = asyncHandler(async (req, res) => {
  const { studentId, subject, cut1, cut2, cut3 } = req.body;
  const grade = await Grade.findById(req.params.id);
  if (!grade) throw new AppError('Calificación no encontrada', 404, 'NOT_FOUND', 'No existe una calificación con ese id');
  if (req.user?.role === 'Docente') {
    const inScope = await isStudentInDocenteScope(req.user, grade.studentId);
    if (!inScope) throw new AppError('Acceso denegado: calificación fuera de tu alcance', 403, 'FORBIDDEN', 'Solo puedes editar calificaciones de tus cursos');
  }
  const newStudentId = studentId ? studentId : grade.studentId;
  if (!newStudentId) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  const student = await Student.findById(newStudentId);
  if (!student) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  Object.assign(grade, { studentId: newStudentId, subject: subject || grade.subject, cut1: cut1 ?? grade.cut1, cut2: cut2 ?? grade.cut2, cut3: cut3 ?? grade.cut3 });
  await grade.save();
  const recalced = await recalc(grade._id);
  await checkRisk(newStudentId);
  const freshStudent = await Student.findById(newStudentId).select('status');
  emit(req, 'grades_updated', { studentId: newStudentId, status: freshStudent?.status });
  emit(req, 'student_updated', { studentId: newStudentId, status: freshStudent?.status });
  res.json({ ok: true, grade: toPublic(recalced), promedio: recalced.finalGrade, studentStatus: freshStudent?.status });
});

export const promedio = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId;
  const [student, grades] = await Promise.all([Student.findById(studentId), Grade.find({ studentId })]);
  if (req.user?.role === 'Docente') {
    const inScope = await isStudentInDocenteScope(req.user, studentId);
    if (!inScope) throw new AppError('Acceso denegado: estudiante fuera de tu alcance', 403, 'FORBIDDEN', 'Solo puedes ver el promedio de tus estudiantes');
  }
  if (!student) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  const promedioGeneral = computeAverageFinalGrade(grades);
  const info = {
    studentId: studentId.toString(),
    fullName: student.fullName,
    section: student.section,
    totalCalificaciones: grades.length,
    promedioGeneral,
    status: student.status,
    enRiesgo: evaluateStudentStatus({ finalGrade: promedioGeneral, currentStatus: student.status }) === 'En Riesgo'
  };
  res.json({ ok: true, info });
});
