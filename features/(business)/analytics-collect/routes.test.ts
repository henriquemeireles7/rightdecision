import { describe, expect, it, mock } from 'bun:test'
import { asUser, installTestAuth } from '@/features/(business)/test-helpers'
import { apiCall } from '@/platform/test/helpers'

installTestAuth()

const mockCollect = mock(() => Promise.resolve({ collected: 0, errors: 0 }))
mock.module('./service', () => ({ collectAnalytics: mockCollect }))

const { analyticsRoutes } = await import('./routes')
const app = analyticsRoutes

describe('analytics-collect routes — FOUNDER-ONLY gating', () => {
  it('401 without a session', async () => {
    expect((await apiCall(app, 'POST', '/', {})).status).toBe(401)
  })
  it('403 for an authenticated non-permissioned (free) user', async () => {
    expect((await apiCall(app, 'POST', '/', {}, asUser('u1', 'free'))).status).toBe(403)
  })
  it('passes the gate for a manage_content (admin) user', async () => {
    expect((await apiCall(app, 'POST', '/', {}, asUser('a1', 'admin'))).status).toBe(200)
  })
})
