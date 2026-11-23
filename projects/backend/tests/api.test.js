import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import mongoose from 'mongoose';
import WebServer from '../bin/server.js';
import User from '../api/users/user.model.js';
import Student from '../api/students/student.model.js';
import Grade from '../api/grades/grade.model.js';
import Attendance from '../api/attendance/attendance.model.js';
import Course from '../api/courses/course.model.js';
import { hashPassword } from '../helpers/jwt.js';

const TEST_DB = 'mongodb://127.0.0.1:27017/educoro_ai_test';

process.env.MONGO_URI = TEST_DB;
process.env.NODE_ENV = 'test';
const app = new WebServer().app;

let token = '';

test.before(async () => {
  await new Promise((resolve) => {
    const iv = setInterval(() => {
      if (mongoose.connection.readyState === 1) {
        clearInterval(iv);
        resolve();
      }
    }, 100);
    setTimeout(() => { clearInterval(iv); resolve(); }, 10000);
  });
  await Promise.all([
    Student.deleteMany({}).exec(),
    Grade.deleteMany({}).exec(),
    Attendance.deleteMany({}).exec(),
    Course.deleteMany({}).exec(),
    User.deleteMany({}).exec()
  ]);
  const user = await User.create({
    email: 'coord@educoro.ai',
    passwordHash: await hashPassword('educoropass'),
    role: 'Coordinador',
    fullName: 'Coordinador Test'
  });
  assert.strictEqual(user.role, 'Coordinador');
  const res = await request(app).post('/api/users/login').send({ email: 'coord@educoro.ai', password: 'educoropass' });
  assert.strictEqual(res.status, 200, 'login no funcionó en tests');
  assert.ok(res.body.accessToken);
  token = res.body.accessToken;
});

test.after(async () => {
  await Promise.all([Student.deleteMany({}).exec(), Grade.deleteMany({}).exec(), Attendance.deleteMany({}).exec(), Course.deleteMany({}).exec(), User.deleteMany({}).exec()]);
  await mongoose.disconnect();
});

const authed = {
  post: (path) => request(app).post(path).set('Authorization', `Bearer ${token}`),
  get: (path) => request(app).get(path).set('Authorization', `Bearer ${token}`),
  put: (path) => request(app).put(path).set('Authorization', `Bearer ${token}`),
  delete: (path) => request(app).delete(path).set('Authorization', `Bearer ${token}`)
};

test('validación de estudiantes (CI V/E, email, sección)', async () => {
  const res = await authed.post('/api/students').send({ ci: 'BAD-CI', fullName: 'Bad', email: 'bad' });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.ok, false);

  const dup = await authed.post('/api/students').send({ ci: 'V-99999999', fullName: 'Duplicado', email: 'duplicado@educoro.ai' });
  assert.strictEqual(dup.status, 201);
  const res2 = await authed.post('/api/students').send({ ci: 'V-99999999', fullName: 'Duplicado', email: 'duplicado@educoro.ai' });
  assert.strictEqual(res2.status, 409);
  assert.strictEqual(res2.body.code, 'DUPLICATE_FOUND');
});

