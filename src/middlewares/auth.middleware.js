import { verifyToken, sendError } from '../utils/helpers.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'Token de acesso não fornecido.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = {
      id:    decoded.id || decoded.sub,
      email: decoded.email,
      role:  decoded.role,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token expirado. Faça login novamente.');
    }
    return sendError(res, 401, 'Token inválido.');
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user)                      return sendError(res, 401, 'Não autenticado.');
    if (!roles.includes(req.user.role)) return sendError(res, 403, 'Acesso negado: permissão insuficiente.');
    next();
  };
}
