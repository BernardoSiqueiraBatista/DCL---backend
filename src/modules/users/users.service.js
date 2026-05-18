import * as repo from './users.repository.js';
import { AppError } from '../../middlewares/error.middleware.js';

export async function getProfile(userId) {
  const user = await repo.findById(userId);
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }
  return user;
}
