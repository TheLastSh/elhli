import jwt from 'jsonwebtoken';
import User from '../api/users/user.model.js';
import { AppError } from '../helpers/appError.js';

const env = (k, d) => process.env[k] || d;

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    throw new AppError('Autenticación requerida', 401, 'UNAUTHORIZED', 'Inicia sesión para acceder a esta opción');
  }
  let payload;
  try {
    payload = jwt.verify(token, env('JWT_SECRET', 'educoro-secret'));
  } catch (err) {
    throw new AppError('Token inválido o expirado', 401, 'UNAUTHORIZED', 'Debes volver a iniciar sesión');
  }
  const user = await User.findById(payload.id).lean();
  if (!user) {
    throw new AppError('Usuario no encontrado', 401, 'UNAUTHORIZED', 'Debes volver a iniciar sesión');
  }
  if ((user.tokenVersion ?? 0) !== (payload.tokenVersion ?? 0)) {
    throw new AppError('Token invalidado', 401, 'UNAUTHORIZED', 'Debes volver a iniciar sesión');
  }
  req.user = { ...payload, ...user, passwordHash: undefined };
  next();
};

export default authenticate;
