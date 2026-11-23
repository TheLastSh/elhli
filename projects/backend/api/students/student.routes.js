import { Router } from 'express';
import { check } from 'express-validator';
import { validateRules } from '../../middlewares/validate.middleware.js';
import authenticate from '../../middlewares/auth.middleware.js';
import { permit } from '../../middlewares/role.middleware.js';
import * as controller from './student.controller.js';

const router = Router();

const studentCommonRules = [
  check('section').optional().isIn(['IA-1', 'IA-2', 'SIST-1']).withMessage('Sección debe ser IA-1, IA-2 o SIST-1'),
  check('status').optional().isIn(['Activo', 'Retirado', 'En Riesgo', 'Reprobado']).withMessage('Estado inválido')
];

const studentCreateRules = [
  check('ci').matches(/^[VE]-\d{7,9}$/i).withMessage('Formato de CI inválido (ej. V-12345678)'),
  check('fullName').notEmpty().withMessage('El nombre completo es obligatorio'),
  check('email').isEmail().withMessage('Email inválido'),
  ...studentCommonRules
];

const studentUpdateRules = [
  check('ci').optional().matches(/^[VE]-\d{7,9}$/i).withMessage('Formato de CI inválido (ej. V-12345678)'),
  check('fullName').optional().notEmpty().withMessage('El nombre completo es obligatorio'),
  check('email').optional().isEmail().withMessage('Email inválido'),
  ...studentCommonRules
];

router.post('/', validateRules(studentCreateRules), authenticate, permit('Docente', 'Coordinador'), controller.create);
router.get('/', authenticate, permit('Docente', 'Coordinador', 'Estudiante'), controller.list);
router.get('/:id', authenticate, permit('Docente', 'Coordinador', 'Estudiante'), controller.getOne);
router.put('/:id', validateRules(studentUpdateRules), authenticate, permit('Docente', 'Coordinador'), controller.update);
router.delete('/:id', authenticate, permit('Docente', 'Coordinador'), controller.deleteOne);

export default router;
