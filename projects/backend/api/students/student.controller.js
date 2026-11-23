import Student from './student.model.js';
import Grade from '../grades/grade.model.js';
import Attendance from '../attendance/attendance.model.js';
import { AppError } from '../../helpers/appError.js';
import { asyncHandler } from '../../helpers/asyncHandler.js';

const normalize = (c) => ({
  _id: c._id,
  ci: c.ci,
  fullName: c.fullName,
  email: c.email,
  section: c.section,
  status: c.status,
  qrCode: c.qrCode,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt
});

const emit = (req, event, payload) => {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
};

export const create = asyncHandler(async (req, res) => {
  const { ci, fullName, email, section, status } = req.body;
  const normalized = {
    ci: ci ? String(ci).trim().toUpperCase() : ci,
    fullName,
    email: email ? String(email).trim().toLowerCase() : email,
    section: section || 'IA-1',
    status: status || 'Activo'
  };
  // Note: 'Reprobado' se permite en modelo y via colas de backend (Fase 2)
  try {
    const student = await Student.create(normalized);
    res.status(201).json({ ok: true, student: normalize(student) });
  } catch (err) {
    if (err.code === 11000 || err.codeName === 'DuplicateKeyError' || String(err.message).includes('E11000')) {
      throw new AppError('El CI o email ya está registrado en EduCoro', 409, 'DUPLICATE_FOUND',
        'No puedes repetir datos de un estudiante ya inscrito; si está Retirado puedes reactivarlo');
    }
    throw err;
  }
});

export const list = asyncHandler(async (req, res) => {
  const { section, status, q, page = 1, limit = 50 } = req.query;
  const query = {};
  if (section) query.section = section;
  if (status) query.status = status;
  if (q) query.$or = [{ fullName: { $regex: new RegExp(q, 'i') } }, { ci: { $regex: new RegExp(q, 'i') } }];
  const data = await Student.find(query).sort({ fullName: 1 }).limit(Math.min(Number(limit) || 50, 200)).skip((Number(page) - 1) * 50);
  const total = await Student.countDocuments(query);
  res.json({ ok: true, data: data.map(normalize), pagination: { page: Number(page), total } });
});

export const getOne = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  res.json({ ok: true, student: normalize(student) });
});

export const update = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, { $set: { ...req.body } }, { new: true, runValidators: true });
  if (!student) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  emit(req, 'student_updated', { studentId: student._id.toString() });
  res.json({ ok: true, student: normalize(student) });
});

export const deleteOne = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  const [g, a] = await Promise.all([
    Grade.countDocuments({ studentId: student._id }),
    Attendance.countDocuments({ studentId: student._id })
  ]);
  if (g > 0) throw new AppError('El estudiante tiene calificaciones asociadas; márcalo como Retirado en vez de eliminarlo', 409, 'CANNOT_DELETE', 'No se puede eliminar');
  if (a > 0) throw new AppError('El estudiante tiene asistencias asociadas; márcalo como Retirado en vez de eliminarlo', 409, 'CANNOT_DELETE', 'No se puede eliminar');
  await student.deleteOne();
  res.json({ ok: true, message: `Estudiante ${student.fullName} eliminado` });
});
