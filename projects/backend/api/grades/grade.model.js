import mongoose from 'mongoose';

// Calculadora pura de la ponderación (Business_Rules.md §1: 30% - 35% - 35%)
export const calculateFinalGrade = (cut1, cut2, cut3) => {
  if (typeof cut1 !== 'number' || typeof cut2 !== 'number' || typeof cut3 !== 'number') return null;
  return cut1 * 0.30 + cut2 * 0.35 + cut3 * 0.35;
};

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
    default: 0
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
