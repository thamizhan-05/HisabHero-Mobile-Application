import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

function renderErrorPage(status, message) {
  const titles = { 403: 'Access Denied', 404: 'Page Not Found', 500: 'Internal Server Error' };
  const title = titles[status] || 'Error';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${status} — ${title} | HisabHero</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: white; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 480px; text-align: center; border: 1px solid #e2e8f0; }
    .status { font-size: 3.5rem; font-weight: 800; color: #0284c7; margin: 0; }
    h1 { font-size: 1.5rem; margin: 0.5rem 0 1rem; color: #0f172a; }
    p { color: #64748b; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem; }
    a { display: inline-block; background: #0284c7; color: white; padding: 0.65rem 1.25rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="status">${status}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">Return to Dashboard</a>
  </div>
</body>
</html>`;
}

/**
 * Centralized Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.url} failed:`, err);

  const status = err.status || err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const isProd = config.nodeEnv === 'production';

  // In production, mask 5xx errors to prevent leaking internal paths or database topology
  const publicMessage = isProd && status >= 500
    ? 'An unexpected internal error occurred. Please try again later.'
    : (err.message || 'An error occurred.');

  if (req.accepts && req.accepts('html') && !req.originalUrl.startsWith('/api/')) {
    return res.status(status).send(renderErrorPage(status, publicMessage));
  }

  res.status(status).json({
    success: false,
    code: err.code || ERROR_CODES.INTERNAL_ERROR,
    error: publicMessage,
    ...(isProd ? {} : { stack: err.stack })
  });
}

/**
 * 404 Route Not Found Handler for API requests
 */
export function notFoundHandler(req, res) {
  if (req.accepts && req.accepts('html') && !req.originalUrl.startsWith('/api/')) {
    return res.status(HTTP_STATUS.NOT_FOUND).send(renderErrorPage(404, 'The requested page does not exist.'));
  }

  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
}
