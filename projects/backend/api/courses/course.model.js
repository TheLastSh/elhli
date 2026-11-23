import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'El nombre del curso es obligatorio'],
    trim: true
  },
  section: {
    type: String,
    enum: ['IA-1', 'IA-2', 'SIST-1'],
    default: 'IA-1'
  },
  professorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }]
}, { timestamps: true });

courseSchema.index('section', { partialFilterExpression: { section: { $exists: true } } });
courseSchema.index({ subject: 1, section: 1 });

export default mongoose.model('Course', courseSchema);
