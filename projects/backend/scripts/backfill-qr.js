// Backfill (03.11.26): asigna QR a estudiantes que no lo tienen.
// Antes de usar: make a MongoDB dump (mongodump) if not already done.
import mongoose from 'mongoose';
import Student from '../api/students/student.model.js';

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/educoro_ai');
  try {
    const students = await Student.find({ $or: [{ qrCode: null }, { qrCode: { $in: ['', null] } }] }).lean();
    let n = 0;
    for (const s of students) {
      const qr = `QR-${String(s.ci).replace(/\W/g, '')}`;
      const updated = await Student.updateOne({ _id: s._id, qrCode: { $in: [null, ''] } }, { $set: { qrCode: qr } });
      n += updated.modifiedCount;
    }
    console.log(`Backfill QR: ${n} estudiantes actualizados.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
