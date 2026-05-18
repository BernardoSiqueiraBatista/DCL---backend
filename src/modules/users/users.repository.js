import { query } from '../../database/connection.js';

export async function findById(id) {
  const { rows } = await query(
    'SELECT id, name, email, role, avatar_url, is_verified, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

export async function findByEmail(email) {
  const { rows } = await query(
    'SELECT id, name, email, role, avatar_url, is_verified, created_at FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

export async function updateUser(id, fields) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return null;

  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(fields), id];

  const { rows } = await query(
    `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING id, name, email, role, avatar_url, is_verified`,
    values
  );
  return rows[0] || null;
}
