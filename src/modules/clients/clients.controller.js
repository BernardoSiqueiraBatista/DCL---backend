import * as clientsService from './clients.service.js';
import { sendSuccess } from '../../utils/helpers.js';

export async function create(req, res, next) {
  try {
    const client = await clientsService.create(req.user.id, req.body);
    return sendSuccess(res, 201, 'Cliente criado com sucesso.', client);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const result = await clientsService.list(req.user.id, req.query);
    return sendSuccess(res, 200, 'Clientes listados.', result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const client = await clientsService.getById(req.user.id, req.params.id);
    return sendSuccess(res, 200, 'Cliente carregado.', client);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const client = await clientsService.update(req.user.id, req.params.id, req.body);
    return sendSuccess(res, 200, 'Cliente atualizado.', client);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const force = req.query.force === 'true' || req.body?.force === true;
    const result = await clientsService.remove(req.user.id, req.params.id, { force });
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    next(err);
  }
}
