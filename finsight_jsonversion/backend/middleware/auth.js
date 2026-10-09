import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';

const revokedTokens = new Set();

export function revokeToken(token) {
  if (token) revokedTokens.add(token);
}

export function isTokenRevoked(token) {
  return revokedTokens.has(token);
}

/**
 * JWT Authentication Middleware
 * Enforces valid bearer token and attaches req.userId.
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      code: ERROR_CODES.AUTH_REQUIRED,
      error: 'Authorization token required. Please sign in.'
    });
  }

  const token = authHeader.split(' ')[1];
  if (revokedTokens.has(token)) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      code: ERROR_CODES.TOKEN_EXPIRED,
      error: 'Token has been revoked. Please sign in again.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.userId;
    req.token = token;
    next();
  } catch (err) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      code: ERROR_CODES.TOKEN_EXPIRED,
      error: 'Session expired or invalid token. Please sign in again.'
    });
  }
}
