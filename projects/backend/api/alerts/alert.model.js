import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', sparse: true },
  type: { type: String, required: true, enum: ['riesgo_academico', 'reprobado_por_inasistencia', 'alerta_preventiva_inasistencia', 'alerta_generica'] },
  message: { type: String, required: true },
  severity: { type: String, enum: ['alerta', 'aviso', 'resolucion'], default: 'alerta' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

alertSchema.index({ createdAt: 1 });

export default mongoose.model('Alert', alertSchema);
