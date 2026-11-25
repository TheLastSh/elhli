import mongoose from 'mongoose';

import { calculateFinalGrade } from '../../helpers/businessRules.js';
export { calculateFinalGrade };

const gradeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'studentId es obligatorio']
  },
  subject: {
    type: String,
    required: [true, 'El nombre del curso es obligatorio']
  },
  cut1: {
    type: Number,
    min: 0,
    max: 20
  },
  cut2: {
    type: Number,
    min: 0,
    max: 20
  },
  cut3: {
    type: Number,
    min: 0,
    max: 20
  },
  finalGrade: {
    type: Number,
    min: 0,
    max: 20,
    default: null
  }
}, { timestamps: true });

// Validación de ponderación y cálculo del final (Business_Rules.md §1, §2)
gradeSchema.pre('save', async function () {
  if (typeof this.cut1 !== 'number' || typeof this.cut2 !== 'number' || typeof this.cut3 !== 'number') {
    return;
  }
  this.finalGrade = calculateFinalGrade(this.cut1, this.cut2, this.cut3);
});

export default mongoose.model('Grade', gradeSchema);
