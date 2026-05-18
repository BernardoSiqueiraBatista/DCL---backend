import rateLimit from 'express-rate-limit';
import { sendError } from './helpers.js';

function handler(msg) {
  return (_req, res) => sendError(res, 429, msg);
}

// Rotas de login e registro — mais restritivo
export const loginLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            5,
  standardHeaders: true,
  legacyHeaders:  false,
  handler:        handler('Muitas tentativas de login. Tente novamente em 15 minutos.'),
});

// Rotas de OTP — evita brute-force nos 6 dígitos
export const otpLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            10,
  standardHeaders: true,
  legacyHeaders:  false,
  handler:        handler('Muitas tentativas. Tente novamente em 15 minutos.'),
});

// Rotas genéricas de auth (register, forgot-password, reset-password, logout)
export const authLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            20,
  standardHeaders: true,
  legacyHeaders:  false,
  handler:        handler('Muitas requisições. Tente novamente em 15 minutos.'),
});
