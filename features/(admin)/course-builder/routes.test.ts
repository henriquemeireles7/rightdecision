import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import { asUser, installTestAuth } from '@/features/(admin)/test-helpers'

installTestAuth()

// Mock providers BEFORE importing routes (which import the services).
const actualVideo = await import('@/providers/video')
const mockCreateTusUploadUrl = mock(() =>
  Promise.resolve({ uploadUrl: 'https://upload.test/tus', streamVideoId: 'sv-route' }),
)
mock.module('@/providers/video', () => ({
  ...actualVideo,
  createTusUploadUrl: mockCreateTusUploadUrl,
  generateCaptions: mock(() => Promise.resolve({ language: 'en', status: 'inprogress' })),
}))

const actualImageGen = await import('@/providers/image-gen')
const mockGenerateCoverImage = mock(() => Promise.resolve(new Uint8Array([7])))
mock.module('@/providers/image-gen', () => ({
  ...actualImageGen,
  generateCoverImage: mockGenerateCoverImage,
}))

const actualStorage = await import('@/providers/storage')
mock.module('@/providers/storage', () => ({
  ...actualStorage,
  upload: mock((key: string) => Promise.resolve(key)),
}))

import {
  createTestCourse,
  createTestLesson,
  createTestModule,
  createTestUser,
} from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'

const { adminCourseBuilderRoutes } = await import('./routes')

const app = adminCourseBuilderRoutes
const MISSING_ID = '00000000-0000-0000-0000-000000000000'

