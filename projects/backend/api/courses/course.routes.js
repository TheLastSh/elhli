import { Router } from 'express';
import { check } from 'express-validator';
import { validateRules } from '../../middlewares/validate.middleware.js';
import authenticate from '../../middlewares/auth.middleware.js';
import { permit } from '../../middlewares/role.middleware.js';
import * as controller from './course.controller.js';

const router = Router();

const courseRules = [
  check('subject').notEmpty().withMessage('El nombre del curso es obligatorio'),
  check('section').optional().isIn(['IA-1', 'IA-2', 'SIST-1']).withMessage('Sección debe ser IA-1, IA-2 o SIST-1')
];

router.post('/', courseRules, authenticate, permit('Docente', 'Coordinador'), controller.create);
router.get('/', authenticate, permit('Docente', 'Coordinador', 'Estudiante'), controller.list);
router.get('/:id', authenticate, permit('Docente', 'Coordinador', 'Estudiante'), controller.getOne);
router.put('/:id', courseRules, authenticate, permit('Docente', 'Coordinador'), controller.update);
router.put('/:id/students', [check('studentIds').isArray().notEmpty().withMessage('studentIds debe ser un arreglo no vacío')], authenticate, permit('Docente', 'Coordinador'), controller.addStudents);

export default router;
