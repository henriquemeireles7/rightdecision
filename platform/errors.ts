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
} as const satisfies Record<string, { code: string; status: number; message: string }>

export type ErrorCode = keyof typeof errors

export function throwError(c: Context, errorCode: ErrorCode, details?: string) {
  const { status, ...body } = errors[errorCode]
  return c.json({ ok: false as const, ...body, ...(details ? { details } : {}) }, status as any)
}
