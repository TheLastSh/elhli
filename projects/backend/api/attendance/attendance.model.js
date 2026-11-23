import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'studentId es obligatorio']
  },
  date: {
    type: Date,
    required: [true, 'Fecha de asistencia obligatoria'],
    default: Date.now
  },
  section: {
    type: String,
    enum: ['IA-1', 'IA-2', 'SIST-1'],
    default: 'IA-1'
  },
  status: {
    type: String,
    enum: ['Presente', 'Ausente', 'Justificado'],
    required: [true, 'Estado de asistencia obligatorio']
  }
}, { timestamps: true });

attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index('section');

// Calculadora pura de porcentaje de inasistencias (Business_Rules.md §3)
export const calculateAttendanceStats = (items) => {
  const total = items.length;
  const ausentes = items.filter((a) => a.status === 'Ausente').length;
  const presentes = items.filter((a) => a.status === 'Presente').length;
  const justificados = items.filter((a) => a.status === 'Justificado').length;
  const porcentajeInasistencias = total ? (ausentes / total) * 100 : 0;
  return { total, ausentes, presentes, justificados, porcentajeInasistencias };
};

export default mongoose.model('Attendance', attendanceSchema);
