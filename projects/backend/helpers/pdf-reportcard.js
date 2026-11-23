import PDFDocument from 'pdfkit';
import Student from '../api/students/student.model.js';
import Grade from '../api/grades/grade.model.js';
import Attendance from '../api/attendance/attendance.model.js';

// Recoge datos y construye el boletín (Business_Rules.md §1: ponderación 30% - 35% - 35%)
export const buildBoletinPDF = async (studentId) => {
  const student = await Student.findById(studentId);
  const grades = await Grade.find({ studentId });
  const items = await Attendance.find({ studentId }).sort({ date: -1 });

  const total = items.length;
  const ausentes = items.filter((a) => a.status === 'Ausente').length;
  const presentes = items.filter((a) => a.status === 'Presente').length;
  const justificados = items.filter((a) => a.status === 'Justificado').length;
  const porcentajeInasistencias = total ? (ausentes / total) * 100 : 0;
  const promedio = grades.length
    ? grades.reduce((s, g) => s + (g.finalGrade || 0), 0) / grades.length
    : 0;

  const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 40, right: 40 } });
  const buffer = [];
  doc.on('data', (c) => buffer.push(c));

  doc.font('Helvetica-Bold').fontSize(18).text('Boletín — EduCoro AI', 40, 60);
  doc.font('Helvetica').fontSize(10).text('Servicio de Gestión Académica e Inteligencia Educativa', 40, 85, { width: 560, height: 20, align: 'left' });
  doc.moveDown(2);

  doc.font('Helvetica-Bold').fontSize(12).text('Datos del Estudiante', 40, 120);
  doc.moveDown();
  let y = 140;
  for (const [k, v] of [
    ['Nombre', student.fullName],
    ['CI', student.ci],
    ['Sección', student.section],
    ['Promedio', promedio.toFixed(2)],
    ['Asistencias (%)', porcentajeInasistencias > 0 ? `${porcentajeInasistencias.toFixed(1)}%` : 'N/A'],
    ['Estado', student.status],
    ['Alerta temprana', porcentajeInasistencias > 20 ? `>20% (${student.status})` : 'Sin alerta'],
    ['Riesgo académico', student.status === 'En Riesgo' ? 'Promedio < 10' : 'Sin riesgo'],
    ['Total asistencias', `${presentes} presentes / ${ausentes} ausentes / ${justificados} justificados`]
  ]) {
    doc.fontSize(11).text(`${k}:`, 40, y);
    doc.fontSize(11).text(String(v || ''), 150, y);
    y += 16;
  }

  doc.moveDown(3);
  doc.font('Helvetica-Bold').fontSize(11).text('Calificaciones por Corte (30% - 35% - 35%)', 40, y);
  doc.moveDown();

  const headerY = y + 20;
  doc.font('Helvetica').fontSize(10).text('Cátedra', 40, headerY);
  doc.fontSize(10).text('Corte 1', 40 + 130, headerY);
  doc.fontSize(10).text('Corte 2', 40 + 220, headerY);
  doc.fontSize(10).text('Corte 3', 40 + 310, headerY);
  doc.fontSize(10).text('Final', 40 + 400, headerY);

  let rowY = headerY + 14;
  const rows = grades
    .map((g) => ({ subject: g.subject, c1: g.cut1, c2: g.cut2, c3: g.cut3, final: g.finalGrade }))
    .sort((a, b) => a.subject.localeCompare(b.subject));

  for (const r of rows) {
    doc.font('Helvetica').fontSize(10).text(r.subject.slice(0, 22), 40, rowY);
    doc.fontSize(10).text(r.c1 != null ? r.c1.toFixed(2) : '—', 40 + 130, rowY, { width: 70, align: 'center' });
    doc.fontSize(10).text(r.c2 != null ? r.c2.toFixed(2) : '—', 40 + 220, rowY, { width: 70, align: 'center' });
    doc.fontSize(10).text(r.c3 != null ? r.c3.toFixed(2) : '—', 40 + 310, rowY, { width: 70, align: 'center' });
    doc.fontSize(10).text(r.final != null ? r.final.toFixed(2) : '—', 40 + 400, rowY, { width: 90, align: 'center' });
    rowY += 16;
  }

  doc.moveDown(3);
  doc.font('Helvetica-Bold').fontSize(11).text('Resumen', 40, rowY + 20);
  doc.moveDown();
  let ry = rowY + 40;
  for (const [k, v] of [
    ['Promedio general', promedio.toFixed(2)],
    ['Porcentaje inasistencias', porcentajeInasistencias.toFixed(1)],
    ['% de asistencias realizadas', total ? `${((presentes + justificados) / total * 100).toFixed(1)}%` : 'N/A'],
    ['Veredicto', student.status]
  ]) {
    doc.fontSize(11).text(`${k}:`, 40, ry);
    doc.fontSize(11).text(String(v), 220, ry);
    ry += 16;
  }

  doc.font('Helvetica-Bold').fontSize(8).text('EduCoro AI — Universidad Nacional Experimental Politécnica de la Fuerza Armada (UNEFA)', 40, doc.page.height - 40);

  doc.end();
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
};

export default buildBoletinPDF;
