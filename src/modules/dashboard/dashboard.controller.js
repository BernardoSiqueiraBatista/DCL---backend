import * as dashboardService from './dashboard.service.js';
import { sendSuccess } from '../../utils/helpers.js';

export async function get(req, res, next) {
  try {
    const data = await dashboardService.getDashboard(req.user.id);
    return sendSuccess(res, 200, 'Dashboard carregado.', data);
  } catch (err) {
    next(err);
  }
}
