import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: [true, 'El email es obligatorio'],
    trim: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash obligatorio']
  },
  role: {
    type: String,
    enum: ['Docente', 'Estudiante', 'Coordinador', 'Admin'],
    default: 'Docente'
  },
  fullName: {
    type: String,
    required: [true, 'Nombre obligatorio'],
    trim: true
  },
  ci: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    sparse: true
  },
  refreshTokenHash: { type: String, sparse: true },
  lastLoginAt: { type: Date, select: false },
  tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
