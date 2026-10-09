/**
 * Centralized Input Validation Utilities
 * Lightweight, zero-dependency validation for API request sanitization.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

export function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return UUID_REGEX.test(str.trim());
}

export function isValidDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (!DATE_REGEX.test(dateStr.trim())) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

export function isValidAmount(amount, allowZero = false) {
  const num = Number(amount);
  if (!isFinite(num) || isNaN(num)) return false;
  return allowZero ? num >= 0 : num > 0;
}

/**
 * Validates an object against a simple schema rule set
 * rules: {
 *   fieldName: { required: true, type: 'string' | 'number' | 'email' | 'uuid' | 'date', minLength: 3, ... }
 * }
 */
export function validate(data, rules) {
  const errors = [];

  for (const [field, rule] of Object.entries(rules)) {
    const val = data ? data[field] : undefined;

    // Required check
    if (rule.required) {
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
        errors.push(`${field} is required.`);
        continue;
      }
    }

    if (val === undefined || val === null) continue;

    // Type checks
    if (rule.type === 'email' && !isValidEmail(val)) {
      errors.push(`${field} must be a valid email address.`);
    } else if (rule.type === 'uuid' && !isValidUUID(val)) {
      errors.push(`${field} must be a valid UUID.`);
    } else if (rule.type === 'date' && !isValidDateString(val)) {
      errors.push(`${field} must be a valid date in YYYY-MM-DD format.`);
    } else if (rule.type === 'number') {
      const num = Number(val);
      if (isNaN(num) || !isFinite(num)) {
        errors.push(`${field} must be a valid number.`);
      } else {
        if (rule.min !== undefined && num < rule.min) errors.push(`${field} must be at least ${rule.min}.`);
        if (rule.max !== undefined && num > rule.max) errors.push(`${field} must be at most ${rule.max}.`);
      }
    } else if (rule.type === 'string') {
      if (typeof val !== 'string') {
        errors.push(`${field} must be a string.`);
      } else {
        if (rule.minLength !== undefined && val.trim().length < rule.minLength) {
          errors.push(`${field} must have at least ${rule.minLength} characters.`);
        }
        if (rule.enum && !rule.enum.includes(val)) {
          errors.push(`${field} must be one of: ${rule.enum.join(', ')}.`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
