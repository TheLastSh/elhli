import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { AppError } from '../helpers/appError.js';

// Configurable para desarrollo local; defaults = 5 intentos / 15 minutos.
const LOGIN_RATE_MAX = Math.max(1, Math.floor(Number(process.env.LOGIN_RATE_MAX) || 5));
const LOGIN_RATE_WINDOW_MS = Math.max(1, Number(process.env.LOGIN_RATE_WINDOW_MS) || 15 * 60 * 1000);

const loginLimiter = rateLimit({
  windowMs: LOGIN_RATE_WINDOW_MS,
  max: LOGIN_RATE_MAX,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: () => {
    throw new AppError('Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos', 429, 'RATE_LIMIT', 'Espera unos minutos antes de volver a intentar iniciar sesión');
  }
});

export { loginLimiter };
export default loginLimiter;
