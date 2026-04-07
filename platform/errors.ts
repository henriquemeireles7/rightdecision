import type { Context } from 'hono'

export const errors = {
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401, message: 'Authentication required' },
  FORBIDDEN: { code: 'FORBIDDEN', status: 403, message: 'Insufficient permissions' },
  SESSION_EXPIRED: { code: 'SESSION_EXPIRED', status: 401, message: 'Session expired' },
  PAYMENT_FAILED: {
    code: 'PAYMENT_FAILED',
    status: 402,
    message: 'Payment could not be processed',
  },
  NO_SUBSCRIPTION: { code: 'NO_SUBSCRIPTION', status: 403, message: 'Active purchase required' },
  NOT_FOUND: { code: 'NOT_FOUND', status: 404, message: 'Resource not found' },
  LESSON_LOCKED: { code: 'LESSON_LOCKED', status: 403, message: 'Complete previous lessons first' },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 400, message: 'Invalid input' },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', status: 500, message: 'Something went wrong' },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    status: 429,
    message: 'Too many requests, try again later',
  },
  ONBOARDING_SESSION_EXPIRED: {
    code: 'ONBOARDING_SESSION_EXPIRED',
    status: 410,
    message: 'Onboarding session has expired, please start again',
  },
  ONBOARDING_SESSION_NOT_FOUND: {
    code: 'ONBOARDING_SESSION_NOT_FOUND',
    status: 404,
    message: 'Onboarding session not found',
  },
  ONBOARDING_INCOMPLETE: {
    code: 'ONBOARDING_INCOMPLETE',
    status: 400,
    message: 'Please complete all onboarding steps first',
  },
  WIN_RATE_LIMITED: {
    code: 'WIN_RATE_LIMITED',
    status: 429,
    message: 'You can share up to 3 wins per day',
  },
  WIN_TOO_LONG: {
    code: 'WIN_TOO_LONG',
    status: 400,
    message: 'Win description must be 280 characters or less',
  },
  SUBSCRIPTION_REQUIRED: {
    code: 'SUBSCRIPTION_REQUIRED',
    status: 403,
    message: 'An active subscription is required',
  },
  SUBSCRIPTION_NOT_FOUND: {
    code: 'SUBSCRIPTION_NOT_FOUND',
    status: 404,
    message: 'Subscription not found',
  },
  MODULE_LOCKED: {
    code: 'MODULE_LOCKED',
    status: 403,
    message: 'Complete previous classes to unlock this content',
  },
  BOOKMARK_DUPLICATE: {
    code: 'BOOKMARK_DUPLICATE',
    status: 409,
    message: 'This class is already bookmarked',
  },
  CLASS_NOT_FOUND: {
    code: 'CLASS_NOT_FOUND',
    status: 404,
    message: 'Class not found',
  },
  COURSE_NOT_FOUND: {
    code: 'COURSE_NOT_FOUND',
    status: 404,
    message: 'Course not found',
  },
} as const satisfies Record<string, { code: string; status: number; message: string }>

export type ErrorCode = keyof typeof errors

export function throwError(c: Context, errorCode: ErrorCode, details?: string) {
  const { status, ...body } = errors[errorCode]
  return c.json({ ok: false as const, ...body, ...(details ? { details } : {}) }, status as any)
}
