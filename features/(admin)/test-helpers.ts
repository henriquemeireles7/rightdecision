import { afterAll, mock } from 'bun:test'
import type { MiddlewareHandler } from 'hono'
import { throwError } from '@/platform/errors'
import { clearAuthOverride, requireAuthProxy, setAuthOverride } from '@/platform/test/mocks'
import type { AppEnv, AppUser } from '@/platform/types'

/**
 * Test-only auth: replaces requireAuth with a middleware that reads the user from
 * x-test-user-id / x-test-user-role headers. requirePermission stays REAL, so the
 * admin-role gate is actually exercised in route tests.
 *
 * MUST be called BEFORE importing the route module under test (mock.module rule).
 */
export function installTestAuth() {
  const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
    const id = c.req.header('x-test-user-id')
    if (!id) return throwError(c, 'UNAUTHORIZED')
    const role = (c.req.header('x-test-user-role') ?? 'free') as AppUser['role']
    c.set('user', { id, email: `${id}@test.local`, name: 'Test User', role })
    c.set('session', {})
    await next()
  }
  // Passthrough proxy + afterAll cleanup — mock.module leaks process-wide, so the
  // override must be cleared or later files' real-requireAuth 401 tests break.
  mock.module('@/platform/auth/middleware', () => ({ requireAuth: requireAuthProxy }))
  setAuthOverride(requireAuth)
  afterAll(clearAuthOverride)
}

/** Request headers for an authenticated test user. */
export function asUser(id: string, role: AppUser['role'] = 'admin'): Record<string, string> {
  return { 'x-test-user-id': id, 'x-test-user-role': role }
}
