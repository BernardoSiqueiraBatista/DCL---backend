import * as projectsService from './projects.service.js';
import { sendSuccess } from '../../utils/helpers.js';
import { storageProvider } from '../../integrations/storage/storage.provider.js';
import { AppError } from '../../middlewares/error.middleware.js';

// Task 6 — cria projeto e dispara geração (assíncrono → 202)
export async function create(req, res, next) {
  try {
    const result = await projectsService.create(req.user.id, req.body);
    return sendSuccess(res, 202, 'Projeto criado. Geração em andamento.', result);
  } catch (err) {
    next(err);
  }
}

// Task 5 — listagem
export async function list(req, res, next) {
  try {
    const result = await projectsService.list(req.user.id, req.query);
    return sendSuccess(res, 200, 'Projetos listados.', result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const project = await projectsService.getById(req.user.id, req.params.id);
    return sendSuccess(res, 200, 'Projeto carregado.', project);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const project = await projectsService.update(req.user.id, req.params.id, req.body);
    return sendSuccess(res, 200, 'Projeto atualizado.', project);
  } catch (err) {
    next(err);
  }
}

export async function duplicate(req, res, next) {
  try {
    const result = await projectsService.duplicate(req.user.id, req.params.id);
    return sendSuccess(res, 202, 'Projeto duplicado. Geração em andamento.', result);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await projectsService.remove(req.user.id, req.params.id);
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    next(err);
  }
}

// Task 6 — polling de status
export async function status(req, res, next) {
  try {
    const result = await projectsService.getStatus(req.user.id, req.params.id);
    return sendSuccess(res, 200, 'Status do projeto.', result);
  } catch (err) {
    next(err);
  }
}

// Task 6 — regeneração (rate limit 6h)
export async function regenerate(req, res, next) {
  try {
    const result = await projectsService.regenerate(req.user.id, req.params.id);
    return sendSuccess(res, 202, 'Regeneração iniciada.', result);
  } catch (err) {
    next(err);
  }
}

// Task 6 — upload de referências (multipart). Aceita 1..N arquivos em "files".
export async function uploads(req, res, next) {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      throw new AppError('Nenhum arquivo enviado.', 422, { codigo: 'no_file' });
    }

    const results = [];
    for (const f of files) {
      const url = storageProvider.publicUrl(f.filename);
      const ref = await projectsService.registerUpload(req.user.id, {
        url,
        mimetype: f.mimetype,
        size: f.size,
      });
      results.push(ref);
    }

    return sendSuccess(res, 201, 'Upload concluído.', { referencias: results });
  } catch (err) {
    next(err);
  }
}
