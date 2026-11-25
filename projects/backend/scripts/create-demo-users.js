// Crea usuarios de práctica para visualizar tipos de rol (Docente y Estudiante).
const base = process.env.API_BASE || 'http://localhost:3500';

const login = async (email, password) => (await fetch(base + '/api/users/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
})).json();
const get = async (token, path) => fetch(base + path, { headers: { Authorization: 'Bearer ' + token } }).then((r) => r.json());
const post = async (token, path, body) => fetch(base + path, {
  method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
}).then(async (r) => ({ status: r.status, ok: (await r.json()).ok }));

(async () => {
  const coordinator = await login('coordinador@educoro.ai', 'changeme-123');
  const token = coordinator.accessToken;
  const students = await get(token, '/api/students?q=V-12345678');
  const studentId = students.data?.[0]?._id;
  const users = [
    { email: 'docente.practica@educoro.ai', password: 'Practica123', fullName: 'Docente de Práctica', role: 'Docente' },
    { email: 'estudiante.practica@educoro.ai', password: 'Practica123', fullName: 'Estudiante de Práctica', role: 'Estudiante', studentId }
  ];
  for (const u of users) {
    const r = await post(token, '/api/users', u);
    console.log('created:', u.email, 'status', r.status, 'ok', r.ok);
  }
  console.log('studentId used:', studentId);
  const docente = await login('docente.practica@educoro.ai', 'Practica123');
  const estud = await login('estudiante.practica@educoro.ai', 'Practica123');
  console.log('login docente:', docente.ok, docente.user?.role);
  console.log('login estudiante:', estud.ok, estud.user?.role, estud.user?.studentId);
})().catch((e) => { console.error('ERR', e); process.exit(1); });
