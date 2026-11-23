# error_solutions.md

Registro de errores y parches aplicados.

## 26-11-23 — Incidencias de la última verificación + soluciones

1. **Test colgante** — `node --test tests/debug-attendance.test.js` tardó 6708 s (timeout) y falló login 401. El archivo ya no existe en disco ni en `git ls-files`; corrección: estandarizar `npm test` con `--test-timeout=30000` para evitar colgar futuros tests. Resultado: 11/11 pass.
2. **`npm run dev` con reinicios espurios** — `node --watch` reestaba mounts de `node_modules/*` (ej. express, mimeScore). Solución: `nodemon --ignore node_modules --ignore public --ignore logs --ignore uploads` (devDependency añadida). Log: 0 restarts.
3. **Login por CI rechazado por validador** — `check('email').isEmail()` rechazaba CI. Solución: `.custom()` validando email (regex) o CI (`^[VE]-\d{8}$`, case-insensitivo); controller ya admite login por CI. Nota: `express-validator@7` no exporta `isEmail` desde 'express-validator'.
4. **Conector Telegram roto/no-cableado** — `import fetch from 'node:fetch'` inválido; parámetros Telegram mal nombrados (`chatId`, `allowedUpdates` → `chat_id`, `allowed_updates`); `startTelegramConnector()` no se llamaba desde `listen()`. Solución: fetch global, parámetros corregidos, arranque condicional si `TELEGRAM_BOT_TOKEN`. Verificación: import del conector OK.
5. **Log de arranque engañoso** — `MongoDB: desconectada` antes de conectar (`database()` sin await). Solución: `listen()` async + `await this.database()`; `database()` idempotente. Log final verificado: `MongoDB conectado` → `Servedor ejecutándose en el puerto 3500` → `MongoDB: conectada`.
6. **Bundle JS > 500 kB (pre-existante)** — initial 698 kB (main 383 kB + styles 314 kB). Parcialmente mitigado: lazy-load de dashboards (main 685→383 kB). Residuo CSS-dominante (Bootstrap); opción futura: Bootstrap subset/CSS custom.