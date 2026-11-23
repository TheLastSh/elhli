import User from './user.model.js';
import jwt from 'jsonwebtoken';
import { comparePassword, generateAccessToken, generateRefreshToken, hashPassword } from '../../helpers/jwt.js';
import { AppError } from '../../helpers/appError.js';
import { asyncHandler } from '../../helpers/asyncHandler.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { permit } from '../../middlewares/role.middleware.js';

const toPublic = (u) => ({
  _id: u._id,
  email: u.email,
  role: u.role,
  fullName: u.fullName,
  ci: u.ci,
  studentId: u.studentId,
  createdAt: u.createdAt,
  lastLoginAt: u.lastLoginAt || null
});

// Login adaptativo: intenta primero email, luego CI (validaciones per review §4)
const findUserByLogin = async (input) => {
  const value = String(input || '').trim();
  const byEmail = await User.findOne({ email: value.toLowerCase() });
  if (byEmail) return byEmail;
  return User.findOne({ ci: value.toUpperCase() });
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByLogin(email);
  if (!user) throw new AppError('Email o contraseña incorrectos', 401, 'INVALID_CREDENTIALS', 'Verifica el email y la contraseña; si usas tu CI, asegúrate de incluirlo tal como está en tu carné');
  const passwordOk = await comparePassword(password || '', user.passwordHash);
  if (!passwordOk) throw new AppError('Email o contraseña incorrectos', 401, 'INVALID_CREDENTIALS', 'Verifica el email y la contraseña');

  const refreshToken = generateRefreshToken({ id: user._id, email: user.email, role: user.role });
  const refreshHash = await hashPassword(refreshToken);
  await User.updateOne({ _id: user._id }, { refreshTokenHash: refreshHash, lastLoginAt: new Date() });

  const accessToken = generateAccessToken({ id: user._id, email: user.email, role: user.role });
  res.status(200).json({ ok: true, user: toPublic(user), accessToken, refreshToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.headers.refreshtoken || req.body?.refreshToken;
  const refreshSecret = `${process.env.JWT_SECRET || 'educoro-secret'}:refresh`;
  if (!token) throw new AppError('Refresh Token requerido', 401, 'UNAUTHORIZED', 'No se envió un token de actualización');
  try {
    const userId = jwt.verify(token, refreshSecret).id;
    const user = await User.findById(userId);
    const ok = await comparePassword(token, user?.refreshTokenHash || '');
    if (!user || !ok) throw new AppError('Refresh Token inválido o expirado', 401, 'INVALID_REFRESH_TOKEN', 'Debes iniciar sesión de nuevo');
    const accessToken = generateAccessToken({ id: user._id, email: user.email, role: user.role });
    res.json({ ok: true, accessToken });
  } catch (err) {
    throw new AppError('Refresh Token inválido o expirado', 401, 'INVALID_REFRESH_TOKEN', 'Debes iniciar sesión de nuevo');
  }
});

export const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user) {
    user.refreshTokenHash = null;
    await user.save();
  }
  res.json({ ok: true, message: 'Sesión finalizada' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND', 'El usuario no existe en EduCoro');
  res.json({ ok: true, user: toPublic(user) });
});

export const create = asyncHandler(async (req, res) => {
  const { email, password, fullName, role, ci, studentId } = req.body;
  if (!password || String(password).length < 6) throw new AppError('La contraseña debe tener al menos 6 caracteres', 400, 'WEAK_PASSWORD', 'Usa una contraseña más larga o mezcla letras y números');
  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) throw new AppError('El email ya está registrado en EduCoro', 409, 'DUPLICATE_FOUND', 'Verifica que el Docente no ya esté creado');
  const user = await User.create({
    email: String(email).trim().toLowerCase(),
    passwordHash: await hashPassword(String(password)),
    fullName: String(fullName).trim(),
    role: role || 'Docente',
    ci: ci ? String(ci).trim().toUpperCase() : undefined,
    studentId: studentId || undefined
  });
  res.status(201).json({ ok: true, user: toPublic(user) });
});
