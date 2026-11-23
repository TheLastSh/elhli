import jwt from 'jsonwebtoken';
import { AppError } from '../helpers/appError.js';

const env = (k, d) => process.env[k] || d;

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    throw new AppError('Autenticación requerida', 401, 'UNAUTHORIZED', 'Inicia sesión para acceder a esta opción');
  }
  try {
    req.user = jwt.verify(token, env('JWT_SECRET', 'educoro-secret'));
  } catch (err) {
    throw new AppError('Token inválido o expirado', 401, 'UNAUTHORIZED', 'Debes volver a iniciar sesión');
  }
  next();
};

export default authenticate;
