import * as repo from './clients.repository.js';
import { AppError } from '../../middlewares/error.middleware.js';

const UPDATABLE = ['nome', 'email_contato', 'telefone', 'setor', 'site', 'descricao', 'tom_de_voz', 'ativo'];

// Task 3 — criação
export async function create(userId, data) {
  return repo.create(userId, data);
}

// Task 4 — listagem com busca/filtro/paginação
export async function list(userId, queryParams) {
  const page = Math.max(parseInt(queryParams.page || '1', 10), 1);
  const size = Math.min(Math.max(parseInt(queryParams.size || '20', 10), 1), 100);

  const { items, total } = await repo.list(userId, {
    q: queryParams.q?.trim() || null,
    setor: queryParams.setor?.trim() || null,
    page,
    size,
  });

  return { clientes: items, page, size, total };
}

export async function getById(userId, id) {
  const client = await repo.findById(userId, id);
  if (!client) throw new AppError('Cliente não encontrado.', 404);
  return client;
}

export async function update(userId, id, data) {
  await getById(userId, id); // garante existência/posse

  const fields = {};
  for (const key of UPDATABLE) {
    if (data[key] !== undefined) fields[key] = data[key];
  }
  if (Object.keys(fields).length === 0) {
    throw new AppError('Nenhum campo válido para atualização.', 422);
  }

  return repo.update(userId, id, fields);
}

// Soft delete. Se houver projetos ativos, exige confirmação explícita (force=true).
export async function remove(userId, id, { force = false } = {}) {
  await getById(userId, id);

  const projetosAtivos = await repo.countActiveProjects(userId, id);
  if (projetosAtivos > 0 && !force) {
    throw new AppError(
      `Este cliente possui ${projetosAtivos} projeto(s) ativo(s). Confirme a exclusão para prosseguir.`,
      409,
      { requiresConfirmation: true, projetos_ativos: projetosAtivos }
    );
  }

  await repo.softDelete(userId, id);
  return { message: 'Cliente excluído com sucesso.' };
}
