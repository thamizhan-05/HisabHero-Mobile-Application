import * as dashboardService from './dashboard.service.js';
import { HTTP_STATUS } from '../../config/constants.js';

export async function getStats(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const wsType = req.activeWorkspace?.type || 'personal';
    const stats = await dashboardService.getDashboardStats(wsId, wsType);
    return res.status(HTTP_STATUS.OK).json(stats);
  } catch (err) {
    next(err);
  }
}

export async function getHealth(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const wsType = req.activeWorkspace?.type || 'personal';
    const health = await dashboardService.getDashboardHealth(wsId, wsType);
    return res.status(HTTP_STATUS.OK).json(health);
  } catch (err) {
    next(err);
  }
}

export async function getHighValuePending(req, res, next) {
  try {
    return res.status(HTTP_STATUS.OK).json({
      count: 0,
      totalAmount: 0,
      items: []
    });
  } catch (err) {
    next(err);
  }
}
