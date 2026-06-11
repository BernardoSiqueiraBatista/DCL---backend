import { query } from '../../database/connection.js';

const PROJECT_COLS = `
  id, user_id, cliente_id, titulo, area_atuacao, tipo_criativo, tamanho,
  prompt, diferenciais, prompt_final, status, erro_mensagem, capa_url,
  ultima_geracao_em, ativo, criado_em, atualizado_em
`;

export async function create(userId, data) {
  const { rows } = await query(
    `INSERT INTO projects
       (user_id, cliente_id, titulo, area_atuacao, tipo_criativo, tamanho, prompt, diferenciais, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, 'gerando')
     RETURNING ${PROJECT_COLS}`,
    [
      userId,
      data.cliente_id,
      data.titulo,
      data.area_atuacao ?? null,
      data.tipo_criativo ?? null,
      data.tamanho ?? null,
      data.prompt,
      JSON.stringify(data.diferenciais ?? []),
    ]
  );
  return rows[0];
}

export async function list(userId, { cliente, status, tipo, q, page = 1, size = 20 }) {
  const where = ['p.user_id = $1', 'p.deleted_at IS NULL'];
  const params = [userId];

  if (cliente) { params.push(cliente); where.push(`p.cliente_id = $${params.length}`); }
  if (status)  { params.push(status);  where.push(`p.status = $${params.length}`); }
  if (tipo)    { params.push(tipo);    where.push(`p.tipo_criativo = $${params.length}`); }
  if (q)       { params.push(`%${q}%`); where.push(`p.titulo ILIKE $${params.length}`); }

  const whereSql = where.join(' AND ');
  const offset = (page - 1) * size;
  const itemsParams = [...params, size, offset];

  const { rows } = await query(
    `SELECT p.id, p.titulo, p.status, p.capa_url, p.tipo_criativo, p.tamanho,
            p.cliente_id, c.nome AS cliente_nome, p.atualizado_em, p.criado_em
       FROM projects p
       JOIN clients c ON c.id = p.cliente_id
      WHERE ${whereSql}
      ORDER BY p.atualizado_em DESC
      LIMIT $${itemsParams.length - 1} OFFSET $${itemsParams.length}`,
    itemsParams
  );

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM projects p WHERE ${whereSql}`,
    params
  );

  return { items: rows, total: countRows[0].total };
}

export async function findById(userId, id) {
  const { rows } = await query(
    `SELECT ${PROJECT_COLS} FROM projects
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
    `UPDATE projects SET ${setClause}
      WHERE id = $${values.length - 1} AND user_id = $${values.length} AND deleted_at IS NULL
      RETURNING ${PROJECT_COLS}`,
    values
  );
  return rows[0] || null;
}

export async function softDelete(userId, id) {
  const { rows } = await query(
    `UPDATE projects SET ativo = FALSE, deleted_at = NOW()
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
      RETURNING id`,
    [id, userId]
  );
  return rows[0] || null;
}

// ─── Geração (status / criativos) ───────────────────────────────────────────────

export async function setStatus(id, status, { erroMensagem = null, promptFinal, capaUrl } = {}) {
  const sets = ['status = $2'];
  const params = [id, status];

  if (erroMensagem !== undefined && erroMensagem !== null) { params.push(erroMensagem); sets.push(`erro_mensagem = $${params.length}`); }
  if (promptFinal !== undefined) { params.push(promptFinal); sets.push(`prompt_final = $${params.length}`); }
  if (capaUrl !== undefined)     { params.push(capaUrl);     sets.push(`capa_url = $${params.length}`); }
  if (status === 'pronto')       { sets.push('ultima_geracao_em = NOW()'); }

  await query(`UPDATE projects SET ${sets.join(', ')} WHERE id = $1`, params);
}

export async function addCreatives(projectId, creatives) {
  for (const c of creatives) {
    await query(
      `INSERT INTO project_creatives (project_id, variacao, url, modelo_usado, custo_cents)
       VALUES ($1, $2, $3, $4, $5)`,
      [projectId, c.variacao, c.url, c.modelo, c.custoCents]
    );
  }
}

export async function clearCreatives(projectId) {
  await query('DELETE FROM project_creatives WHERE project_id = $1', [projectId]);
}

export async function listCreatives(projectId) {
  const { rows } = await query(
    `SELECT variacao, url, modelo_usado, custo_cents, criado_em
       FROM project_creatives WHERE project_id = $1 ORDER BY variacao ASC`,
    [projectId]
  );
  return rows;
}

// ─── Referências (uploads) ──────────────────────────────────────────────────────

export async function createReference(userId, { uploadId, url, mimeType, tamanhoBytes }) {
  const { rows } = await query(
    `INSERT INTO project_references (upload_id, user_id, url, mime_type, tamanho_bytes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, upload_id, url, mime_type, tamanho_bytes, criado_em`,
    [uploadId, userId, url, mimeType, tamanhoBytes]
  );
  return rows[0];
}

/** Vincula referências (por upload_id) a um projeto e devolve as linhas vinculadas. */
export async function attachReferences(userId, projectId, uploadIds) {
  if (!uploadIds?.length) return [];
  const { rows } = await query(
    `UPDATE project_references
        SET project_id = $1, descricao_textual = COALESCE(descricao_textual, $2)
      WHERE user_id = $3 AND upload_id = ANY($4::uuid[]) AND project_id IS NULL
      RETURNING id, upload_id, url, mime_type, descricao_textual`,
    [projectId, null, userId, uploadIds]
  );
  return rows;
}

export async function setReferenceDescription(refId, descricao) {
  await query('UPDATE project_references SET descricao_textual = $1 WHERE id = $2', [descricao, refId]);
}

export async function listReferences(projectId) {
  const { rows } = await query(
    `SELECT id, upload_id, url, mime_type, descricao_textual, criado_em
       FROM project_references WHERE project_id = $1 ORDER BY criado_em ASC`,
    [projectId]
  );
  return rows;
}
