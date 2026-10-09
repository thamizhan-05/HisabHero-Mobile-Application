/**
 * Structured Application Logger
 * Automatically sanitizes sensitive keys (password, token, apiKey, secret)
 */

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'key', 'apikey', 'jwt', 'auth', 'cookie'];

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some(sk => k.toLowerCase().includes(sk))) {
      clean[k] = '[REDACTED]';
    } else if (typeof v === 'object') {
      clean[k] = sanitize(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

export const logger = {
  info(message, meta = null) {
    if (meta) {
      console.log(`[INFO] ${message}`, sanitize(meta));
    } else {
      console.log(`[INFO] ${message}`);
    }
  },
  warn(message, meta = null) {
    if (meta) {
      console.warn(`[WARN] ${message}`, sanitize(meta));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },
  error(message, err = null) {
    if (err) {
      console.error(`[ERROR] ${message}:`, err.message || err);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }
};
