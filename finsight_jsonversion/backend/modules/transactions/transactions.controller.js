import * as transactionsService from './transactions.service.js';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants.js';

export async function getTransactions(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || req.query.workspaceId || 'personal';
    const limit = parseInt(req.query.limit, 10) || 500;
    const offset = parseInt(req.query.offset, 10) || 0;
    const { type, category, startDate, endDate } = req.query;

    const result = await transactionsService.getTransactions(wsId, { limit, offset, type, category, startDate, endDate });
    
    // If client requested pagination specifically, return object with metadata, otherwise array for legacy client compatibility
    if (req.query.paginate === 'true') {
      return res.status(HTTP_STATUS.OK).json(result);
    }
    return res.status(HTTP_STATUS.OK).json(result.transactions);
  } catch (err) {
    next(err);
  }
}

export async function createTransaction(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || req.body.workspaceId || 'personal';
    const tx = await transactionsService.createTransaction(req.userId, wsId, req.body);
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Transaction saved successfully!',
      transaction: tx
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const tx = await transactionsService.updateTransaction(id, wsId, req.body);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Transaction updated successfully!',
      transaction: tx
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const wsId = req.headers['x-workspace-id'] || 'personal';
    await transactionsService.deleteTransaction(id, wsId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Transaction deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}
