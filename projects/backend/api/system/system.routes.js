import { Router } from 'express';
import authenticate from '../../middlewares/auth.middleware.js';
import { permit } from '../../middlewares/role.middleware.js';
import { systemOverview } from './system.controller.js';

const router = Router();

router.get('/overview', authenticate, permit('Coordinador'), systemOverview);

export default router;
