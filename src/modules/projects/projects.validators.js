import { body, param } from 'express-validator';

const TAMANHOS = ['1:1', '4:5', '9:16', '16:9'];

// Task 6 — criação de projeto (Step 1)
export const createProjectRules = [
  body('cliente_id')
    .notEmpty().withMessage('cliente_id é obrigatório.')
    .isUUID().withMessage('cliente_id inválido.'),
  body('titulo')
    .trim()
    .notEmpty().withMessage('Título é obrigatório.')
    .isLength({ min: 2, max: 255 }).withMessage('Título deve ter entre 2 e 255 caracteres.'),
  body('prompt')
    .trim()
    .notEmpty().withMessage('Prompt criativo é obrigatório.')
    .isLength({ min: 3, max: 4000 }).withMessage('Prompt deve ter entre 3 e 4000 caracteres.'),
  body('area_atuacao').optional({ nullable: true, checkFalsy: true }).isLength({ max: 120 }),
  body('tipo_criativo').optional({ nullable: true, checkFalsy: true }).isLength({ max: 60 }),
  body('tamanho')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(TAMANHOS).withMessage(`tamanho deve ser um de: ${TAMANHOS.join(', ')}.`),
  body('diferenciais').optional().isArray().withMessage('diferenciais deve ser uma lista.'),
  body('referencias_ids').optional().isArray().withMessage('referencias_ids deve ser uma lista.'),
  body('referencias_ids.*').optional().isUUID().withMessage('referencias_ids deve conter UUIDs.'),
];

// Task 5 — edição básica
export const updateProjectRules = [
  param('id').isUUID().withMessage('id inválido.'),
  body('titulo').optional().trim().isLength({ min: 2, max: 255 }),
  body('status')
    .optional()
    .isIn(['gerando', 'pronto', 'erro']).withMessage('status inválido.'),
];

export const idParamRule = [param('id').isUUID().withMessage('id inválido.')];
