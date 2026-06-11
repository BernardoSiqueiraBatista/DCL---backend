import { Router } from 'express';
import * as controller from './clients.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { validate } from '../../utils/validators.js';
import { createClientRules, updateClientRules, idParamRule } from './clients.validators.js';

const router = Router();

// Todas as rotas de clientes exigem autenticação (user_id vem do JWT).
router.use(authMiddleware);

router.post('/',        createClientRules, validate, controller.create);   // Task 3
router.get('/',         controller.list);                                  // Task 4
router.get('/:id',      idParamRule,      validate, controller.getById);   // Task 4
router.put('/:id',      updateClientRules, validate, controller.update);   // Task 4
router.delete('/:id',   idParamRule,      validate, controller.remove);    // Task 4

export default router;
