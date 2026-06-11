import { Router } from 'express';
import * as controller from './projects.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { uploadReferences } from '../../middlewares/upload.middleware.js';
import { validate } from '../../utils/validators.js';
import { createProjectRules, updateProjectRules, idParamRule } from './projects.validators.js';

const router = Router();

router.use(authMiddleware);

// Task 6 — upload de referências (rota fixa antes das paramétricas)
router.post('/uploads', uploadReferences, controller.uploads);

// Task 6 — criação (gera imagens async)
router.post('/', createProjectRules, validate, controller.create);

// Task 5 — listagem e detalhe
router.get('/', controller.list);
router.get('/:id', idParamRule, validate, controller.getById);

// Task 6 — status e regeneração
router.get('/:id/status', idParamRule, validate, controller.status);
router.post('/:id/regenerate', idParamRule, validate, controller.regenerate);

// Task 5 — edição, duplicação, exclusão
router.put('/:id', updateProjectRules, validate, controller.update);
router.post('/:id/duplicate', idParamRule, validate, controller.duplicate);
router.delete('/:id', idParamRule, validate, controller.remove);

export default router;
