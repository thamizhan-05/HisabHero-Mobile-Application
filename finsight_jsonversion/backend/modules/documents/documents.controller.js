import * as documentsService from './documents.service.js';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants.js';

export async function uploadPreview(req, res, next) {
  try {
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        code: ERROR_CODES.VALIDATION_FAILED,
        error: 'No document file uploaded.'
      });
    }

    const wsId = req.headers['x-workspace-id'] || 'personal';
    const result = await documentsService.processDocumentBuffer(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      wsId
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      transactions: result.extracted || [],
      extracted: result.extracted || [],
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadCommit(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const { fileName, parserUsed, transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        code: ERROR_CODES.VALIDATION_FAILED,
        error: 'Transactions list is required to commit.'
      });
    }

    const result = await documentsService.commitExtractedTransactions(req.userId, wsId, {
      fileName,
      parserUsed,
      transactions
    });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: `Successfully imported ${result.committedCount} transactions!`,
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export async function getDocuments(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const docs = await documentsService.getDocuments(wsId);
    return res.status(HTTP_STATUS.OK).json(docs);
  } catch (err) {
    next(err);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params;
    const wsId = req.headers['x-workspace-id'] || 'personal';
    await documentsService.deleteDocument(id, wsId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Document removed successfully.'
    });
  } catch (err) {
    next(err);
  }
}
