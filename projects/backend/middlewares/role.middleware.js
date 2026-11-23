import { AppError } from '../helpers/appError.js';

// Roles y permisos según Business_Rules.md §4
const permit = (...roles) => (req, res, next) => {
  const user = req.user || {};
  if (!user.role || !roles.includes(user.role)) {
    throw new AppError('Rol no autorizado', 403, 'FORBIDDEN', 'Tu rol no puede acceder a esta función');
  }
  next();
};

export { permit };
export default permit;
