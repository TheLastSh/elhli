import Grade from './grade.model.js';
import Student from '../students/student.model.js';
import { AppError } from '../../helpers/appError.js';
import { asyncHandler } from '../../helpers/asyncHandler.js';

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
  if (g && typeof g.cut1 === 'number' && typeof g.cut2 === 'number' && typeof g.cut3 === 'number') {
    g.finalGrade = (g.cut1 * 0.30 + g.cut2 * 0.35 + g.cut3 * 0.35);
    await g.save();
  }
  return g;
};

// Business_Rules.md §2: promedio < 10 → 'En Riesgo' + alerta visual
export const checkRisk = async (studentId, finalGrade) => {
  if (finalGrade == null || finalGrade >= 10) return null;
  const student = await Student.updateOne({ _id: studentId }, { status: 'En Riesgo' });
  const alert = { type: 'riesgo_academico', promedio: finalGrade, studentId: studentId.toString(), at: new Date() };
  return alert;
};

export const create = asyncHandler(async (req, res) => {
  const { studentId, subject, cut1, cut2, cut3 } = req.body;
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  const grade = await Grade.create({ studentId, subject, cut1, cut2, cut3 });
  const recalced = await recalc(grade._id);
  const alert = await checkRisk(student._id, recalced.finalGrade);
  emit(req, 'grades_updated', { studentId: student._id.toString(), status: student.status });
  if (alert) emit(req, 'alert_created', alert);
  res.status(201).json({ ok: true, grade: toPublic(recalced), promedio: recalced.finalGrade, studentStatus: student.status });
});

export const list = asyncHandler(async (req, res) => {
  const { studentId, subject } = req.query;
  const query = {};
  if (studentId) query.studentId = studentId;
  if (subject) query.subject = subject;
  const data = await Grade.find(query).sort({ createdAt: -1 });
  res.json({ ok: true, data: data.map(toPublic) });
});

export const getOne = asyncHandler(async (req, res) => {
  const grade = await Grade.findById(req.params.id);
  if (!grade) throw new AppError('Calificación no encontrada', 404, 'NOT_FOUND', 'No existe una calificación con ese id');
  res.json({ ok: true, grade: toPublic(grade) });
});

export const update = asyncHandler(async (req, res) => {
  const { studentId, subject, cut1, cut2, cut3 } = req.body;
  const grade = await Grade.findById(req.params.id);
  if (!grade) throw new AppError('Calificación no encontrada', 404, 'NOT_FOUND', 'No existe una calificación con ese id');
  const newStudentId = studentId ? studentId : grade.studentId;
  if (!newStudentId) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  const student = await Student.findById(newStudentId);
  if (!student) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  Object.assign(grade, { studentId: newStudentId, subject: subject || grade.subject, cut1: cut1 ?? grade.cut1, cut2: cut2 ?? grade.cut2, cut3: cut3 ?? grade.cut3 });
  await grade.save();
  const recalced = await recalc(grade._id);
  const alert = await checkRisk(newStudentId, recalced.finalGrade);
  emit(req, 'grades_updated', { studentId: newStudentId, status: student.status });
  if (alert) emit(req, 'alert_created', alert);
  res.json({ ok: true, grade: toPublic(recalced), promedio: recalced.finalGrade });
});

export const promedio = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId;
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  const grades = await Grade.find({ studentId });
  const promedio = grades.length ? grades.reduce((s, g) => s + (g.finalGrade || 0), 0) / grades.length : 0;
  const promedioEstimado = grades.length && grades.every((g) => typeof g.finalGrade === 'number')
    ? grades.reduce((s, g) => s + g.finalGrade, 0) / grades.length
    : 0;
  const info = {
    studentId: studentId.toString(),
    fullName: student.fullName,
    section: student.section,
    totalCalificaciones: grades.length,
    promedioGeneral: promedioEstimado,
    status: student.status,
    enRiesgo: student.status === 'En Riesgo'
  };
  res.json({ ok: true, info });
});
