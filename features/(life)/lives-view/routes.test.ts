import { afterAll, describe, expect, mock, test } from 'bun:test'
import { setV2CutoverOverrideForTests } from '@/platform/auth/enrollment'
import {
  createTestEnrollment,
  createTestLive,
  createTestProgram,
  createTestUser,
} from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess, stubAuth } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import * as realVideo from '@/providers/video'

const signPlaybackTokenMock = mock((_videoId: string) => Promise.resolve('replay-token'))
mock.module('@/providers/video', () => ({
  ...realVideo,
  signPlaybackToken: signPlaybackTokenMock,
}))
afterAll(() => {
  mock.module('@/providers/video', () => realVideo)
})

const { createLivesViewRoutes } = await import('./routes')

await setupTestDb()
setV2CutoverOverrideForTests(true)
afterAll(() => {
  setV2CutoverOverrideForTests(undefined)
  return teardownTestDb()
})

describe('integration: lives-view routes', () => {
  test('GET / requires authentication', async () => {
    const app = createLivesViewRoutes()

    assertError(await apiCall(app, 'GET', '/'), 'UNAUTHORIZED')
  })

  test('GET / lists only the enrolled programs lives with states', async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id)
    const live = await createTestLive(program!.id, {
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    const app = createLivesViewRoutes({ auth: stubAuth(user!) })

    const response = await apiCall(app, 'GET', '/')

    const data = assertSuccess(response) as { lives: Array<{ id: string; state: string }> }
    expect(data.lives.map((l) => l.id)).toContain(live!.id)
    expect(data.lives.find((l) => l.id === live!.id)?.state).toBe('upcoming')
  })

  test('GET /:id is enrollment-gated', async () => {
    const stranger = await createTestUser()
    const program = await createTestProgram()
    const live = await createTestLive(program!.id)
    const app = createLivesViewRoutes({ auth: stubAuth(stranger!) })

    assertError(await apiCall(app, 'GET', `/${live!.id}`), 'ENROLLMENT_REQUIRED')
  })

  test('GET /:id rejects invalid uuids with 400', async () => {
    const user = await createTestUser()
    const app = createLivesViewRoutes({ auth: stubAuth(user!) })

    expect((await apiCall(app, 'GET', '/not-a-uuid')).status).toBe(400)
  })

  test('GET /:id/replay returns the gated playback token', async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id)
    const live = await createTestLive(program!.id, {
      scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      replayStatus: 'ready',
      replayStreamVideoId: 'replay-vid',
    })
    const app = createLivesViewRoutes({ auth: stubAuth(user!) })

    const response = await apiCall(app, 'GET', `/${live!.id}/replay`)

    const data = assertSuccess(response) as { playbackToken: string }
    expect(data.playbackToken).toBe('replay-token')
  })

  test('GET /:id/replay is VIDEO_NOT_READY before the replay exists', async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id)
    const live = await createTestLive(program!.id, {
      scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    })
    const app = createLivesViewRoutes({ auth: stubAuth(user!) })

    assertError(await apiCall(app, 'GET', `/${live!.id}/replay`), 'VIDEO_NOT_READY')
  })
})
