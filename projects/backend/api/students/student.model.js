import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  ci: {
    type: String,
    unique: true,
    required: [true, 'El CI es obligatorio'],
    trim: true
  },
  fullName: {
    type: String,
    required: [true, 'El nombre completo es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'El email es obligatorio'],
    trim: true
  },
  section: {
    type: String,
    enum: ['IA-1', 'IA-2', 'SIST-1'],
    default: 'IA-1'
  },
  status: {
    type: String,
    enum: ['Activo', 'Retirado', 'En Riesgo', 'Reprobado'],
    default: 'Activo'
  },
  qrCode: { type: String, trim: true },
  lastAlertSent: { type: Date }
}, { timestamps: true });

studentSchema.index('ci', { unique: true });
studentSchema.index('email', { unique: true });

export default mongoose.model('Student', studentSchema);
