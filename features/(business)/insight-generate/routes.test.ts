import { describe, expect, it, mock } from 'bun:test'
import { z } from 'zod'
import { asUser, installTestAuth } from '@/features/(business)/test-helpers'
import { apiCall } from '@/platform/test/helpers'

installTestAuth()

const mockList = mock(() => Promise.resolve({ insights: [], total: 0, page: 1, perPage: 20 }))
mock.module('./service', () => ({
  insightInputSchema: z.object({ recommendation: z.string() }),
  saveInsight: mock(() => Promise.resolve({ insight: { id: 'i1' } })),
  listInsights: mockList,
}))

const { insightRoutes } = await import('./routes')
const app = insightRoutes

describe('insight-generate routes — FOUNDER-ONLY gating', () => {
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