test('CRUD de students (create/list/get/update/delete)', async () => {
  let res = await authed.post('/api/students').send({ ci: 'V-12345678', fullName: 'Test Student', email: 'test@educoro.ai', section: 'IA-1' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.ok, true);
  const sid = res.body.student._id;

  res = await authed.get('/api/students').query({ section: 'IA-1' });
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.data.some((s) => s.ci === 'V-12345678'));

  res = await authed.get(`/api/students/${sid}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.student.fullName, 'Test Student');

  res = await authed.put(`/api/students/${sid}`).send({ status: 'Retirado' });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.student.status, 'Retirado');

  res = await authed.delete(`/api/students/${sid}`);
  assert.strictEqual(res.status, 200);
  res = await authed.get(`/api/students/${sid}`);
  assert.strictEqual(res.status, 404);
});

test('registro de calificaciones y ponderación 30/35/35', async () => {
  const student = await Student.create({ ci: 'V-98765432', fullName: 'Graded Student', email: 'graded@educoro.ai', section: 'IA-2' });
  const res = await authed.post('/api/grades').send({ studentId: student._id, subject: 'Inteligencia Artificial', cut1: 18, cut2: 10, cut3: 10 });
  assert.strictEqual(res.status, 201, JSON.stringify(res.body));
  assert.ok(Math.abs(res.body.grade.finalGrade - 12.4) < 0.001, `finalGrade inválido: ${res.body.grade.finalGrade}`);

  const promedio = await authed.get(`/api/grades/${student._id}/promedio`);
  assert.strictEqual(promedio.status, 200);
  assert.ok(Math.abs(promedio.body.info.promedioGeneral - 12.4) < 0.001);

  const inv = await authed.post('/api/grades').send({ studentId: student._id, subject: 'IA', cut1: 25, cut2: 10, cut3: 10 });
  assert.strictEqual(inv.status, 400);
});

test('registro de asistencia, estadísticas y riesgo por inasistencias', async () => {
  const student = await Student.create({ ci: 'V-55555678', fullName: 'Att Student', email: 'att@educoro.ai', qrCode: 'QR-ATT-001' });

  const missing = await authed.post('/api/attendance').send({ studentId: new mongoose.Types.ObjectId(), status: 'Ausente' });
  assert.strictEqual(missing.status, 404);

  const scan = await authed.post('/api/attendance/scan').send({ qrCode: 'QR-ATT-001' });
  assert.strictEqual(scan.status, 201, JSON.stringify(scan.body));
  assert.strictEqual(scan.body.attendance.status, 'Presente');

  const stats = await authed.get(`/api/attendance/estudiante/${student._id}/porcentaje`);
  assert.strictEqual(stats.status, 200);
  assert.strictEqual(stats.body.porcentajeInasistencias, 0);

  const list = await authed.get('/api/attendance').query({ studentId: student._id });
  assert.strictEqual(list.status, 200);
  assert.ok(list.body.data.length >= 1);
});

test('reportes: estadísticas y boletín', async () => {
  const student = await Student.create({ ci: 'V-87654321', fullName: 'Report Student', email: 'report@educoro.ai', section: 'SIST-1' });
  const est = await authed.get(`/api/reports/students/${student._id}/estadisticas`);
  assert.strictEqual(est.status, 200);
  assert.strictEqual(est.body.ok, true);
  assert.strictEqual(est.body.student.fullName, 'Report Student');

  const notFound = await authed.get('/api/reports/students/000000000000000000000000/estadisticas');
  assert.strictEqual(notFound.status, 404);
});

test('404 JSON para rutas desconocidas', async () => {
  const res = await authed.get('/api/nope');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.ok, false);
  assert.match(res.body.message, /Ruta no encontrada/);
});

test('auth: login adaptativo por email y registro de refresh/logout/me', async () => {
  const loginRes = await request(app).post('/api/users/login').send({ email: 'coord@educoro.ai', password: 'educoropass' });
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginRes.body.user.email, 'coord@educoro.ai');

  const me = await request(app).get('/api/users/me').set('Authorization', `Bearer ${loginRes.body.accessToken}`);
  assert.strictEqual(me.status, 200);
  assert.strictEqual(me.body.user.role, 'Coordinador');

  const logout = await request(app).post('/api/users/logout').set('Authorization', `Bearer ${loginRes.body.accessToken}`);
  assert.strictEqual(logout.status, 200);
  assert.strictEqual(logout.body.ok, true);
});

test('sistema: GET /api/system/overview (autenticado, Coordinador)', async () => {
  const res = await authed.get('/api/system/overview');
  assert.strictEqual(res.status, 200, JSON.stringify(res.body));
  assert.strictEqual(res.body.ok, true);
  assert.ok(res.body.timestamp);
  assert.ok(['conectada', 'desconectada'].includes(res.body.db.state));
  assert.ok(typeof res.body.api.uptimeSeconds === 'number');
  assert.ok(typeof res.body.realtime.socketsConnected === 'number');
  assert.strictEqual(typeof res.body.metrics.totalStudents, 'number');
  assert.ok(res.body.metrics.averageFinalGrade === null || typeof res.body.metrics.averageFinalGrade === 'number');
  assert.ok(Array.isArray(res.body.recentAlerts));
});

test('sistema: GET /api/system/overview requiere autenticación', async () => {
  const res = await request(app).get('/api/system/overview');
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.ok, false);
});
