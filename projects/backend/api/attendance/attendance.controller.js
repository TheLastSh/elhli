import Attendance, { calculateAttendanceStats } from './attendance.model.js';
import Student from '../students/student.model.js';
import Alert from '../alerts/alert.model.js';
import { AppError } from '../../helpers/appError.js';
import { asyncHandler } from '../../helpers/asyncHandler.js';
import { buildAttendanceAlerts, saveAlertIfNew } from '../../helpers/businessRules.js';
import { recomputeStudentStatus } from '../../helpers/studentStatus.js';
import { isStudentInDocenteScope, scopeStudents } from '../../helpers/docenteScope.js';

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
// Polished: alertas persistidas en Alert (historial en /api/system/overview) + deduped por día.
export const checkAttendanceAlerts = async (studentId, emitFn = () => { }) => {
  const stats = await attendanceStats(studentId);
  const { alerts: generated } = buildAttendanceAlerts(stats.porcentajeInasistencias);
  if (generated.some((a) => a.type === 'reprobado_por_inasistencia')) {
    await Student.updateOne({ _id: studentId }, { status: 'Reprobado' }).exec();
  }
  const alerts = [];
  for (const alert of generated) {
    const doc = await saveAlertIfNew(Alert, { ...alert, studentId: studentId.toString() });
    if (doc) {
      alerts.push({ ...doc, studentId: studentId.toString() });
      emitFn('alert_created', doc);
    }
  }
  return { stats, alerts };
};

export const create = asyncHandler(async (req, res) => {
  const { studentId, date, section, status } = req.body;
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  if (req.user?.role === 'Docente') {
    const inScope = await isStudentInDocenteScope(req.user, student._id);
    if (!inScope) throw new AppError('Acceso denegado: estudiante fuera de tu alcance', 403, 'FORBIDDEN', 'Solo puedes registrar asistencias de tus estudiantes');
  }
  const resolvedDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(resolvedDate.getFullYear(), resolvedDate.getMonth(), resolvedDate.getDate());
  const existingToday = await Attendance.findOne({ studentId, date: { $gte: startOfDay } });
  if (existingToday) throw new AppError('Asistencia ya registrada hoy para este estudiante', 409, 'ALREADY_REGISTERED', 'Este estudiante ya tiene registro de asistencia hoy; verifica el carné o la fecha');
  const attendance = await Attendance.create({
    studentId,
    date: resolvedDate,
    section: section || student.section,
    status
  });
  const { stats, alerts } = await checkAttendanceAlerts(student._id, (event, payload) => emit(req, event, payload));
  const studentStatus = await recomputeStudentStatus(student._id);
  if (studentStatus.status) emit(req, 'student_updated', { studentId: student._id.toString(), status: studentStatus.status });
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
  const qrCode = req.body?.qrCode ? String(req.body.qrCode).trim() : '';
  if (!qrCode) throw new AppError('Código QR obligatorio', 400, 'REQUIRED', 'Escribe o escanea el código QR de un carné');
  const student = await Student.findOne({ qrCode });
  if (!student) throw new AppError('No se encontró estudiante con ese código QR', 404, 'NOT_FOUND', 'El código QR no corresponde a un estudiante registrado; verifica el carné escaneado');
  const existingToday = await Attendance.findOne({ studentId: student._id, date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } });
  if (existingToday) {
    throw new AppError('Asistencia ya registrada hoy para este estudiante', 409, 'ALREADY_REGISTERED', 'Este carné ya tiene asistencia registrada para hoy; revisa el panel de asistencia');
  }
  const attendance = await Attendance.create({
    studentId: student._id,
    section: student.section,
    status: 'Presente'
  });
  const { stats, alerts } = await checkAttendanceAlerts(student._id, (event, payload) => emit(req, event, payload));
  const studentStatus = await recomputeStudentStatus(student._id);
  if (studentStatus.status) emit(req, 'student_updated', { studentId: student._id.toString(), status: studentStatus.status });
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

export const update = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) throw new AppError('Registro de asistencia no encontrado', 404, 'NOT_FOUND', 'No existe un registro de asistencia con ese id');
  if (req.user?.role === 'Docente') {
    const inScope = await isStudentInDocenteScope(req.user, attendance.studentId);
    if (!inScope) throw new AppError('Acceso denegado: registro fuera de tu alcance', 403, 'FORBIDDEN', 'Solo puedes editar registros de tus estudiantes');
  }
  if (req.body.status) {
    if (!['Presente', 'Ausente', 'Justificado'].includes(req.body.status)) {
      throw new AppError('Estado de asistencia inválido', 400, 'INVALID_STATUS', 'Usa Presente, Ausente o Justificado');
    }
    attendance.status = req.body.status;
  }
  if (req.body.date) attendance.date = new Date(req.body.date);
  await attendance.save();
  const { stats } = await checkAttendanceAlerts(attendance.studentId, (event, payload) => emit(req, event, payload));
  const student = await Student.findById(attendance.studentId);
  const studentStatus = await recomputeStudentStatus(attendance.studentId);
  if (studentStatus.status) emit(req, 'student_updated', { studentId: attendance.studentId.toString(), status: studentStatus.status });
  res.json({ ok: true, attendance: toPublic(attendance), stats });
});

export const list = asyncHandler(async (req, res) => {
  const { studentId, section, date } = req.query;
  const query = await scopeStudents(req.user, {});
  if (studentId) query.studentId = studentId;
  if (section) query.section = section;
  if (date) query.date = new Date(date);
  const data = await Attendance.find(query).sort({ date: -1, _id: -1 });
  res.json({ ok: true, data: data.map(toPublic) });
});

export const getOne = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) throw new AppError('Registro de asistencia no encontrado', 404, 'NOT_FOUND', 'No existe un registro de asistencia con ese id');
  if (req.user?.role === 'Docente') {
    const inScope = await isStudentInDocenteScope(req.user, attendance.studentId);
    if (!inScope) throw new AppError('Acceso denegado: registro fuera de tu alcance', 403, 'FORBIDDEN', 'Solo puedes ver registros de tus estudiantes');
  }
  res.json({ ok: true, attendance: toPublic(attendance) });
});

export const porcentaje = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId;
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  if (req.user?.role === 'Docente') {
    const inScope = await isStudentInDocenteScope(req.user, student._id);
    if (!inScope) throw new AppError('Acceso denegado: estudiante fuera de tu alcance', 403, 'FORBIDDEN', 'Solo puedes ver el porcentaje de tus estudiantes');
  }
  const stats = await attendanceStats(student._id);
  res.json({ ok: true, studentId: studentId.toString(), ...stats });
});
