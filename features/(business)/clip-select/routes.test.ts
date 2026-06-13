import { describe, expect, it, mock } from 'bun:test'
import { z } from 'zod'
import { asUser, installTestAuth } from '@/features/(business)/test-helpers'
import { apiCall } from '@/platform/test/helpers'

installTestAuth()

const mockSave = mock(() => Promise.resolve({ clips: [] }))
mock.module('./service', () => ({
  clipSelectInputSchema: z.object({ pipelineRunId: z.string().uuid(), clips: z.array(z.any()) }),
  saveClipSelections: mockSave,
}))

const { clipSelectRoutes } = await import('./routes')
const app = clipSelectRoutes
const UUID = '00000000-0000-0000-0000-000000000000'
const body = { pipelineRunId: UUID, clips: [] }

describe('clip-select routes — FOUNDER-ONLY gating', () => {
  it('401 without a session', async () => {
    expect((await apiCall(app, 'POST', '/', body)).status).toBe(401)
  })
  it('403 for an authenticated non-permissioned (free) user', async () => {
    expect((await apiCall(app, 'POST', '/', body, asUser('u1', 'free'))).status).toBe(403)
  })
  it('passes the gate for a manage_content (admin) user', async () => {
    expect((await apiCall(app, 'POST', '/', body, asUser('a1', 'admin'))).status).toBe(200)
  })
})
