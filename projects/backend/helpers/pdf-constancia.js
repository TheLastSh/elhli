import PDFDocument from 'pdfkit';
import Student from '../api/students/student.model.js';
import Grade from '../api/grades/grade.model.js';
import Attendance from '../api/attendance/attendance.model.js';

const lines = (doc, y, rows) => {
  let yy = y;
  for (const [k, v] of rows) {
    doc.fontSize(11).text(`${k}:`, 40, yy);
    doc.fontSize(11).text(String(v ?? ''), 130, yy);
    yy += 16;
  }
  return yy;
};

export const buildConstanciaPDF = async (studentId) => {
  const student = await Student.findById(studentId);
  if (!student) throw new Error('Estudiante no encontrado');
  const grades = await Grade.find({ studentId });
  const attendanceItems = await Attendance.find({ studentId }).sort({ date: -1 });
  const total = attendanceItems.length;
  const ausentes = attendanceItems.filter((a) => a.status === 'Ausente').length;
  const presentes = attendanceItems.filter((a) => a.status === 'Presente').length;
  const justificados = attendanceItems.filter((a) => a.status === 'Justificado').length;
  const porcentajeInasistencias = total ? (ausentes / total) * 100 : 0;

  const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 40, right: 40 } });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const finish = () => new Promise((resolve) => doc.on('end', resolve));

  doc.font('Helvetica-Bold').fontSize(18).text('Constancia', 40, 60);
  doc.font('Helvetica').fontSize(10).text('Servicio de Gestión Académica e Inteligencia Educativa', 40, 85, { width: 560, height: 20, align: 'left' });
  lines(doc, 120, [
    ['Nombre del Estudiante', student.fullName],
    ['CI', student.ci],
    ['Sección', student.section],
    ['Status Académico', student.status],
    ['Fecha de Emisión', new Date().toLocaleDateString('es-EC')],
    ['% Inasistencias', total ? `${porcentajeInasistencias.toFixed(1)}% (${ausentes} de ${total})` : '0.0% (sin registros)'],
    ['Presentes / Ausentes / Justificados', `${presentes} / ${ausentes} / ${justificados}`],
    ['Notas (Corte 1 / 2 / 3)', grades.length ? grades.map((g) => `${g.cut1 ?? '-'}/${g.cut2 ?? '-'}/${g.cut3 ?? '-'}`).join('; ') : 'Sin registros'],
    ['Final General', grades.length ? grades[0].finalGrade?.toFixed(2) : 'Sin registros']
  ]);
  doc.end();
  await finish();
  return Buffer.concat(chunks);
};
