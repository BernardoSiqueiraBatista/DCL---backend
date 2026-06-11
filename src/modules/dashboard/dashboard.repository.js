import { query } from '../../database/connection.js';

// Task 2 / 4.4 — payload agregado em uma única consulta por bloco.

export async function getKpis(userId) {
  const { rows } = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM projects
         WHERE user_id = $1 AND deleted_at IS NULL AND status <> 'erro')          AS projetos_ativos,
       (SELECT COUNT(*)::int FROM clients
         WHERE user_id = $1 AND ativo = TRUE AND deleted_at IS NULL)              AS clientes_ativos,
       (SELECT COUNT(*)::int FROM project_creatives pc
          JOIN projects p ON p.id = pc.project_id
         WHERE p.user_id = $1 AND pc.criado_em > NOW() - INTERVAL '30 days')      AS creativos_gerados_30d,
       (SELECT COALESCE(SUM(pc.custo_cents), 0)::int FROM project_creatives pc
          JOIN projects p ON p.id = pc.project_id
         WHERE p.user_id = $1)                                                    AS custo_total_cents`,
    [userId]
  );
  return rows[0];
}

export async function getProjetosRecentes(userId, limit = 5) {
  const { rows } = await query(
    `SELECT p.id, p.titulo, c.nome AS cliente, p.status, p.capa_url, p.atualizado_em
       FROM projects p
       JOIN clients c ON c.id = p.cliente_id
      WHERE p.user_id = $1 AND p.deleted_at IS NULL
      ORDER BY p.atualizado_em DESC
      LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

export async function getClientesRecentes(userId, limit = 5) {
  const { rows } = await query(
    `SELECT c.id, c.nome, c.setor,
            (SELECT COUNT(*)::int FROM projects p
              WHERE p.cliente_id = c.id AND p.deleted_at IS NULL) AS projetos
       FROM clients c
      WHERE c.user_id = $1 AND c.ativo = TRUE AND c.deleted_at IS NULL
      ORDER BY c.criado_em DESC
      LIMIT $2`,
    [userId, limit]
  );
  return rows;
}
