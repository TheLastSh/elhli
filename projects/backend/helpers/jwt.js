import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const env = (k, d) => process.env[k] || d;

const generateAccessToken = (payload) =>
  jwt.sign(payload, env('JWT_SECRET', 'educoro-secret'), { expiresIn: env('JWT_EXPIRES_IN', '1d') });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, `${env('JWT_SECRET', 'educoro-secret')}:refresh`, {
    expiresIn: env('JWT_REFRESH_EXPIRES_IN', '7d')
  });

const hashPassword = (pwd) => bcrypt.hash(pwd, 10);
const comparePassword = (pwd, hash) => bcrypt.compare(pwd, hash);

export { generateAccessToken, generateRefreshToken, hashPassword, comparePassword };
