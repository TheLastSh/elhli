# MCP_External_Connectors.md — Conectores Externos: Telegram, Webhooks, Timers

## 1. Telegram (Bot API)

### Token
- Almacenar en `.env`: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- Nunca almacenar en el repo; verificar en `.env.example` sin valores reales.

### Comandos (por estudiante)
- `/notas` → notas por corte de la última evaluación (cut1, cut2, cut3, finalGrade)
- `/promedio` → promedio general de calificaciones
- `/asistencia` → porcentaje de asistencias diarias

### Identidad
- Vincular estudiante mediante CI: `User.findOne({ ci })` → entregar solo datos si existe.
- Query matrix:
  ```javascript
  const query = {
    ci: `V-12345678`,
    role: 'Estudiante',
  };
  const result = await Student.findOne(query);
  ```

### Mensajes
- Formato: markdown (negrita para títulos).
- Usar HTML compatible con Telegram.

### Disparadores
- Limite de 5 intentos por minuto de requests a la API de Telegram.

## 2. Notificaciones Automáticas

### Eventos y Disparadores
- **Asistencia registrada:** emitir evento `attendance_registered` (Fase 2).
- **Asistencia >= 20%:** alerta preventiva (Fase 2).
- **Asistencia > 25%:** reprobación automática (Fase 2).
- **Nota guardada:** evento `grades_updated` (Fase 2).
- **Estudiante en riesgo:** alerta visual previa al publicar notas (Fase 2).

### Logica de alertas
- **Nivel 1 (visual/apertura):** acercamiento y consulta estudiantil.
- **Nivel 2 (email/copy):** alerta automatizada a parecido de notificación no capturada.

## 3. API: Webhooks

### Configuración
- Registrar callback url en servidor (ej. `n8n`, `aws lambda`, `express webhook`).
- Autenticación mediante tokens: `Bearer` y `apiKey`

### Webhook Recibido
- Responder con 200 OK siempre que los datos se procesen.
- Enviar evento a base de datos (logs).

### Validación de Webhook
- Validar campo `type` para activar lógica.

### Desactivación
- Almacenar en `.env`

## 4. Seguridad

- Tokens guardados en `.env`, nunca en el código fuente
- Usar `dotenv/config` para cargar variables
- Código en `microservices/telegram.connector.js`