describe('integration: course-builder routes', () => {
  let adminId: string
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(async () => {
    await teardownTestDb()
    const admin = await createTestUser({ role: 'admin' })
    adminId = admin!.id
  })

  it('401 UNAUTHORIZED without a session', async () => {
    assertError(await apiCall(app, 'GET', '/courses'), 'UNAUTHORIZED')
  })

  it('403 FORBIDDEN for non-admin roles', async () => {
    assertError(await apiCall(app, 'GET', '/courses', undefined, asUser('u1', 'free')), 'FORBIDDEN')
    assertError(await apiCall(app, 'GET', '/courses', undefined, asUser('u1', 'pro')), 'FORBIDDEN')
    assertError(
      await apiCall(app, 'POST', '/courses', { slug: 's', title: 't' }, asUser('u1', 'pro')),
      'FORBIDDEN',
    )
  })

  it('creates and lists courses as admin', async () => {
    const createRes = await apiCall(
      app,
      'POST',
      '/courses',
      { slug: 'route-course', title: 'Route Course' },
      asUser(adminId),
    )
    expect(createRes.status).toBe(201)

    const listRes = await apiCall(app, 'GET', '/courses', undefined, asUser(adminId))
    const data = assertSuccess(listRes) as { courses: Array<{ slug: string }> }
    expect(data.courses.map((c) => c.slug)).toContain('route-course')
  })

  it('400s on invalid create-course input', async () => {
    const res = await apiCall(app, 'POST', '/courses', { title: 'no slug' }, asUser(adminId))
    expect(res.status).toBe(400)
  })

  it('400s on a non-uuid path param instead of leaking a pg cast error', async () => {
    const res = await apiCall(app, 'GET', '/courses/not-a-uuid', undefined, asUser(adminId))
    expect(res.status).toBe(400)
  })

  it('gets a course with nested modules, 404s when missing', async () => {
    const course = await createTestCourse()
    await createTestModule(course!.id)
    const res = await apiCall(app, 'GET', `/courses/${course!.id}`, undefined, asUser(adminId))
    const data = assertSuccess(res) as { modules: unknown[] }
    expect(data.modules).toHaveLength(1)

    assertError(
      await apiCall(app, 'GET', `/courses/${MISSING_ID}`, undefined, asUser(adminId)),
      'COURSE_NOT_FOUND',
    )
  })

  it('updates, archives a course and creates/reorders modules', async () => {
    const course = await createTestCourse()
    assertSuccess(
      await apiCall(app, 'PATCH', `/courses/${course!.id}`, { title: 'New' }, asUser(adminId)),
    )
    const m1Res = await apiCall(
      app,
      'POST',
      `/courses/${course!.id}/modules`,
      { title: 'M1' },
      asUser(adminId),
    )
    expect(m1Res.status).toBe(201)
    const m2Res = await apiCall(
      app,
      'POST',
      `/courses/${course!.id}/modules`,
      { title: 'M2' },
      asUser(adminId),
    )
    const m1 = (m1Res.body as { data: { module: { id: string } } }).data.module
    const m2 = (m2Res.body as { data: { module: { id: string } } }).data.module

    assertSuccess(
      await apiCall(
        app,
        'POST',
        `/courses/${course!.id}/modules/reorder`,
        { moduleIds: [m2.id, m1.id] },
        asUser(adminId),
      ),
    )
    assertSuccess(
      await apiCall(app, 'POST', `/courses/${course!.id}/archive`, undefined, asUser(adminId)),
    )
  })

  it('creates, updates and reorders lessons', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const l1Res = await apiCall(
      app,
      'POST',
      `/modules/${mod!.id}/lessons`,
      { title: 'L1' },
      asUser(adminId),
    )
    expect(l1Res.status).toBe(201)
    const l1 = (l1Res.body as { data: { lesson: { id: string } } }).data.lesson

    assertSuccess(
      await apiCall(
        app,
        'PATCH',
        `/lessons/${l1.id}`,
        { decisionPrompt: 'Decide something real' },
        asUser(adminId),
      ),
    )
    assertSuccess(
      await apiCall(
        app,
        'POST',
        `/modules/${mod!.id}/lessons/reorder`,
        { lessonIds: [l1.id] },
        asUser(adminId),
      ),
    )
  })

  it('hands out a tus upload URL (bytes never proxied)', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id)

    const res = await apiCall(
      app,
      'POST',
      `/lessons/${lesson!.id}/upload-url`,
      { uploadLengthBytes: 5_000_000 },
      asUser(adminId),
    )
    const data = assertSuccess(res) as { uploadUrl: string; streamVideoId: string }
    expect(data.uploadUrl).toBe('https://upload.test/tus')
    expect(data.streamVideoId).toBe('sv-route')
  })

  it('caption generate + ready endpoints work', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id, { streamVideoId: 'sv-c', videoStatus: 'ready' })

    assertSuccess(
      await apiCall(
        app,
        'POST',
        `/lessons/${lesson!.id}/captions/generate`,
        undefined,
        asUser(adminId),
      ),
    )
    assertSuccess(
      await apiCall(
        app,
        'PUT',
        `/lessons/${lesson!.id}/captions/ready`,
        { ready: true },
        asUser(adminId),
      ),
    )
  })

  it('publish endpoint enforces the gate and publishes when satisfied', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const bare = await createTestLesson(mod!.id)
    assertError(
      await apiCall(app, 'POST', `/lessons/${bare!.id}/publish`, undefined, asUser(adminId)),
      'VIDEO_NOT_READY',
    )

    const good = await createTestLesson(mod!.id, {
      streamVideoId: 'sv-ok',
      videoStatus: 'ready',
      captionsReady: true,
      decisionPrompt: 'p',
    })
    const res = await apiCall(
      app,
      'POST',
      `/lessons/${good!.id}/publish`,
      undefined,
      asUser(adminId),
    )
    const data = assertSuccess(res) as { lesson: { status: string } }
    expect(data.lesson.status).toBe('published')
  })

  it('cover generate returns 4 candidates and pick persists', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)

    const genRes = await apiCall(
      app,
      'POST',
      '/covers/generate',
      { kind: 'module', id: mod!.id, subject: 'morning light on linen' },
      asUser(adminId),
    )
    const gen = assertSuccess(genRes) as { candidates: string[] }
    expect(gen.candidates).toHaveLength(4)

    const pickRes = await apiCall(
      app,
      'POST',
      '/covers/pick',
      { kind: 'module', id: mod!.id, key: gen.candidates[0] },
      asUser(adminId),
    )
    assertSuccess(pickRes)
  })

  it('400s cover pick with an arbitrary (non-candidate) key', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const res = await apiCall(
      app,
      'POST',
      '/covers/pick',
      { kind: 'module', id: mod!.id, key: '../../etc/passwd' },
      asUser(adminId),
    )
    expect(res.status).toBe(400)
  })

  it('400s cover generation with an invalid kind', async () => {
    const res = await apiCall(
      app,
      'POST',
      '/covers/generate',
      { kind: 'banner', id: MISSING_ID, subject: 's' },
      asUser(adminId),
    )
    expect(res.status).toBe(400)
  })
})
