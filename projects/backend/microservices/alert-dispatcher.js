// microservices/alert-dispatcher.js — Dispatcher de alertas para Telegram y email previo
// Polls los estudiantes con riesgo y notifica cada N horas
import Alert from '../api/alerts/alert.model.js';
import Student from '../api/students/student.model.js';
import Grade from '../api/grades/grade.model.js';
import Attendance from '../api/attendance/attendance.model.js';
import { sendAlert } from './telegram.sender.js';

const RISK_STATES = ['En Riesgo', 'Reprobado'];

const pollRiskAlerts = async () => {
  const students = await Student.find({ status: { $in: RISK_STATES }, lastAlertSent: { $lt: new Date(Date.now() - 24 * 3600 * 1000) } });
  for (const s of students) {
    const grades = await Grade.find({ studentId: s._id }).sort({ createdAt: -1 });
    const promedio = grades.length ? grades[0].finalGrade : null;
    const alert = new Alert({
      userId: s.studentId || null,
      type: 'riesgo_academico',
      message: `⚠️ Riesgo académico: ${s.fullName} — promedio ${(promedio ?? 0).toFixed(2)}/20`,
      studentId: s._id,
      severity: 'alerta'
    });
    await alert.save();
    s.lastAlertSent = new Date();
    await s.save();
    await sendAlert(alert.message);
  }
};

const startAlertDispatcher = async () => {
  console.log('🔔 Alert dispatcher iniciado');
  setTimeout(pollRiskAlerts, 30 * 1000);
  setInterval(pollRiskAlerts, 6 * 60 * 60 * 1000);
};

export default startAlertDispatcher;
