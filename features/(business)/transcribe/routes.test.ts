import { describe, expect, it, mock } from 'bun:test'
import { asUser, installTestAuth } from '@/features/(business)/test-helpers'
import { apiCall } from '@/platform/test/helpers'

installTestAuth()

const mockStart = mock(() => Promise.resolve({ run: { id: 'run-1', status: 'queued' } }))
const mockProcess = mock(() => Promise.resolve({ run: { id: 'run-1', status: 'transcribing' } }))
const mockGet = mock(() => Promise.resolve({ run: { id: 'run-1' } }))
const mockClips = mock(() => Promise.resolve({ clips: [] }))
const mockList = mock(() => Promise.resolve({ runs: [], total: 0, page: 1, perPage: 20 }))
mock.module('./service', () => ({
  startTranscription: mockStart,
  processTranscription: mockProcess,
  getPipelineRun: mockGet,
  getClipsForRun: mockClips,
  listPipelineRuns: mockList,
}))

const { transcribeRoutes } = await import('./routes')
const app = transcribeRoutes

const admin = (id = 'a1') => asUser(id, 'admin')
const free = (id = 'u1') => asUser(id, 'free')
const UUID = '00000000-0000-0000-0000-000000000000'

describe('transcribe routes — FOUNDER-ONLY gating', () => {
  it('401 without a session', async () => {
    const res = await apiCall(app, 'GET', '/')
    expect(res.status).toBe(401)
  })

  it('403 for an authenticated non-permissioned (free) user', async () => {
    const res = await apiCall(app, 'GET', '/', undefined, free())
    expect(res.status).toBe(403)
    const post = await apiCall(app, 'POST', '/', { videoUrl: 'episodes/ep1.mp4' }, free())
    expect(post.status).toBe(403)
  })

  it('passes the gate for a manage_content (admin) user', async () => {
    const res = await apiCall(app, 'GET', '/', undefined, admin())
    expect(res.status).toBe(200)
  })
})

describe('transcribe routes — input validation', () => {
  it('accepts a valid episodes/ storage key', async () => {
    const res = await apiCall(app, 'POST', '/', { videoUrl: 'episodes/ep1.mp4' }, admin())
    expect(res.status).toBe(201)
  })

  it('400s a videoUrl that steers to an arbitrary key', async () => {
    for (const videoUrl of [
      '../secrets/x.mp4',
      'other/ep1.mp4',
      'episodes/../x.mp4',
      'episodes/ep1.txt',
    ]) {
      const res = await apiCall(app, 'POST', '/', { videoUrl }, admin())
      expect(res.status).toBe(400)
    }
  })

  it('400s an unknown config field / wrong type', async () => {
    const res = await apiCall(
      app,
      'POST',
      '/',
      { videoUrl: 'episodes/ep1.mp4', config: { maxClipsPerEpisode: 'lots' } },
      admin(),
    )
    expect(res.status).toBe(400)
  })

  it('400s a non-uuid :id instead of leaking a pg cast error', async () => {
    expect((await apiCall(app, 'GET', '/not-a-uuid', undefined, admin())).status).toBe(400)
    expect((await apiCall(app, 'POST', '/not-a-uuid/process', undefined, admin())).status).toBe(400)
    expect((await apiCall(app, 'GET', '/not-a-uuid/clips', undefined, admin())).status).toBe(400)
  })

  it('accepts a uuid :id', async () => {
    expect((await apiCall(app, 'GET', `/${UUID}`, undefined, admin())).status).toBe(200)
  })
})
