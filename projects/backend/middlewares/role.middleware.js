import { AppError } from '../helpers/appError.js';

// Roles y permisos según Business_Rules.md §4.
// Nota: Admin comparte los permisos de Coordinador (coherencia con auth.guard y login).
const permit = (...roles) => (req, res, next) => {
  const user = req.user || {};
  const allowed = roles.includes(user.role) || (roles.includes('Coordinador') && user.role === 'Admin');
  if (!user.role || !allowed) {
    throw new AppError('Rol no autorizado', 403, 'FORBIDDEN', 'Tu rol no puede acceder a esta función');
  }
  next();
};

export { permit };
export default permit;
