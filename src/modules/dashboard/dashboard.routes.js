import { Router } from 'express';
import * as controller from './dashboard.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

// Task 2 — payload agregado (KPIs + últimos projetos + últimos clientes)
router.get('/', controller.get);

export default router;
