import * as usersService from './users.service.js';
import { sendSuccess } from '../../utils/helpers.js';

export async function getProfile(req, res, next) {
  try {
    const user = await usersService.getProfile(req.user.id);
    return sendSuccess(res, 200, 'Perfil carregado.', { user });
  } catch (err) {
    next(err);
  }
}
