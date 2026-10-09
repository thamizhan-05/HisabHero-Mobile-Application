/**
 * Currency & Monetary Precision Utilities
 * Prevents IEEE-754 floating point drift using integer minor-units (paise/cents)
 * and safe decimal rounding.
 */

/**
 * Rounds a number to exact decimal places using epsilon safety
 */
export function safeRound(val, decimals = 2) {
  const num = Number(val || 0);
  if (!isFinite(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Converts a rupee/dollar amount to integer minor units (paise/cents)
 */
export function toMinorUnits(amount) {
  const num = Number(amount || 0);
  if (!isFinite(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer minor units back to standard currency decimal
 */
export function fromMinorUnits(minorUnits) {
  const num = Number(minorUnits || 0);
  if (!isFinite(num)) return 0;
  return safeRound(num / 100, 2);
}

/**
 * Adds two monetary amounts with zero floating-point error
 */
export function addMoney(a, b) {
  return fromMinorUnits(toMinorUnits(a) + toMinorUnits(b));
}

/**
 * Subtracts two monetary amounts with zero floating-point error
 */
export function subtractMoney(a, b) {
  return fromMinorUnits(toMinorUnits(a) - toMinorUnits(b));
}

/**
 * Multiplies a monetary amount by a multiplier (e.g. quantity or tax rate)
 */
export function multiplyMoney(amount, multiplier) {
  const minor = toMinorUnits(amount);
  return fromMinorUnits(Math.round(minor * Number(multiplier || 0)));
}

/**
 * Calculates a percentage of an amount
 */
export function percentageOf(amount, percent) {
  const minor = toMinorUnits(amount);
  return fromMinorUnits(Math.round(minor * (Number(percent || 0) / 100)));
}

/**
 * Formats a monetary amount into Indian standard format (₹XX,XX,XXX.XX)
 */
export function formatINR(val, includeSymbol = true) {
  const num = safeRound(val, 2);
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return includeSymbol ? `₹${formatted}` : formatted;
}
