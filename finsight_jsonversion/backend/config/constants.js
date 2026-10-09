/**
 * Application Constants
 * Standardized enumerations, roles, categories, and error codes.
 */

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  ACCOUNTANT: 'accountant',
  EMPLOYEE: 'employee'
};

export const WORKSPACE_TYPES = {
  PERSONAL: 'personal',
  BUSINESS: 'business'
};

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer'
};

export const TRANSACTION_CATEGORIES = [
  'Food & Dining',
  'Rent & Utilities',
  'Groceries',
  'Technology',
  'Consulting & Sales',
  'Salary',
  'Transportation',
  'Health & Medical',
  'Shopping',
  'Fuel & Transport',
  'Payroll & Salary',
  'Rent & Office',
  'Meals & Refreshments',
  'Utilities & Tech',
  'Inventory & Supplies',
  'Other'
];

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

export const ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  WORKSPACE_FORBIDDEN: 'WORKSPACE_FORBIDDEN',
  WORKSPACE_NOT_FOUND: 'WORKSPACE_NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};
