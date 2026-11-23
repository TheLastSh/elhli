import { test } from 'node:test';
import assert from 'node:assert';
import { calculateFinalGrade } from '../api/grades/grade.model.js';
import { calculateAttendanceStats } from '../api/attendance/attendance.model.js';

test('calculateFinalGrade: ponderación 30% - 35% - 35% (Business_Rules.md §1)', () => {
  const close = (a, b) => assert.ok(Math.abs(a - b) < 0.001, `esperado ${b}, recibido ${a}`);
  close(calculateFinalGrade(18, 10, 10), 12.4);
  close(calculateFinalGrade(20, 20, 20), 20);
  close(calculateFinalGrade(0, 0, 0), 0);
  close(calculateFinalGrade(5, 5, 5), 5);
  close(calculateFinalGrade(10, 8, 9), 10 * 0.3 + 8 * 0.35 + 9 * 0.35); // 8.95
  assert.strictEqual(calculateFinalGrade(null, 5, 5), null);
  close(calculateFinalGrade(9, 20, 20), 0.3 * 9 + 0.35 * 20 + 0.35 * 20);
});

test('calculateAttendanceStats: porcentaje de inasistencias (Business_Rules.md §3)', () => {
  const items = [
    { status: 'Presente' },
    { status: 'Presente' },
    { status: 'Ausente' },
    { status: 'Ausente' },
    { status: 'Justificado' }
  ];
  const s = calculateAttendanceStats(items);
  assert.strictEqual(s.total, 5);
  assert.strictEqual(s.ausentes, 2);
  assert.strictEqual(s.presentes, 2);
  assert.strictEqual(s.justificados, 1);
  assert.ok(Math.abs(s.porcentajeInasistencias - 40) < 1e-6);

  const s0 = calculateAttendanceStats([]);
  assert.strictEqual(s0.total, 0);
  assert.strictEqual(s0.porcentajeInasistencias, 0);
});
