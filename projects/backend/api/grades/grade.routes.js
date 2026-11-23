import { Router } from 'express';
import { check } from 'express-validator';
import { validateRules } from '../../middlewares/validate.middleware.js';
import authenticate from '../../middlewares/auth.middleware.js';
import { permit } from '../../middlewares/role.middleware.js';
import * as controller from './grade.controller.js';

const router = Router();

const gradeRules = [
  check('studentId').notEmpty().withMessage('studentId es obligatorio'),
  check('subject').notEmpty().withMessage('El nombre del curso es obligatorio'),
  check('cut1').custom((v) => { if (typeof v === 'number' && (v < 0 || v > 20)) throw new Error('La nota debe estar entre 0 y 20'); if (typeof v === 'number' && Number.isNaN(v)) throw new Error('La nota no es válida'); return true; }).optional({ nullable: true }),
  check('cut2').custom((v) => { if (typeof v === 'number' && (v < 0 || v > 20)) throw new Error('La nota debe estar entre 0 y 20'); if (typeof v === 'number' && Number.isNaN(v)) throw new Error('La nota no es válida'); return true; }).optional({ nullable: true }),
  check('cut3').custom((v) => { if (typeof v === 'number' && (v < 0 || v > 20)) throw new Error('La nota debe estar entre 0 y 20'); if (typeof v === 'number' && Number.isNaN(v)) throw new Error('La nota no es válida'); return true; }).optional({ nullable: true }),
];

router.post('/', validateRules(gradeRules), authenticate, permit('Docente', 'Coordinador'), controller.create);
router.get('/', authenticate, permit('Docente', 'Coordinador', 'Estudiante'), controller.list);
router.get('/:studentId/promedio', authenticate, permit('Docente', 'Coordinador', 'Estudiante'), controller.promedio);
router.get('/:id', authenticate, permit('Docente', 'Coordinador', 'Estudiante'), controller.getOne);
router.put('/:id', validateRules(gradeRules), authenticate, permit('Docente', 'Coordinador'), controller.update);

export default router;
