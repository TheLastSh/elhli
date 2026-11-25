import { Router } from 'express';
import { check } from 'express-validator';
import { loginLimiter } from '../../middlewares/rateLimit.middleware.js';
import { validateRules } from '../../middlewares/validate.middleware.js';
import authenticate from '../../middlewares/auth.middleware.js';
import { permit } from '../../middlewares/role.middleware.js';
import * as controller from './user.controller.js';

const router = Router();

// Login: email o CI (formato V-XXXXXXXX / E-XXXXXXXX según Validations_Security_Skill.md)
// Formato de email básico + CI V/E (según Validations_Security_Skill.md)
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CI_FORMAT = /^[VE]-\d{8}$/i;

const loginRules = [
  check('email')
    .notEmpty()
    .withMessage('Ingresa tu email o CI')
    .custom((value) => {
      const v = String(value).trim();
      return EMAIL_FORMAT.test(v) || CI_FORMAT.test(v.toUpperCase());
    }),
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
router.get('/', authenticate, permit('Coordinador'), controller.list);
router.get('/:id', authenticate, permit('Coordinador'), controller.getOne);
router.put('/:id', authenticate, permit('Coordinador'), userRules, controller.update);
router.put('/:id/password', authenticate, permit('Coordinador'), controller.changePassword);
router.delete('/:id', authenticate, permit('Coordinador'), controller.del);

export default router;
