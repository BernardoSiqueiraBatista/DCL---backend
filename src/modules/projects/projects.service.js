import crypto from 'crypto';
import * as repo from './projects.repository.js';
import * as clientsRepo from '../clients/clients.repository.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { buildRefineInput } from './prompt.builder.js';
import { aiProvider } from '../../integrations/ai/ai.provider.js';
import { imageGenerator } from '../../integrations/image/image.generator.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

const VARIACOES_PADRAO = 2;

// ─── Task 6 — Criação + geração assíncrona ──────────────────────────────────────

export async function create(userId, data) {
  // Regra de negócio crítica (Task 3): sem cliente ativo, não cria projeto.
  const clientesAtivos = await clientsRepo.countActive(userId);
  if (clientesAtivos === 0) {
    throw new AppError(
      'Você precisa ter ao menos um cliente cadastrado para criar um projeto.',
      422,
      { codigo: 'no_active_client', redirect: '/clients/new' }
    );
  }

  // O cliente informado precisa existir e pertencer ao usuário.
  const cliente = await clientsRepo.findById(userId, data.cliente_id);
  if (!cliente) {
    throw new AppError('Cliente informado não encontrado.', 422, { codigo: 'invalid_client' });
  }

  // Default da área de atuação = setor do cliente (editável), conforme escopo 8.1.
  if (!data.area_atuacao) data.area_atuacao = cliente.setor;

  const project = await repo.create(userId, data);

  // Vincula referências previamente enviadas (POST /projects/uploads).
  if (data.referencias_ids?.length) {
    await repo.attachReferences(userId, project.id, data.referencias_ids);
  }

  // Geração assíncrona: responde 202 e processa em background; client faz polling.
  runGeneration(userId, project.id, VARIACOES_PADRAO).catch((err) =>
    logger.error(`[projects] geração falhou (project ${project.id}): ${err.message}`)
  );

  return { project_id: project.id, status: 'gerando' };
}

/**
 * Pipeline de geração (refino LLM → imagem). Roda fora do ciclo de request.
 * Idempotente quanto ao status final: marca 'pronto' ou 'erro'.
 */
async function runGeneration(userId, projectId, quantidade) {
  try {
    const project = await repo.findById(userId, projectId);
    if (!project) return;

    // Descreve referências para enriquecer o contexto do prompt.
    const referencias = await repo.listReferences(projectId);
    for (const ref of referencias) {
      if (!ref.descricao_textual) {
        const desc = await aiProvider.describeReference({ url: ref.url, mimeType: ref.mime_type });
        await repo.setReferenceDescription(ref.id, desc);
        ref.descricao_textual = desc;
      }
    }

    // Refino do prompt pelo LLM de texto.
    const refineInput = buildRefineInput({ project, referencias });
    const { promptFinal } = await aiProvider.refinePrompt(refineInput);

    // Geração das imagens pelo modelo de imagem.
    const imagens = await imageGenerator.generateImages({
      promptFinal,
      tamanho: project.tamanho,
      quantidade,
    });

    await repo.clearCreatives(projectId);
    await repo.addCreatives(projectId, imagens);
    await repo.setStatus(projectId, 'pronto', {
      promptFinal,
      capaUrl: imagens[0]?.url ?? null,
    });
  } catch (err) {
    await repo.setStatus(projectId, 'erro', { erroMensagem: err.message });
    throw err;
  }
}

// Task 6 — polling de status
export async function getStatus(userId, id) {
  const project = await repo.findById(userId, id);
  if (!project) throw new AppError('Projeto não encontrado.', 404);

  const imagens = await repo.listCreatives(id);
  return {
    status: project.status,
    imagens: imagens.map((c) => ({ url: c.url, variacao: c.variacao })),
    prompt_final: project.prompt_final,
    ...(project.status === 'erro' && { erro: project.erro_mensagem }),
  };
}

// Task 6 — regeneração com rate limit (1 a cada REGENERATE_COOLDOWN_HOURS)
export async function regenerate(userId, id) {
  const project = await repo.findById(userId, id);
  if (!project) throw new AppError('Projeto não encontrado.', 404);

  if (project.ultima_geracao_em) {
    const elapsedMs = Date.now() - new Date(project.ultima_geracao_em).getTime();
    const cooldownMs = env.REGENERATE_COOLDOWN_HOURS * 3_600_000;
    if (elapsedMs < cooldownMs) {
      const faltamMin = Math.ceil((cooldownMs - elapsedMs) / 60_000);
      throw new AppError(
        `Regeneração disponível novamente em ~${faltamMin} min.`,
        429,
        { codigo: 'rate_limited', retry_after_min: faltamMin }
      );
    }
  }

  await repo.setStatus(id, 'gerando');
  runGeneration(userId, id, VARIACOES_PADRAO).catch((err) =>
    logger.error(`[projects] regeneração falhou (project ${id}): ${err.message}`)
  );

  return { project_id: id, status: 'gerando' };
}

// Task 6 — registro de upload de referência (multipart)
export async function registerUpload(userId, file) {
  const ref = await repo.createReference(userId, {
    uploadId: crypto.randomUUID(),
    url: file.url,
    mimeType: file.mimetype,
    tamanhoBytes: file.size,
  });
  return { upload_id: ref.upload_id, url: ref.url };
}

// ─── Task 5 — Meus Projetos ─────────────────────────────────────────────────────

export async function list(userId, queryParams) {
  const page = Math.max(parseInt(queryParams.page || '1', 10), 1);
  const size = Math.min(Math.max(parseInt(queryParams.size || '20', 10), 1), 100);

  const { items, total } = await repo.list(userId, {
    cliente: queryParams.cliente || null,
    status: queryParams.status || null,
    tipo: queryParams.tipo || null,
    q: queryParams.q?.trim() || null,
    page,
    size,
  });

  return { projetos: items, page, size, total };
}

export async function getById(userId, id) {
  const project = await repo.findById(userId, id);
  if (!project) throw new AppError('Projeto não encontrado.', 404);

  const imagens = await repo.listCreatives(id);
  const referencias = await repo.listReferences(id);
  return { ...project, imagens, referencias };
}

const UPDATABLE = ['titulo', 'status'];

export async function update(userId, id, data) {
  await getById(userId, id);

  const fields = {};
  for (const key of UPDATABLE) {
    if (data[key] !== undefined) fields[key] = data[key];
  }
  if (Object.keys(fields).length === 0) {
    throw new AppError('Nenhum campo válido para atualização.', 422);
  }

  return repo.update(userId, id, fields);
}

// Task 5 — duplicar: mesmo prompt/parâmetros, novo registro, dispara nova geração.
export async function duplicate(userId, id) {
  const original = await repo.findById(userId, id);
  if (!original) throw new AppError('Projeto não encontrado.', 404);

  const novo = await repo.create(userId, {
    cliente_id: original.cliente_id,
    titulo: `${original.titulo} (cópia)`,
    area_atuacao: original.area_atuacao,
    tipo_criativo: original.tipo_criativo,
    tamanho: original.tamanho,
    prompt: original.prompt,
    diferenciais: original.diferenciais,
  });

  runGeneration(userId, novo.id, VARIACOES_PADRAO).catch((err) =>
    logger.error(`[projects] geração (duplicar) falhou (project ${novo.id}): ${err.message}`)
  );

  return { project_id: novo.id, status: 'gerando' };
}

export async function remove(userId, id) {
  const deleted = await repo.softDelete(userId, id);
  if (!deleted) throw new AppError('Projeto não encontrado.', 404);
  return { message: 'Projeto excluído com sucesso.' };
}
