import { describe, expect, it, mock } from 'bun:test'
import { asUser, installTestAuth } from '@/features/(business)/test-helpers'
import { apiCall } from '@/platform/test/helpers'

installTestAuth()

mock.module('./service', () => ({
  checkHealth: mock(() => Promise.resolve({ ok: true, providers: {} })),
}))

const { healthRoutes } = await import('./routes')
const app = healthRoutes

describe('health routes — FOUNDER-ONLY gating', () => {
  it('401 without a session', async () => {
    expect((await apiCall(app, 'GET', '/')).status).toBe(401)
  })
  it('403 for an authenticated non-permissioned (free) user', async () => {
    expect((await apiCall(app, 'GET', '/', undefined, asUser('u1', 'free'))).status).toBe(403)
  })
  it('passes the gate for a manage_content (admin) user', async () => {
    expect((await apiCall(app, 'GET', '/', undefined, asUser('a1', 'admin'))).status).toBe(200)
  })
})
