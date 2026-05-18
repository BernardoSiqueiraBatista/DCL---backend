import { Router } from 'express';
import * as controller from './auth.controller.js';
import {
  registerRules,
  loginRules,
  verifyOtpRules,
  resendOtpRules,
  refreshTokenRules,
  forgotPasswordRules,
  resetPasswordRules,
  logoutRules,
  validate,
} from '../../utils/validators.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { loginLimiter, otpLimiter, authLimiter } from '../../utils/rateLimiter.js';

const router = Router();

// Fix 4: rate limiting por perfil de sensibilidade
router.post('/register',       authLimiter,  registerRules,       validate, controller.register);
router.post('/login',          loginLimiter, loginRules,          validate, controller.login);
router.post('/verify-otp',     otpLimiter,   verifyOtpRules,      validate, controller.verifyOtp);
router.post('/resend-otp',     otpLimiter,   resendOtpRules,      validate, controller.resendOtp);
router.post('/refresh-token',  authLimiter,  refreshTokenRules,   validate, controller.refreshToken);
router.post('/forgot-password',authLimiter,  forgotPasswordRules, validate, controller.forgotPassword);
router.post('/reset-password', otpLimiter,   resetPasswordRules,  validate, controller.resetPassword);

// Fix 8: logout explícito — requer access token válido
router.post('/logout',         authMiddleware, authLimiter, logoutRules, validate, controller.logout);

export default router;
