import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import mongoose from 'mongoose';
import WebServer from '../bin/server.js';
import User from '../api/users/user.model.js';
import Student from '../api/students/student.model.js';
import Grade from '../api/grades/grade.model.js';
import Attendance from '../api/attendance/attendance.model.js';
import Alert from '../api/alerts/alert.model.js';
import Course from '../api/courses/course.model.js';
import { hashPassword } from '../helpers/jwt.js';
import { saveAlertIfNew } from '../helpers/businessRules.js';

const TEST_DB = 'mongodb://127.0.0.1:27017/educoro_ai_test_rules';

process.env.MONGO_URI = TEST_DB;
process.env.NODE_ENV = 'test';
const app = new WebServer().app;

let token = '';

test.before(async () => {
  await new Promise((resolve) => {
    const iv = setInterval(() => {
      if (mongoose.connection.readyState === 1) { clearInterval(iv); resolve(); }
    }, 100);
    setTimeout(() => { clearInterval(iv); resolve(); }, 10000);
  });
  await Promise.all([Student.deleteMany({}).exec(), Grade.deleteMany({}).exec(), Attendance.deleteMany({}).exec(), Alert.deleteMany({}).exec(), Course.deleteMany({}).exec(), User.deleteMany({}).exec()]);
  const user = await User.create({
    email: 'rules@educoro.ai', passwordHash: await hashPassword('educoropass'), role: 'Coordinador', fullName: 'Rules Tester'
  });
  const res = await request(app).post('/api/users/login').send({ email: 'rules@educoro.ai', password: 'educoropass' });
  assert.strictEqual(res.status, 200, 'login no funcionó');
  token = res.body.accessToken;
});

test.after(async () => {
  await Promise.all([Student.deleteMany({}).exec(), Grade.deleteMany({}).exec(), Attendance.deleteMany({}).exec(), Alert.deleteMany({}).exec(), User.deleteMany({}).exec()]);
  await mongoose.disconnect();
});

const authed = {
  post: (path) => request(app).post(path).set('Authorization', `Bearer ${token}`),
  get: (path) => request(app).get(path).set('Authorization', `Bearer ${token}`),
};

test('Business_Rules.md §2: promedio < 10 → En Riesgo + alerta persistida; promedio ≥ 10 → Activo', async () => {
  const student = await Student.create({ ci: 'V-77777777', fullName: 'Riesgo Student', email: 'riesgo@educoro.ai', section: 'IA-1' });
  const res = await authed.post('/api/grades').send({ studentId: student._id, subject: 'Inteligencia Artificial', cut1: 9, cut2: 4, cut3: 5 });
  assert.strictEqual(res.status, 201, JSON.stringify(res.body));
  assert.ok(Math.abs(res.body.grade.finalGrade - 5.85) < 0.01, `finalGrade esperado 5.85, recibido ${res.body.grade.finalGrade}`);

  const after = await Student.findById(student._id);
  assert.strictEqual(after.status, 'En Riesgo');
  const alerts = await Alert.find({ studentId: student._id });
  assert.ok(alerts.some((a) => a.type === 'riesgo_academico' && a.message && a.message.length > 0), 'la alerta de riesgo debe persistirse con mensaje');

  const up = await authed.post('/api/grades').send({ studentId: student._id, subject: 'IA-II', cut1: 20, cut2: 20, cut3: 20 });
  assert.strictEqual(up.status, 201);
  const after2 = await Student.findById(student._id);
  assert.strictEqual(after2.status, 'Activo', 'el promedio pasa a 20/20 → debe revertirse a Activo');
});

test('Business_Rules.md §3: alerta preventiva >20% (+>25% → Reprobado) y QR duplicado 409', async () => {
  const student = await Student.create({ ci: 'V-77777778', fullName: 'Ausente Student', email: 'ausente@educoro.ai', qrCode: 'QR-DUP-001' });
  await Attendance.deleteMany({ studentId: student._id }).exec();
  // 4 Ausente + 12 Presente → 25% (caso límite, no reprobado), scan suma un Presente → ~23.5% (still preventiva)
  const daysAgo = (n) => new Date(Date.now() - (n * 86400000) - 3600000); // n días más 1h, siempre fuera del "hoy"
  const items = [
    ...Array.from({ length: 4 }, (_, i) => ({ studentId: student._id, status: 'Ausente', date: daysAgo(2 + i) })),
    ...Array.from({ length: 12 }, (_, i) => ({ studentId: student._id, status: 'Presente', date: daysAgo(10 + i) }))
  ];
  await Attendance.create(items);

  const scan1 = await authed.post('/api/attendance/scan').send({ qrCode: 'QR-DUP-001' });
  assert.strictEqual(scan1.status, 201, JSON.stringify(scan1.body));
  const scan2 = await authed.post('/api/attendance/scan').send({ qrCode: 'QR-DUP-001' });
  assert.strictEqual(scan2.status, 409, 'duplicado de QR del mismo día debe devolver 409');
  assert.strictEqual(scan2.body.code, 'ALREADY_REGISTERED');

  const alerts = await Alert.find({ studentId: student._id, type: 'alerta_preventiva_inasistencia' });
  assert.ok(alerts.length >= 1, 'alerta preventiva debe persistirse');
  const studentAfter = await Student.findById(student._id);
  assert.strictEqual(studentAfter.status, 'Activo');
});

test('Business_Rules.md §3: > 25% de inasistencias → Reprobado', async () => {
  const student = await Student.create({ ci: 'V-77777778a', fullName: 'Ausente Student 2', email: 'ausente2@educoro.ai', qrCode: 'QR-DUP-002' });
  await Attendance.deleteMany({ studentId: student._id }).exec();
  const daysAgo = (n) => new Date(Date.now() - (n * 86400000) - 3600000);
  await Attendance.create(
    Array.from({ length: 3 }, (_, i) => ({ studentId: student._id, status: 'Ausente', date: daysAgo(3 + i) }))
  );
  const s1 = await authed.post('/api/attendance/scan').send({ qrCode: 'QR-DUP-002' });
  assert.strictEqual(s1.status, 201, JSON.stringify(s1.body));
  const status = await Student.findById(student._id);
  assert.strictEqual(status.status, 'Reprobado', `con 3 ausentes / 4 total = 75% se espera Reprobado, recibido ${status.status}`);
  const repAlerts = await Alert.find({ studentId: student._id, type: 'reprobado_por_inasistencia' });
  assert.ok(repAlerts.length >= 1, 'la alerta de reprobación debe persistirse');
});

test('saveAlertIfNew: dedupa alertas por día', async () => {
  const student = await Student.create({ ci: 'V-77777779', fullName: 'Dedupe Student', email: 'dedupe@educoro.ai' });
  const alert = { type: 'riesgo_academico', severity: 'alerta', message: 'Test dedupe', studentId: student._id.toString(), at: new Date() };
  const d1 = await saveAlertIfNew(Alert, alert);
  const d2 = await saveAlertIfNew(Alert, alert);
  assert.ok(d1 && d2 === null, 'segunda alerta igual dentro del mismo día debe ser nula');
});
