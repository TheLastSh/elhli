// Migración (03.11.26): finalGrade = null y cuts incompletos = "no evaluado" (Business_Rules.md §1).
// Script idempotente; uso: node scripts/migrate-final-null.js [--dry-run]
import mongoose from 'mongoose';
import Grade from '../api/grades/grade.model.js';
import { calculateFinalGrade } from '../helpers/businessRules.js';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/educoro_ai');
  try {
    const docs = await Grade.find({ $or: [{ cut1: null }, { cut2: null }, { cut3: null }, { finalGrade: { $nin: [null, 0] } }] }).lean();
    const zeroWithMissing = await Grade.find({ finalGrade: 0, cut1: { $exists: true } }).lean();
    const total = docs.length + zeroWithMissing.length;
    console.log(`Notas afectadas: ${total} (${dryRun ? 'modo prueba' : 'aplicado'})`);
    if (dryRun) return;
    await Grade.updateMany({ $or: [{ cut1: null }, { cut2: null }, { cut3: null }, { finalGrade: 0 }] }, { $set: { finalGrade: null } });
    const toCalc = await Grade.find({ cut1: { $exists: true, $type: 'number' }, cut2: { $exists: true, $type: 'number' }, cut3: { $exists: true, $type: 'number' }, finalGrade: null }).lean();
    for (const g of toCalc) {
      const calc = calculateFinalGrade(g.cut1, g.cut2, g.cut3);
      await Grade.updateOne({ _id: g._id }, { $set: { finalGrade: calc } });
    }
    console.log(`Recalculadas ${toCalc.length} notas.`);
  } finally {
    await mongoose.disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
