import { Router } from 'express';
import authenticate from '../../middlewares/auth.middleware.js';
import { permit } from '../../middlewares/role.middleware.js';
import * as controller from './reportcard.controller.js';

const router = Router();

router.get('/students/:id/boletin.pdf', authenticate, permit('Docente', 'Coordinador', 'Estudiante'), controller.boletin);
router.get('/students/:id/constancia.pdf', authenticate, permit('Docente', 'Coordinador', 'Estudiante'), controller.constancia);
router.get('/students/:id/estadisticas', authenticate, permit('Docente', 'Coordinador', 'Estudiante'), controller.estadisticas);

export default router;
