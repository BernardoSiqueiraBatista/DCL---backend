import { body, param } from 'express-validator';

export const createClientRules = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório.')
    .isLength({ min: 2, max: 255 }).withMessage('Nome deve ter entre 2 e 255 caracteres.'),
  body('email_contato')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('E-mail de contato inválido.')
    .normalizeEmail(),
  body('telefone').optional({ nullable: true, checkFalsy: true }).isLength({ max: 50 }),
  body('setor').optional({ nullable: true, checkFalsy: true }).isLength({ max: 120 }),
  body('site')
    .optional({ nullable: true, checkFalsy: true })
    .isURL().withMessage('Site deve ser uma URL válida.'),
  body('descricao').optional({ nullable: true, checkFalsy: true }).isLength({ max: 2000 }),
  body('tom_de_voz').optional({ nullable: true, checkFalsy: true }).isLength({ max: 120 }),
];

export const updateClientRules = [
  param('id').isUUID().withMessage('id inválido.'),
  body('nome').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Nome deve ter entre 2 e 255 caracteres.'),
  body('email_contato').optional({ nullable: true, checkFalsy: true }).isEmail().normalizeEmail(),
  body('site').optional({ nullable: true, checkFalsy: true }).isURL(),
  body('ativo').optional().isBoolean().withMessage('ativo deve ser booleano.'),
];

export const idParamRule = [param('id').isUUID().withMessage('id inválido.')];
