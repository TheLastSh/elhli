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

  const refreshToken = generateRefreshToken({ id: user._id, email: user.email, role: user.role, studentId: user.studentId });
  const refreshHash = await hashPassword(refreshToken);
  await User.updateOne({ _id: user._id }, { refreshTokenHash: refreshHash, lastLoginAt: new Date() });

  const accessToken = generateAccessToken({ id: user._id, email: user.email, role: user.role, studentId: user.studentId, tokenVersion: user.tokenVersion ?? 0 });
  res.status(200).json({ ok: true, user: toPublic(user), accessToken, refreshToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.headers.refreshtoken || req.body?.refreshToken;
  const refreshSecret = `${process.env.JWT_SECRET || 'educoro-secret'}:refresh`;
  if (!token) throw new AppError('Refresh Token requerido', 401, 'UNAUTHORIZED', 'No se envió un token de actualización');
  try {
    const userId = jwt.verify(token, refreshSecret).id;
    const user = await User.findById(userId).select('+refreshTokenHash');
    const ok = await comparePassword(token, user?.refreshTokenHash || '');
    if (!user || !ok) throw new AppError('Refresh Token inválido o expirado', 401, 'INVALID_REFRESH_TOKEN', 'Debes iniciar sesión de nuevo');
    const accessToken = generateAccessToken({ id: user._id, email: user.email, role: user.role, studentId: user.studentId, tokenVersion: user.tokenVersion ?? 0 });
    res.json({ ok: true, accessToken });
  } catch (err) {
    throw new AppError('Refresh Token inválido o expirado', 401, 'INVALID_REFRESH_TOKEN', 'Debes iniciar sesión de nuevo');
  }
});

export const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user) {
    user.refreshTokenHash = null;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // invalida access tokens que tengan jti antiguo
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

export const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, q } = req.query;
  const query = {};
  if (q) {
    const v = String(q).trim();
    query.$or = [{ email: { $regex: new RegExp(v, 'i') } }, { fullName: { $regex: new RegExp(v, 'i') } }];
  }
  const [data, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).limit(Math.min(Number(limit) || 20, 100)).skip((Number(page) - 1) * Number(limit) || 0),
    User.countDocuments(query),
  ]);
  res.json({ ok: true, users: data.map(toPublic), pagination: { page: Number(page) || 1, total, limit: Number(limit) || 20 } });
});

export const getOne = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND', 'El usuario no existe');
  res.json({ ok: true, user: toPublic(user) });
});

export const update = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { $set: { fullName: req.body.fullName, role: req.body.role, ci: req.body.ci, studentId: req.body.studentId } }, { new: true, runValidators: true });
  if (!user) throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND', 'El usuario no existe');
  // Si cambia la contraseña, debemos tener un nuevo hash (opcional para más adelante).
  res.json({ ok: true, user: toPublic(user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND', 'El usuario no existe');
  const { password } = req.body;
  if (!password || String(password).length < 6) throw new AppError('La contraseña debe tener al menos 6 caracteres', 400, 'WEAK_PASSWORD', 'Usa una contraseña más larga o mezcla letras y números');
  user.passwordHash = await hashPassword(String(password));
  await user.save();
  res.json({ ok: true, message: 'Contraseña actualizada' });
});

export const del = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND', 'El usuario no existe');
  if (user._id.toString() === (req.user?.id || '').toString()) throw new AppError('No puedes eliminarte a ti mismo', 400, 'FORBIDDEN', 'Lo gestiona antes otro usuario Coordinator');
  await user.deleteOne();
  res.json({ ok: true, message: 'Usuario eliminado' });
});
