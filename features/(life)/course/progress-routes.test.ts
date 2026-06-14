import { afterAll, describe, expect, it, mock } from 'bun:test'
import type { MiddlewareHandler } from 'hono'
import { apiCall } from '@/platform/test/helpers'
import { clearAuthOverride, requireAuthProxy, setAuthOverride } from '@/platform/test/mocks'
import type { AppEnv } from '@/platform/types'

// Stub auth via the passthrough proxy (mock.module leaks process-wide — the override is
// cleared in afterAll so later files' real-requireAuth 401 tests aren't disabled).
const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set('user', { id: 'u1', email: 'u1@test.local', name: 'U', role: 'pro' })
  c.set('session', {})
  await next()
}
mock.module('@/platform/auth/middleware', () => ({ requireAuth: requireAuthProxy }))
setAuthOverride(requireAuth)
afterAll(clearAuthOverride)

mock.module('./progress', () => ({
  markClassComplete: mock(() => Promise.resolve()),
  getUserProgress: mock(() => Promise.resolve([])),
  getOverallProgress: mock(() => Promise.resolve({ percent: 0 })),
  getModuleProgress: mock(() => Promise.resolve({ moduleNum: 1, completed: 0 })),
}))

const { progressApiRoutes } = await import('./progress-routes')
const app = progressApiRoutes

describe('progress routes — :moduleNum param validation', () => {
  it('400s a non-numeric moduleNum instead of passing NaN to the service', async () => {
    expect((await apiCall(app, 'GET', '/module/not-a-number')).status).toBe(400)
  })

  it('accepts a numeric moduleNum', async () => {
    expect((await apiCall(app, 'GET', '/module/2')).status).toBe(200)
  })
})
