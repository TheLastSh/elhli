import Course from './course.model.js';
import Student from '../students/student.model.js';
import { AppError } from '../../helpers/appError.js';
import { asyncHandler } from '../../helpers/asyncHandler.js';

const toPublic = (c) => ({
  _id: c._id,
  subject: c.subject,
  section: c.section,
  professorId: c.professorId,
  students: c.students
});

export const create = asyncHandler(async (req, res) => {
  const { subject, section, professorId } = req.body;
  const course = await Course.create({ subject, section: section || 'IA-1', professorId: professorId || null });
  res.status(201).json({ ok: true, course: toPublic(course) });
});

export const list = asyncHandler(async (req, res) => {
  const { section } = req.query;
  const query = section ? { section } : {};
  const data = await Course.find(query);
  res.json({ ok: true, data: data.map(toPublic) });
});

export const getOne = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('professorId', ['email', 'fullName']);
  if (!course) throw new AppError('Curso no encontrado', 404, 'NOT_FOUND', 'No existe un curso con ese id');
  res.json({ ok: true, course: { ...toPublic(course), professor: course.professorId } });
});

export const update = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Curso no encontrado', 404, 'NOT_FOUND', 'No existe un curso con ese id');
  Object.assign(course, req.body);
  await course.save();
  res.json({ ok: true, course: toPublic(course) });
});

export const addStudents = asyncHandler(async (req, res) => {
  const { studentIds } = req.body;
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Curso no encontrado', 404, 'NOT_FOUND', 'No existe un curso con ese id');
  const current = new Set([...(course.students || []), ...(studentIds || [])].map(String));
  course.students = [...current].map((id) => id);
  await course.save();
  res.json({ ok: true, course: toPublic(course) });
});
