import { Router } from 'express';
import { check } from 'express-validator';
import { validateRules } from '../../middlewares/validate.middleware.js';
import authenticate from '../../middlewares/auth.middleware.js';
import { permit } from '../../middlewares/role.middleware.js';
import * as controller from './attendance.controller.js';

const router = Router();

const attendanceRules = [
  check('studentId').notEmpty().withMessage('studentId es obligatorio'),
  check('status').isIn(['Presente', 'Ausente', 'Justificado']).withMessage('Estado debe ser Presente, Ausente o Justificado')
];

router.post('/', attendanceRules, authenticate, permit('Docente', 'Coordinador'), controller.create);
router.post('/scan', [check('qrCode').notEmpty().withMessage('qrCode es obligatorio')], authenticate, permit('Docente', 'Coordinador'), controller.scan);
router.get('/', authenticate, permit('Docente', 'Coordinador', 'Estudiante'), controller.list);
router.get('/estudiante/:studentId/porcentaje', authenticate, permit('Docente', 'Coordinador', 'Estudiante'), controller.porcentaje);
router.get('/:id', authenticate, permit('Docente', 'Coordinador', 'Estudiante'), controller.getOne);

export default router;
