import { body, validationResult } from 'express-validator';
import { sendError } from './helpers.js';

// ─── Validation Rules ─────────────────────────────────────────────────────────

export const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório.')
    .isLength({ min: 2, max: 255 }).withMessage('Nome deve ter entre 2 e 255 caracteres.'),

  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório.')
    .isEmail().withMessage('E-mail inválido.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Senha é obrigatória.')
    .isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres.')
    .matches(/[A-Z]/).withMessage('Senha deve conter ao menos uma letra maiúscula.')
    .matches(/[0-9]/).withMessage('Senha deve conter ao menos um número.'),
];

export const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório.')
    .isEmail().withMessage('E-mail inválido.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Senha é obrigatória.'),
];

export const verifyOtpRules = [
  body('userId')
    .notEmpty().withMessage('userId é obrigatório.')
    .isUUID().withMessage('userId inválido.'),

  body('otp')
    .notEmpty().withMessage('Código OTP é obrigatório.')
    .isLength({ min: 6, max: 6 }).withMessage('OTP deve ter exatamente 6 dígitos.')
    .isNumeric().withMessage('OTP deve conter apenas números.'),
];

export const resendOtpRules = [
  body('userId')
    .notEmpty().withMessage('userId é obrigatório.')
    .isUUID().withMessage('userId inválido.'),
];

export const refreshTokenRules = [
  body('refreshToken')
    .notEmpty().withMessage('refreshToken é obrigatório.'),
];

export const forgotPasswordRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório.')
    .isEmail().withMessage('E-mail inválido.')
    .normalizeEmail(),
];

export const resetPasswordRules = [
  // Fix 3: usa email em vez de userId para não expor UUID no body
  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório.')
    .isEmail().withMessage('E-mail inválido.')
    .normalizeEmail(),

  body('otp')
    .notEmpty().withMessage('Código OTP é obrigatório.')
    .isLength({ min: 6, max: 6 }).withMessage('OTP deve ter exatamente 6 dígitos.')
    .isNumeric().withMessage('OTP deve conter apenas números.'),

  body('newPassword')
    .notEmpty().withMessage('Nova senha é obrigatória.')
    .isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres.')
    .matches(/[A-Z]/).withMessage('Senha deve conter ao menos uma letra maiúscula.')
    .matches(/[0-9]/).withMessage('Senha deve conter ao menos um número.'),
];

export const logoutRules = [
  body('refreshToken')
    .notEmpty().withMessage('refreshToken é obrigatório.'),
];

// ─── Middleware de Validação ───────────────────────────────────────────────────

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 422, 'Erro de validação.', errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    })));
  }
  next();
}
