import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import { asUser, installTestAuth } from '@/features/(admin)/test-helpers'

installTestAuth()

const actualVideo = await import('@/providers/video')
mock.module('@/providers/video', () => ({
  ...actualVideo,
  createTusUploadUrl: mock(() =>
    Promise.resolve({ uploadUrl: 'https://upload.test/replay', streamVideoId: 'sv-r' }),
  ),
}))

import { createTestLive, createTestProgram, createTestUser } from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'

const { adminLivesRoutes } = await import('./routes')
const app = adminLivesRoutes

describe('integration: lives routes', () => {
  let adminId: string
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(async () => {
    await teardownTestDb()
    const admin = await createTestUser({ role: 'admin' })
    adminId = admin!.id
  })

  it('gates: 401 without session, 403 for non-admin', async () => {
    const program = await createTestProgram()
    assertError(await apiCall(app, 'GET', `/?programId=${program!.id}`), 'UNAUTHORIZED')
    assertError(
      await apiCall(app, 'GET', `/?programId=${program!.id}`, undefined, asUser('u', 'free')),
      'FORBIDDEN',
    )
  })

  it('schedules, lists, updates and cancels a live', async () => {
    const program = await createTestProgram()
    const createRes = await apiCall(
      app,
      'POST',
      '/',
      {
        programId: program!.id,
        title: 'Monthly Live',
        scheduledAt: '2099-07-06T18:00:00.000Z',
        youtubeUrl: 'https://youtube.com/watch?v=x',
      },
      asUser(adminId),
    )
    expect(createRes.status).toBe(201)
    const live = (createRes.body as { data: { live: { id: string } } }).data.live

    const listRes = await apiCall(
      app,
      'GET',
      `/?programId=${program!.id}&when=upcoming`,
      undefined,
      asUser(adminId),
    )
    const listed = assertSuccess(listRes) as { lives: unknown[] }
    expect(listed.lives).toHaveLength(1)

    assertSuccess(
      await apiCall(
        app,
        'PATCH',
        `/${live.id}`,
        { youtubeUrl: 'https://youtube.com/watch?v=y' },
        asUser(adminId),
      ),
    )
    const cancelRes = await apiCall(app, 'POST', `/${live.id}/cancel`, undefined, asUser(adminId))
    const cancelled = assertSuccess(cancelRes) as { live: { cancelledAt: string | null } }
    expect(cancelled.live.cancelledAt).not.toBeNull()
  })

  it('hands out a replay tus upload URL', async () => {
    const program = await createTestProgram()
    const live = await createTestLive(program!.id)
    const res = await apiCall(
      app,
      'POST',
      `/${live!.id}/replay-upload-url`,
      { uploadLengthBytes: 123456 },
      asUser(adminId),
    )
    const data = assertSuccess(res) as { uploadUrl: string }
    expect(data.uploadUrl).toBe('https://upload.test/replay')
  })

  it('400s invalid input', async () => {
    expect((await apiCall(app, 'POST', '/', { title: 'no program' }, asUser(adminId))).status).toBe(
      400,
    )
    expect((await apiCall(app, 'GET', '/', undefined, asUser(adminId))).status).toBe(400)
    expect((await apiCall(app, 'POST', '/nope/cancel', undefined, asUser(adminId))).status).toBe(
      400,
    )
  })
})
