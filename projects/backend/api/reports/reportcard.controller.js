import { AppError } from '../../helpers/appError.js';
import { asyncHandler } from '../../helpers/asyncHandler.js';
import { buildBoletinPDF } from '../../helpers/pdf-reportcard.js';
import Student from '../students/student.model.js';
import Grade from '../grades/grade.model.js';
import Attendance from '../attendance/attendance.model.js';

const sanitizeName = (name) => String(name).replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

export const boletin = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  const pdf = await buildBoletinPDF(student._id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="boletin-${sanitizeName(student.fullName)}-${student.ci.replace(/\W/g, '')}.pdf"`);
  res.send(pdf);
});

export const estadisticas = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new AppError('Estudiante no encontrado', 404, 'NOT_FOUND', 'No existe un estudiante con ese id');
  const grades = await Grade.find({ studentId: student._id });
  const attendanceItems = await Attendance.find({ studentId: student._id });
  const total = attendanceItems.length;
  const ausentes = attendanceItems.filter((a) => a.status === 'Ausente').length;
  const justificados = attendanceItems.filter((a) => a.status === 'Justificado').length;
  const presentes = attendanceItems.filter((a) => a.status === 'Presente').length;
  const porcentajeInasistencias = total ? (ausentes / total) * 100 : 0;
  const promedio = grades.length ? grades.reduce((s, g) => s + (g.finalGrade || 0), 0) / grades.length : 0;
  res.json({
    ok: true,
    student: { fullName: student.fullName, ci: student.ci, section: student.section, status: student.status },
    grades: grades.map((g) => ({ subject: g.subject, cut1: g.cut1, cut2: g.cut2, cut3: g.cut3, finalGrade: g.finalGrade })),
    promedioGeneral: promedio,
    porcentajeInasistencias,
    attendance: { total, presentes, ausentes, justificados },
    alerts: [
      ...(porcentajeInasistencias > 25 ? [{ type: 'reprobado_por_inasistencia', porcentaje: porcentajeInasistencias }] : []),
      ...(porcentajeInasistencias > 20 ? [{ type: 'alerta_preventiva_inasistencia', porcentaje: porcentajeInasistencias }] : [])
    ]
  });
});
