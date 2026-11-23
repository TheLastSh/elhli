import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { AppError } from '../helpers/appError.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: () => {
    throw new AppError('Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos', 429, 'RATE_LIMIT', 'Espera unos minutos antes de volver a intentar iniciar sesión');
  }
});

export { loginLimiter };
export default loginLimiter;
