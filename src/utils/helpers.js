import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

// ─── OTP ──────────────────────────────────────────────────────────────────────

// Fix 1: crypto.randomInt é criptograficamente seguro (CSPRNG)
export function generateOTP() {
  return String(crypto.randomInt(100000, 1000000));
}

// Fix 2: hash de tokens sensíveis com SHA-256 antes de persistir
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Password ─────────────────────────────────────────────────────────────────

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ─── JWT ──────────────────────────────────────────────────────────────────────

export function generateAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: 'dcl-backend',
    subject: payload.id,
  });
}

export function generateRefreshToken(payload) {
  return jwt.sign({ id: payload.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'dcl-backend',
    subject: payload.id,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { issuer: 'dcl-backend' });
}

export function generateTokenPair(user) {
  const accessToken  = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });
  return { accessToken, refreshToken };
}

// Fix 5: parser correto para formatos como '7d', '1h', '30m'
export function refreshTokenExpiresAt() {
  const raw   = env.JWT_REFRESH_EXPIRES_IN || '7d';
  const match = raw.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const value = parseInt(match[1], 10);
  const ms    = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
  return new Date(Date.now() + value * ms);
}

// ─── API Response ─────────────────────────────────────────────────────────────

export function sendSuccess(res, statusCode, message, data = undefined) {
  const response = { success: true, message };
  if (data !== undefined) response.data = data;
  return res.status(statusCode).json(response);
}

export function sendError(res, statusCode, message, errors = undefined) {
  const response = { success: false, message };
  if (errors !== undefined) response.errors = errors;
  return res.status(statusCode).json(response);
}
