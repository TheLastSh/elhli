import mongoose from 'mongoose';
import Student from '../students/student.model.js';
import Course from '../courses/course.model.js';
import Grade from '../grades/grade.model.js';
import Attendance from '../attendance/attendance.model.js';
import Alert from '../alerts/alert.model.js';
import { asyncHandler } from '../../helpers/asyncHandler.js';

const HOUR_MS = 60 * 60 * 1000;
const RECENT_ALERTS_LIMIT = 10;

// GET /api/system/overview — Vista global del sistema (Fase B)
// Retorna estado de la API, MongoDB, Socket.IO y KPIs del sistema (estudiantes, asistencia, alertas).
export const systemOverview = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const db = mongoose.connection.db;

  const [totalStudents, activeStudents, totalCourses, alertsLast24h, alertsTotal] = await Promise.all([
    Student.countDocuments().exec(),
    Student.countDocuments({ status: 'Activo' }).exec(),
    Course.countDocuments().exec(),
    Alert.countDocuments({ createdAt: { $gte: new Date(Date.now() - HOUR_MS * 24) } }).exec(),
    Alert.countDocuments().exec()
  ]);

  // Promedio final de calificaciones registradas (Business_Rules.md §1)
  const gradeRows = await Grade.find({}, 'finalGrade').lean().exec();
  const averageFinalGrade = gradeRows.length ? gradeRows.reduce((sum, g) => sum + (g.finalGrade || 0), 0) / gradeRows.length : null;

  // Asistencia global: (Presente + Justificado) / Total registrado
  const [att] = await Attendance.aggregate([
    {
      $group: {
        _id: null,
        presentes: { $sum: { $cond: [{ $eq: ['$status', 'Presente'] }, 1, 0] } },
        ausentes: { $sum: { $cond: [{ $eq: ['$status', 'Ausente'] }, 1, 0] } },
        justificados: { $sum: { $cond: [{ $eq: ['$status', 'Justificado'] }, 1, 0] } }
      }
    }
  ]).exec();

  const totalAsist = att ? att.presentes + att.ausentes + att.justificados : 0;
  const attendancePct = totalAsist ? ((att.presentes + att.justificados) / totalAsist) * 100 : 0;

  const [recentAlerts, collections] = await Promise.all([
    Alert.find().sort({ createdAt: -1 }).limit(RECENT_ALERTS_LIMIT).lean().exec(),
    db ? db.listCollections().toArray() : []
  ]);

  res.status(200).json({
    ok: true,
    timestamp: new Date(),
    api: {
      nodeVersion: process.version,
      env: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.floor(process.uptime())
    },
    db: {
      state: mongoose.connection.readyState === 1 ? 'conectada' : 'desconectada',
      collections: collections.length
    },
    realtime: {
      socketsConnected: io && io.sockets && io.sockets.sockets ? io.sockets.sockets.size : 0
    },
    metrics: {
      totalStudents,
      activeStudents,
      totalCourses,
      averageFinalGrade,
      attendancePct,
      alertsLast24h,
      alertsTotal
    },
    recentAlerts: recentAlerts.map((a) => ({
      _id: a._id ? String(a._id) : null,
      type: a.type,
      severity: a.severity,
      message: a.message,
      studentId: a.studentId ? String(a.studentId) : null,
      userId: a.userId ? String(a.userId) : null,
      createdAt: a.createdAt
    }))
  });
});
