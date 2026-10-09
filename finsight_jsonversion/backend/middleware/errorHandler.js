import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

/**
 * Centralized Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.url} failed`, err);

  const status = err.status || err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const isProd = config.nodeEnv === 'production';

  res.status(status).json({
    success: false,
    code: err.code || ERROR_CODES.INTERNAL_ERROR,
    error: err.message || 'An unexpected internal error occurred.',
    ...(isProd ? {} : { stack: err.stack })
  });
}

/**
 * 404 Route Not Found Handler for API requests
 */
export function notFoundHandler(req, res) {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
}
