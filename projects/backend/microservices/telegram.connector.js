// microservices/telegram.connector.js — Bot de Telegram para Consultas de EduCoro AI
// Usa fetch nativo (sin dependencias extra). Token: TELEGRAM_BOT_TOKEN en .env
// Usa fetch global de Node.js (sin import). Token: TELEGRAM_BOT_TOKEN en .env

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;

// Map de chatId -> usuario vinculado (se persiste en próxima versión via Mongo)
const linked = new Map();
const replied = new Set();

const api = async (path, params) => {
  const res = await fetch(`${API}/${path}?${new URLSearchParams(params)}`);
  return res.json();
};

const sendMessage = (chatId, text) => api('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown' });

const loginUser = async (emailOrCi) => {
  const res = await fetch('http://localhost:3500/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailOrCi, password: process.env.COORDINATOR_PASSWORD || 'changeme-123' })
  });
  const body = await res.json();
  return body;
};

const handleCommand = async (chatId, cmd, args) => {
  const vinculado = linked.get(chatId);
  const login = (token) => token;

  switch (cmd) {
    case '/vincular': {
      // /vincular <email> — vincula el chat con credenciales
      const res = await loginUser(args || '');
      if (res.accessToken) {
        linked.set(chatId, res.user);
        const { registerChat } = await import('./telegram.sender.js');
        registerChat(chatId);
        await sendMessage(chatId, '✅ Vinculado. Usa /notas, /promedio, /asistencia o /alertas');
      } else {
        await sendMessage(chatId, '❌ Credenciales no válidas. Verifica email y contraseña (o usa CI).');
      }
      return;
    }

    case '/alertas': {
      if (!vinculado) { await sendMessage(chatId, '❌ Primero únete con /vincular.'); return; }
      // Alertas del último día
      const since = new Date(Date.now() - 86400000);
      const { default: Alert } = await import('../api/alerts/alert.model.js');
      const alerts = await Alert.find({ userId: vinculado._id, createdAt: { $gte: since } }).sort({ createdAt: -1 });
      if (!alerts.length) { await sendMessage(chatId, '✅ No hay alertas nuevas en la última 24h.'); return; }
      for (const a of alerts) await sendMessage(chatId, `⚠️ ${a.message}`);
      return;
    }

    default:
      if (!vinculado) { await sendMessage(chatId, '❌ Usa /vincular <email> para vincular tu cuenta.'); return; }
      await sendMessage(chatId, '🤖 EduCoro AI: selecciona un comando: /notas /promedio /asistencia /alertas /vincular');
  }
};

const handleMessage = async (msg) => {
  const chatId = msg.chat.id;
  const vinculado = linked.get(chatId);
  const userId = vinculado?._id;
  const cmd = (msg.text || '').split(' ')[0]?.toLowerCase() || '';
  const args = (msg.text || '').slice(cmd.length).trim();
  const { default: Student } = await import('../api/students/student.model.js');
  const { default: Grade } = await import('../api/grades/grade.model.js');
  const { default: Attendance } = await import('../api/attendance/attendance.model.js');

  const studentByCi = async () => (args ? await Student.findOne({ ci: args }) : null);

  if (cmd === '/notas') {
    const student = (vinculado?.studentId ? await Student.findById(vinculado.studentId) : undefined) || await studentByCi();
    if (!student) { await sendMessage(chatId, `📭 No se encontró estudiante. Vinculación: ${vinculado ? 'busca tu CI' : 'ninguna'}.`); return; }
    const grades = await Grade.find({ studentId: student._id }).sort({ subject: 1 });
    const lines = grades.map((g) => `📌 ${g.subject}\nC1: ${g.cut1 ?? '-'} | C2: ${g.cut2 ?? '-'} | C3: ${g.cut3 ?? '-'} | Final: ${g.finalGrade?.toFixed(2)}`);
    await sendMessage(chatId, `📋 Notas de ${student.fullName}\n${lines.join('\n')}`);
  } else if (cmd === '/promedio') {
    const student = (vinculado?.studentId ? await Student.findById(vinculado.studentId) : undefined) || await studentByCi();
    if (!student) { await sendMessage(chatId, '📭 No se encontró estudiante.'); return; }
    const grades = await Grade.find({ studentId: student._id });
    const promedio = grades.length ? (grades.reduce((s, g) => s + (g.finalGrade || 0), 0) / grades.length).toFixed(2) : 'N/A';
    await sendMessage(chatId, `📊 Promedio de ${student.fullName}: *${promedio}* ${student.status === 'En Riesgo' ? '(⚠️ En Riesgo)' : ''}`);
  } else if (cmd === '/asistencia') {
    const student = (vinculado?.studentId ? await Student.findById(vinculado.studentId) : undefined) || await studentByCi();
    if (!student) { await sendMessage(chatId, '📭 No se encontró estudiante.'); return; }
    const { attendanceStats } = await import('../api/attendance/attendance.controller.js');
    const stats = await attendanceStats(student._id);
    const total = stats.presentes + stats.ausentes + stats.justificados;
    const asist = total ? Math.round(((stats.presentes + stats.justificados) / total) * 100) : 0;
    await sendMessage(chatId, `📅 Asistencias de ${student.fullName}: ${asist}% (${stats.presentes}P/${stats.ausentes}A/${stats.justificados}J)`);
  } else {
    await handleCommand(chatId, cmd, args);
  }
};

export const startTelegramConnector = async () => {
  console.log('🤖 Telegram connector iniciado');
  let offset = 0;
  const poll = async () => {
    try {
      const res = await api('getUpdates', { offset, timeout: '10', allowed_updates: 'message' });
      if (res.result?.length) {
        for (const u of res.result) {
          offset = u.update_id + 1;
          if (u.message) await handleMessage(u.message);
        }
      }
    } catch (err) {
      console.error('[TELEGRAM] Error:', err.message);
    }
    setTimeout(poll, 2500);
  };
  setTimeout(poll, 2500);
};
