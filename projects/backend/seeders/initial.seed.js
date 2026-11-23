import mongoose from 'mongoose';
import User from '../api/users/user.model.js';
import Student from '../api/students/student.model.js';
import Course from '../api/courses/course.model.js';
import { hashPassword } from '../helpers/jwt.js';

const COORDINATOR_EMAIL = process.env.COORDINATOR_EMAIL || 'coordinador@educoro.ai';
const COORDINATOR_PASSWORD = process.env.COORDINATOR_PASSWORD || 'changeme-123';

export const runSeeds = async () => {
  // Coordinador Institucional
  const coordinator = await User.findOneAndUpdate(
    { role: 'Coordinador', email: COORDINATOR_EMAIL },
    {
      $set: {
        passwordHash: await hashPassword(COORDINATOR_PASSWORD),
        fullName: 'Coordinador Institucional'
      }
    },
    { upsert: true, returnDocument: 'after' }
  );
  if (!coordinator) throw new Error('No se pudo crear al coordinador semilla');

  // Estudiantes de ejemplo (reglas de negocio: sección IA-1/IA-2/SIST-1)
  const studentSeeds = [
    { ci: 'V-12345678', fullName: 'Eduardo Rojas', email: 'eduardo.rojas@educoro.ai', section: 'IA-1' },
    { ci: 'V-23456789', fullName: 'Sofía Martínez', email: 'sofia.martinez@educoro.ai', section: 'IA-1' },
    { ci: 'V-34567890', fullName: 'Alexander Márquez', email: 'alex.marquez@educoro.ai', section: 'IA-2' },
    { ci: 'V-45678901', fullName: 'Camila Díaz', email: 'camila.diaz@educoro.ai', section: 'SIST-1' }
  ];
  const students = await Promise.all(studentSeeds.map(async (s) => {
    const qrCode = `QR-${s.ci.replace(/\W/g, '')}`;
    return Student.findOneAndUpdate({ ci: s.ci }, { $set: { ...s, qrCode }, $setOnInsert: { status: 'Activo' } }, { upsert: true, returnDocument: 'after' });
  }));

  // Cursos y secciones per la gestión de asignaturas
  const courseSeeds = [
    { subject: 'Inteligencia Artificial', section: 'IA-1' },
    { subject: 'Inteligencia Artificial', section: 'IA-2' },
    { subject: 'Sistemas de Información', section: 'SIST-1' }
  ];
  for (const cs of courseSeeds) {
    await Course.findOneAndUpdate({ subject: cs.subject, section: cs.section }, { $set: cs, $addToSet: { students: { $each: students.filter((s) => s.section === cs.section).map((s) => s._id) } } }, { upsert: true, returnDocument: 'after' });
  }

  return { coordinator, students };
};

// Punto de entrada para `npm run seed`
const main = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/educoro_ai');
  try {
    const result = await runSeeds();
    console.log('🌱 Seeds aplicados:', { coordinator: result.coordinator.email, estudiantes: result.students.map((s) => s.fullName) });
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((err) => {
  console.error('❌ Error al aplicar seeds:', err);
  process.exit(1);
});
