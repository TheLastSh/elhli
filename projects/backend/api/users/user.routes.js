import { Router } from 'express';
import { check } from 'express-validator';
import { loginLimiter } from '../../middlewares/rateLimit.middleware.js';
import { validateRules } from '../../middlewares/validate.middleware.js';
import authenticate from '../../middlewares/auth.middleware.js';
import { permit } from '../../middlewares/role.middleware.js';
import * as controller from './user.controller.js';

const router = Router();

const loginRules = [
  check('email').notEmpty().isEmail().withMessage('Formato de email inválido'),
  check('password').notEmpty().withMessage('La contraseña es obligatoria')
];

router.post('/login', loginLimiter, loginRules, controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.me);

const userRules = [
  check('email').notEmpty().isEmail().withMessage('Formato de email inválido'),
  check('password').isLength({ min: 6, max: 128 }).withMessage('La contraseña debe tener entre 6 y 128 caracteres'),
  check('fullName').notEmpty().withMessage('El nombre completo es obligatorio'),
  check('role').optional().isIn(['Docente', 'Estudiante', 'Coordinador']).withMessage('Rol debe ser Docente, Estudiante o Coordinador')
];

router.post('/', authenticate, permit('Coordinador'), userRules, controller.create);

export default router;
