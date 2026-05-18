import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/helpers.js';

export async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, 201, result.message, { userId: result.userId });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, 200, 'Login realizado com sucesso.', result);
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const result = await authService.verifyOtp(req.body);
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    next(err);
  }
}

export async function resendOtp(req, res, next) {
  try {
    const result = await authService.resendOtp(req.body);
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const result = await authService.refreshToken(req.body);
    return sendSuccess(res, 200, 'Tokens renovados com sucesso.', result);
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const result = await authService.forgotPassword(req.body);
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body);
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    next(err);
  }
}

// Fix 8: logout explícito
export async function logout(req, res, next) {
  try {
    const result = await authService.logout(req.body);
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    next(err);
  }
}
