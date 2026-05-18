import { query } from '../../database/connection.js';

// ─── Users ────────────────────────────────────────────────────────────────────

export async function findUserByEmail(email) {
  const { rows } = await query(
    'SELECT id, name, email, password_hash, role, avatar_url, is_verified FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await query(
    'SELECT id, name, email, role, avatar_url, is_verified, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

export async function createUser({ name, email, passwordHash }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, role, is_verified, created_at`,
    [name, email, passwordHash]
  );
  return rows[0];
}

export async function markUserAsVerified(userId) {
  await query(
    'UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = $1',
    [userId]
  );
}

export async function updateUserPassword(userId, newPasswordHash) {
  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, userId]
  );
}

// ─── OTP Codes ────────────────────────────────────────────────────────────────

export async function createOtp({ userId, code, type, expiresAt }) {
  await query(
    'UPDATE otp_codes SET used = TRUE WHERE user_id = $1 AND type = $2 AND used = FALSE',
    [userId, type]
  );

  const { rows } = await query(
    `INSERT INTO otp_codes (user_id, code, type, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [userId, code, type, expiresAt]
  );
  return rows[0];
}

export async function findValidOtp({ userId, code, type }) {
  const { rows } = await query(
    `SELECT id, code, expires_at, used
     FROM otp_codes
     WHERE user_id = $1
       AND code = $2
       AND type = $3
       AND used = FALSE
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, code, type]
  );
  return rows[0] || null;
}

export async function markOtpAsUsed(otpId) {
  await query('UPDATE otp_codes SET used = TRUE WHERE id = $1', [otpId]);
}

// ─── Refresh Tokens ───────────────────────────────────────────────────────────

export async function saveRefreshToken({ userId, token, expiresAt }) {
  const { rows } = await query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, token, expiresAt]
  );
  return rows[0];
}

export async function findRefreshToken(token) {
  const { rows } = await query(
    `SELECT id, user_id, token, expires_at, revoked
     FROM refresh_tokens
     WHERE token = $1`,
    [token]
  );
  return rows[0] || null;
}

export async function revokeRefreshToken(token) {
  await query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1',
    [token]
  );
}

export async function revokeAllUserRefreshTokens(userId) {
  await query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE',
    [userId]
  );
}
