import logger from '../utils/logger.js';
import env from '../config/env.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, errors = undefined) {
    super(message);
    this.name       = 'AppError';
    this.statusCode = statusCode;
    this.errors     = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorMiddleware(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof AppError) {
    logger.warn(`[AppError] ${err.statusCode} - ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token inválido.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expirado.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'JSON inválido no corpo da requisição.' });
  }

  logger.error('[Unhandled Error]', err.message);
  if (env.isDev) logger.error(err.stack);

  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor.',
    ...(env.isDev && { stack: err.stack }),
  });
}
