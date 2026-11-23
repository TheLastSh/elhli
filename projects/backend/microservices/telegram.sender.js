// microservices/telegram.sender.js — Envía mensajes por Telegram (fetch nativo)
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;

const chats = new Set();

export const registerChat = (chatId) => {
  if (chatId) chats.add(String(chatId));
};

export const sendAlert = async (text) => {
  for (const chatId of chats) {
    try {
      const res = await fetch(`${API}/sendMessage?chat_id=${encodeURIComponent(chatId)}&text=${encodeURIComponent(text)}&parse_mode=Markdown`);
      if (!res.ok) console.log('[TELEGRAM] Estado:', res.status);
    } catch (err) {
      console.error('[TELEGRAM] Error envío alerta:', err.message);
    }
  }
};
