import Attendance, { calculateAttendanceStats } from './attendance.model.js';
import Student from '../students/student.model.js';
import { AppError } from '../../helpers/appError.js';
import { asyncHandler } from '../../helpers/asyncHandler.js';

const emit = (req, event, payload) => {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
};

const toPublic = (a) => ({
  _id: a._id,
  studentId: a.studentId,
  date: a.date,
  section: a.section,
  status: a.status,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt
});

// Business_Rules.md §3: se calcula el porcentaje de inasistencias (lógica en attendance.model.js)
export const attendanceStats = async (studentId, until = new Date()) => {
  const items = await Attendance.find({ studentId, date: { $lte: until } });
  return calculateAttendanceStats(items);
};

// Business_Rules.md §3: alerta temprana (>20%) y reprobación automática (>25%)
export const checkAttendanceAlerts = async (studentId) => {
  const stats = await attendanceStats(studentId);
  const alerts = [];
  if (stats.porcentajeInasistencias > 25) {
    await Student.updateOne({ _id: studentId }, { status: 'Reprobado' });
    alerts.push({ type: 'reprobado_por_inasistencia', porcentaje: stats.porcentajeInasistencias, studentId: studentId.toString(), at: new Date() });
  } else if (stats.porcentajeInasistencias > 20) {
    alerts.push({ type: 'alerta_preventiva_inasistencia', porcentaje: stats.porcentajeInasistencias, studentId: studentId.toString(), at: new Date() });
  }
  return { stats, alerts };
};

export const create = asyncHandler(async (req, res) => {
  const { studentId, date, section, status } = req.body;
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  const attendance = await Attendance.create({
    studentId,
    date: date ? new Date(date) : new Date(),
    section: section || student.section,
    status
  });
  const { stats, alerts } = await checkAttendanceAlerts(student._id);
  emit(req, 'attendance_registered', {
    attendanceId: attendance._id,
    studentId: studentId.toString(),
    status,
    date: attendance.date,
    porcentaje: stats.porcentajeInasistencias
  });
  for (const alert of alerts) emit(req, 'alert_created', alert);
  res.status(201).json({ ok: true, attendance: toPublic(attendance), stats, alerts });
});

// Escanear código QR del carné (Business_Rules §1: asistencia mediante QR)
export const scan = asyncHandler(async (req, res) => {
  const { qrCode } = req.body;
  const student = await Student.findOne({ qrCode: qrCode ? String(qrCode).trim() : undefined });
  if (!student) throw new AppError('No se encontró estudiante con ese código QR', 404, 'NOT_FOUND', 'El código QR no corresponde a un estudiante registrado; verifica el carné escaneado');
  const attendance = await Attendance.create({
    studentId: student._id,
    section: student.section,
    status: 'Presente'
  });
  const { stats, alerts } = await checkAttendanceAlerts(student._id);
  emit(req, 'attendance_registered', {
    attendanceId: attendance._id,
    studentId: student._id.toString(),
    status: 'Presente',
    date: attendance.date,
    porcentaje: stats.porcentajeInasistencias
  });
  for (const alert of alerts) emit(req, 'alert_created', alert);
  res.status(201).json({ ok: true, attendance: toPublic(attendance), stats, alerts });
});

export const list = asyncHandler(async (req, res) => {
  const { studentId, section, date } = req.query;
  const query = {};
  if (studentId) query.studentId = studentId;
  if (section) query.section = section;
  if (date) query.date = new Date(date);
  const data = await Attendance.find(query).sort({ date: -1, _id: -1 });
  res.json({ ok: true, data: data.map(toPublic) });
});

export const getOne = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id).populate('studentId', 'fullName');
  if (!attendance) throw new AppError('Asistencia no encontrada', 404, 'NOT_FOUND', 'No existe un registro de asistencia con ese id');
  res.json({ ok: true, attendance: toPublic(attendance) });
});

export const porcentaje = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId;
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  const stats = await attendanceStats(student._id);
  res.json({ ok: true, studentId: studentId.toString(), ...stats });
});
