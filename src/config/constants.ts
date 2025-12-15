export const API_VERSION = 'v1'

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const

export const CURRENCY = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
} as const

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Groceries', icon: '🛒', color: '#10b981' },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6' },
  { name: 'Housing & Utilities', icon: '🏠', color: '#f59e0b' },
  { name: 'Healthcare', icon: '⚕️', color: '#ef4444' },
  { name: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { name: 'Education', icon: '📚', color: '#14b8a6' },
  { name: 'Other', icon: '📌', color: '#6b7280' },
] as const

export const BUDGET_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const

export const RECURRENCE_PATTERNS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
} as const

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  AUTH_MAX_REQUESTS: 5,
} as const
