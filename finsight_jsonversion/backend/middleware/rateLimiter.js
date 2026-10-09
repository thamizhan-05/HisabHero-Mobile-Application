import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';

/**
 * In-Memory Sliding Window Rate Limiter
 * Guards sensitive endpoints (login, signup, OTP) without external Redis dependency.
 */
export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 20, message = 'Too many requests' } = {}) {
  const requests = new Map(); // ip -> [timestamps]

  // Periodic cleanup every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
      const valid = timestamps.filter(t => now - t < windowMs);
      if (valid.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, valid);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    // In test environment, bypass rate limiting
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown_ip';
    const now = Date.now();
    const timestamps = requests.get(ip) || [];

    const recent = timestamps.filter(t => now - t < windowMs);

    if (recent.length >= max) {
      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        error: message,
        retryAfterSeconds: Math.ceil((recent[0] + windowMs - now) / 1000)
      });
    }

    recent.push(now);
    requests.set(ip, recent);
    next();
  };
}
