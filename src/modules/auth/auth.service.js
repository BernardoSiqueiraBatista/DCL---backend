import * as repo from './auth.repository.js';
import {
  hashPassword,
  comparePassword,
  generateTokenPair,
  generateOTP,
  refreshTokenExpiresAt,
  verifyToken,
  hashToken,
} from '../../utils/helpers.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { sendOtpEmail } from '../../utils/mailer.js';
import env from '../../config/env.js';

// ─── Helpers internos ─────────────────────────────────────────────────────────

function otpExpiresAt() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + env.OTP_EXPIRES_MINUTES);
  return date;
}

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register({ name, email, password }) {
  const existing = await repo.findUserByEmail(email);
  if (existing) {
    throw new AppError('E-mail já cadastrado.', 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await repo.createUser({ name, email, passwordHash });

  const otp = generateOTP();
  await repo.createOtp({
    userId: user.id,
    code: otp,
    type: 'email_verification',
    expiresAt: otpExpiresAt(),
  });

  await sendOtpEmail({ name: user.name, email: user.email }, otp, 'email_verification');

  return {
    userId: user.id,
    message: `Cadastro realizado! Um código de verificação foi enviado para ${email}.`,
  };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login({ email, password }) {
  const user = await repo.findUserByEmail(email);
  if (!user) {
    throw new AppError('Credenciais inválidas.', 401);
  }

  const passwordMatch = await comparePassword(password, user.password_hash);
  if (!passwordMatch) {
    throw new AppError('Credenciais inválidas.', 401);
  }

  if (!user.is_verified) {
    const otp = generateOTP();
    await repo.createOtp({
      userId: user.id,
      code: otp,
      type: 'email_verification',
      expiresAt: otpExpiresAt(),
    });
    await sendOtpEmail({ name: user.name, email: user.email }, otp, 'email_verification');

    throw new AppError(
      'Conta não verificada. Um novo código foi enviado para seu e-mail.',
      403,
      { requiresVerification: true, userId: user.id }
    );
  }

  const { accessToken, refreshToken } = generateTokenPair(user);

  // Fix 2: armazena apenas o hash SHA-256 do refresh token no banco
  await repo.saveRefreshToken({
    userId:    user.id,
    token:     hashToken(refreshToken),
    expiresAt: refreshTokenExpiresAt(),
  });

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export async function verifyOtp({ userId, otp }) {
  const user = await repo.findUserById(userId);
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  if (user.is_verified) {
    throw new AppError('Conta já verificada.', 400);
  }

  const otpRecord = await repo.findValidOtp({
    userId,
    code: otp,
    type: 'email_verification',
  });

  if (!otpRecord) {
    throw new AppError('Código inválido ou expirado.', 400);
  }

  await repo.markOtpAsUsed(otpRecord.id);
  await repo.markUserAsVerified(userId);

  return { message: 'E-mail verificado com sucesso! Você já pode fazer login.' };
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────

export async function resendOtp({ userId }) {
  const user = await repo.findUserById(userId);
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  if (user.is_verified) {
    throw new AppError('Conta já verificada.', 400);
  }

  const otp = generateOTP();
  await repo.createOtp({
    userId: user.id,
    code: otp,
    type: 'email_verification',
    expiresAt: otpExpiresAt(),
  });

  await sendOtpEmail({ name: user.name, email: user.email }, otp, 'email_verification');

  return { message: `Novo código enviado para ${user.email}.` };
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export async function refreshToken({ refreshToken: token }) {
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new AppError('Refresh token inválido ou expirado.', 401);
  }

  // Fix 2: busca e revoga pelo hash do token recebido
  const stored = await repo.findRefreshToken(hashToken(token));
  if (!stored || stored.revoked || new Date(stored.expires_at) < new Date()) {
    throw new AppError('Refresh token inválido ou expirado.', 401);
  }

  const user = await repo.findUserById(stored.user_id);
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  await repo.revokeRefreshToken(hashToken(token));
  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);
  await repo.saveRefreshToken({
    userId:    user.id,
    token:     hashToken(newRefreshToken),
    expiresAt: refreshTokenExpiresAt(),
  });

  return { accessToken, refreshToken: newRefreshToken };
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPassword({ email }) {
  const user = await repo.findUserByEmail(email);

  if (!user) {
    return { message: 'Se o e-mail estiver cadastrado, você receberá um código em breve.' };
  }

  const otp = generateOTP();
  await repo.createOtp({
    userId: user.id,
    code: otp,
    type: 'password_reset',
    expiresAt: otpExpiresAt(),
  });

  await sendOtpEmail({ name: user.name, email: user.email }, otp, 'password_reset');

  return { message: 'Se o e-mail estiver cadastrado, você receberá um código em breve.' };
}

// ─── Reset Password ───────────────────────────────────────────────────────────

// Fix 3: resetPassword agora usa email (não userId) para não expor UUID
export async function resetPassword({ email, otp, newPassword }) {
  const user = await repo.findUserByEmail(email);
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  const otpRecord = await repo.findValidOtp({
    userId: user.id,
    code:   otp,
    type:   'password_reset',
  });

  if (!otpRecord) {
    throw new AppError('Código inválido ou expirado.', 400);
  }

  const newHash = await hashPassword(newPassword);
  await repo.updateUserPassword(user.id, newHash);
  await repo.markOtpAsUsed(otpRecord.id);
  await repo.revokeAllUserRefreshTokens(user.id);

  return { message: 'Senha redefinida com sucesso! Faça login com a nova senha.' };
}

// Fix 8: logout explícito revoga o refresh token informado
export async function logout({ refreshToken: token }) {
  const tokenHash = hashToken(token);
  const stored    = await repo.findRefreshToken(tokenHash);

  if (!stored || stored.revoked) {
    // Sem erro: token já era inválido/revogado — operação idempotente
    return { message: 'Logout realizado.' };
  }

  await repo.revokeRefreshToken(tokenHash);
  return { message: 'Logout realizado com sucesso.' };
}
