import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import { asUser, installTestAuth } from '@/features/(admin)/test-helpers'

installTestAuth()

const actualStorage = await import('@/providers/storage')
mock.module('@/providers/storage', () => ({
  ...actualStorage,
  getUploadUrl: mock(() => Promise.resolve('https://r2.test/put-video')),
}))

import { db } from '@/platform/db/client'
import { clips, posts } from '@/platform/db/schema'
import {
  createTestPipelineRun,
  createTestPlatformAccount,
  createTestUser,
} from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'

const { adminDistributionRoutes } = await import('./routes')
const app = adminDistributionRoutes

async function insertClip(runId: string, overrides: Partial<typeof clips.$inferInsert> = {}) {
  const [clip] = await db
    .insert(clips)
    .values({
      pipelineRunId: runId,
      sourceTimestampStart: 0,
      sourceTimestampEnd: 30,
      duration: 30,
      approved: false,
      ...overrides,
    })
    .returning()
  return clip!
}

describe('integration: admin distribution routes', () => {
  let adminId: string
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(async () => {
    await teardownTestDb()
    const admin = await createTestUser({ role: 'admin' })
    adminId = admin!.id
  })

  it('gates: 401 without session, 403 for non-admin', async () => {
    assertError(await apiCall(app, 'GET', '/runs/x'), 'UNAUTHORIZED')
    assertError(
      await apiCall(
        app,
        'POST',
        '/upload-url',
        { fileName: 'a.mp4', mimeType: 'video/mp4' },
        asUser('u', 'pro'),
      ),
      'FORBIDDEN',
    )
  })

  it('issues a presigned PUT URL with a pipeline/ key for a supported format', async () => {
    const res = await apiCall(
      app,
      'POST',
      '/upload-url',
      { fileName: 'My Episode.mp4', mimeType: 'video/mp4' },
      asUser(adminId),
    )
    const data = assertSuccess(res) as { uploadUrl: string; fileKey: string }
    expect(data.uploadUrl).toBe('https://r2.test/put-video')
    expect(data.fileKey).toMatch(/^pipeline\/[0-9a-f-]{36}\/My-Episode\.mp4$/)
  })

  it('rejects an unsupported video format before presigning', async () => {
    assertError(
      await apiCall(
        app,
        'POST',
        '/upload-url',
        { fileName: 'notes.txt', mimeType: 'text/plain' },
        asUser(adminId),
      ),
      'TRANSCRIBE_INVALID_FORMAT',
    )
  })

  it('400s invalid input (missing body, bad uuid param)', async () => {
    expect((await apiCall(app, 'POST', '/upload-url', {}, asUser(adminId))).status).toBe(400)
    expect((await apiCall(app, 'GET', '/runs/not-a-uuid', undefined, asUser(adminId))).status).toBe(
      400,
    )
  })

  it('aggregates run + clips + posts in one read', async () => {
    const run = await createTestPipelineRun({ status: 'selected' })
    const account = await createTestPlatformAccount()
    const clip = await insertClip(run!.id, { suggestedTitle: 'Hook' })
    await db
      .insert(posts)
      .values({ clipId: clip.id, platformAccountId: account!.id, status: 'scheduled' })

    const res = await apiCall(app, 'GET', `/runs/${run!.id}`, undefined, asUser(adminId))
    const data = assertSuccess(res) as {
      run: { id: string }
      clips: Array<{ id: string }>
      posts: Array<{ clipId: string }>
    }
    expect(data.run.id).toBe(run!.id)
    expect(data.clips).toHaveLength(1)
    expect(data.posts).toHaveLength(1)
    expect(data.posts[0]?.clipId).toBe(clip.id)
  })

  it('404s an unknown run', async () => {
    assertError(
      await apiCall(
        app,
        'GET',
        '/runs/00000000-0000-0000-0000-000000000000',
        undefined,
        asUser(adminId),
      ),
      'NOT_FOUND',
    )
  })

  it('approval gate: flips clips.approved true/false scoped to the run', async () => {
    const run = await createTestPipelineRun({ status: 'selected' })
    const clip = await insertClip(run!.id)

    const approveRes = await apiCall(
      app,
      'PATCH',
      `/runs/${run!.id}/clips/${clip.id}/approval`,
      { approved: true },
      asUser(adminId),
    )
    const approved = assertSuccess(approveRes) as { clip: { approved: boolean } }
    expect(approved.clip.approved).toBe(true)

    const rejectRes = await apiCall(
      app,
      'PATCH',
      `/runs/${run!.id}/clips/${clip.id}/approval`,
      { approved: false },
      asUser(adminId),
    )
    const rejected = assertSuccess(rejectRes) as { clip: { approved: boolean } }
    expect(rejected.clip.approved).toBe(false)
  })

  it('approval 404s a clip that does not belong to the run', async () => {
    const run = await createTestPipelineRun({ status: 'selected' })
    const otherRun = await createTestPipelineRun({ status: 'selected' })
    const clip = await insertClip(otherRun!.id)

    assertError(
      await apiCall(
        app,
        'PATCH',
        `/runs/${run!.id}/clips/${clip.id}/approval`,
        { approved: true },
        asUser(adminId),
      ),
      'POST_CLIP_NOT_FOUND',
    )
  })
})
