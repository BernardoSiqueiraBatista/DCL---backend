import { query } from '../../database/connection.js';

const PUBLIC_COLS = `
  id, user_id, nome, email_contato, telefone, setor, site, descricao,
  tom_de_voz, ativo, criado_em, atualizado_em
`;

export async function create(userId, data) {
  const { rows } = await query(
    `INSERT INTO clients (user_id, nome, email_contato, telefone, setor, site, descricao, tom_de_voz)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${PUBLIC_COLS}`,
    [
      userId,
      data.nome,
      data.email_contato ?? null,
      data.telefone ?? null,
      data.setor ?? null,
      data.site ?? null,
      data.descricao ?? null,
      data.tom_de_voz ?? null,
    ]
  );
  return rows[0];
}

/** Lista paginada com busca (q) e filtro por setor. Retorna itens + total. */
export async function list(userId, { q, setor, page = 1, size = 20 }) {
  const where = ['c.user_id = $1', 'c.deleted_at IS NULL'];
  const params = [userId];

  if (q) {
    params.push(`%${q}%`);
    where.push(`c.nome ILIKE $${params.length}`);
  }
  if (setor) {
    params.push(setor);
    where.push(`c.setor = $${params.length}`);
  }

  const whereSql = where.join(' AND ');
  const offset = (page - 1) * size;

  const itemsParams = [...params, size, offset];
  const { rows } = await query(
    `SELECT c.id, c.user_id, c.nome, c.email_contato, c.telefone, c.setor, c.site,
            c.descricao, c.tom_de_voz, c.ativo, c.criado_em, c.atualizado_em,
            (SELECT COUNT(*)::int FROM projects p
              WHERE p.cliente_id = c.id AND p.deleted_at IS NULL) AS projetos_total,
            (SELECT MAX(p.atualizado_em) FROM projects p
              WHERE p.cliente_id = c.id AND p.deleted_at IS NULL) AS ultima_atividade
       FROM clients c
      WHERE ${whereSql}
      ORDER BY c.criado_em DESC
      LIMIT $${itemsParams.length - 1} OFFSET $${itemsParams.length}`,
    itemsParams
  );

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM clients c WHERE ${whereSql}`,
    params
  );

  return { items: rows, total: countRows[0].total };
}

export async function findById(userId, id) {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLS} FROM clients
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [id, userId]
  );
  return rows[0] || null;
}

export async function update(userId, id, fields) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findById(userId, id);

  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(fields), id, userId];

  const { rows } = await query(
    `UPDATE clients SET ${setClause}
      WHERE id = $${values.length - 1} AND user_id = $${values.length} AND deleted_at IS NULL
      RETURNING ${PUBLIC_COLS}`,
    values
  );
  return rows[0] || null;
}

/** Soft delete: marca ativo=false e carimba deleted_at, preservando histórico. */
export async function softDelete(userId, id) {
  const { rows } = await query(
    `UPDATE clients SET ativo = FALSE, deleted_at = NOW()
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
      RETURNING id`,
    [id, userId]
  );
  return rows[0] || null;
}

export async function countActive(userId) {
  const { rows } = await query(
    'SELECT COUNT(*)::int AS total FROM clients WHERE user_id = $1 AND ativo = TRUE AND deleted_at IS NULL',
    [userId]
  );
  return rows[0].total;
}

/** Quantos projetos ativos um cliente possui (usado ao excluir cliente). */
export async function countActiveProjects(userId, clientId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total FROM projects
      WHERE cliente_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [clientId, userId]
  );
  return rows[0].total;
}
