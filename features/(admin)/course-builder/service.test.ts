import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'

// mock providers BEFORE importing the service (group testing rule)
const actualVideo = await import('@/providers/video')
const mockCreateTusUploadUrl = mock(() =>
  Promise.resolve({ uploadUrl: 'https://upload.cloudflare.test/tus/abc', streamVideoId: 'sv-1' }),
)
const mockGenerateCaptions = mock(() => Promise.resolve({ language: 'en', status: 'inprogress' }))
mock.module('@/providers/video', () => ({
  ...actualVideo,
  createTusUploadUrl: mockCreateTusUploadUrl,
  generateCaptions: mockGenerateCaptions,
}))

import { eq } from 'drizzle-orm'
import { events, lessons } from '@/platform/db/schema'
import {
  createTestCourse,
  createTestLesson,
  createTestModule,
  createTestUser,
} from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { ProviderError } from '@/providers/errors'

const {
  archiveCourse,
  createCourse,
  createLesson,
  createModule,
  getCourse,
  listCourses,
  publishLesson,
  reorderLessons,
  reorderModules,
  requestLessonUploadUrl,
  setCaptionsReady,
  triggerCaptionGeneration,
  updateCourse,
  updateLesson,
  updateModule,
} = await import('./service')

const MISSING_ID = '00000000-0000-0000-0000-000000000000'

/** A lesson satisfying the full publish invariant. */
async function createPublishableLesson(moduleId: string) {
  return createTestLesson(moduleId, {
    streamVideoId: 'sv-ready',
    videoStatus: 'ready',
    captionsReady: true,
    decisionPrompt: 'What will you decide?',
  })
}

describe('integration: course-builder service', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(async () => {
    await teardownTestDb()
    mockCreateTusUploadUrl.mockClear()
    mockGenerateCaptions.mockClear()
    mockCreateTusUploadUrl.mockResolvedValue({
      uploadUrl: 'https://upload.cloudflare.test/tus/abc',
      streamVideoId: 'sv-1',
    })
    mockGenerateCaptions.mockResolvedValue({ language: 'en', status: 'inprogress' })
  })

  // ─── Courses ───

  it('creates a course as draft', async () => {
    const result = await createCourse({ slug: 'deep-course', title: 'Deep Course' })
    if ('error' in result) throw new Error(result.error)
    expect(result.course.slug).toBe('deep-course')
    expect(result.course.status).toBe('draft')
  })

  it('rejects a duplicate course slug with VALIDATION_ERROR', async () => {
    await createCourse({ slug: 'dup', title: 'One' })
    const result = await createCourse({ slug: 'dup', title: 'Two' })
    expect(result).toMatchObject({ error: 'VALIDATION_ERROR' })
  })

  it('lists courses', async () => {
    await createTestCourse()
    await createTestCourse()
    const { courses } = await listCourses()
    expect(courses).toHaveLength(2)
  })

  it('gets a course with modules and lessons nested in sort order', async () => {
    const course = await createTestCourse()
    const m2 = await createTestModule(course!.id, { sortOrder: 1 })
    const m1 = await createTestModule(course!.id, { sortOrder: 0 })
    await createTestLesson(m1!.id, { sortOrder: 1, title: 'L2' })
    await createTestLesson(m1!.id, { sortOrder: 0, title: 'L1' })

    const result = await getCourse(course!.id)
    if ('error' in result) throw new Error(result.error)
    expect(result.course.id).toBe(course!.id)
    expect(result.modules.map((m) => m.id)).toEqual([m1!.id, m2!.id])
    expect(result.modules[0]?.lessons.map((l) => l.title)).toEqual(['L1', 'L2'])
  })

  it('returns COURSE_NOT_FOUND for a missing course', async () => {
    expect(await getCourse(MISSING_ID)).toEqual({ error: 'COURSE_NOT_FOUND' })
    expect(await updateCourse(MISSING_ID, { title: 'x' })).toEqual({ error: 'COURSE_NOT_FOUND' })
    expect(await archiveCourse(MISSING_ID)).toEqual({ error: 'COURSE_NOT_FOUND' })
  })

  it('updates a course', async () => {
    const course = await createTestCourse()
    const result = await updateCourse(course!.id, { title: 'Renamed', description: 'desc' })
    if ('error' in result) throw new Error(result.error)
    expect(result.course.title).toBe('Renamed')
    expect(result.course.description).toBe('desc')
  })

  it('rejects updating a course to an existing slug', async () => {
    const a = await createTestCourse()
    const b = await createTestCourse()
    const result = await updateCourse(b!.id, { slug: a!.slug })
    expect(result).toMatchObject({ error: 'VALIDATION_ERROR' })
  })

  it('archives a course instead of deleting', async () => {
    const course = await createTestCourse()
    const result = await archiveCourse(course!.id)
    if ('error' in result) throw new Error(result.error)
    expect(result.course.status).toBe('archived')
  })

  // ─── Modules ───

  it('creates modules appended at the end of the sort order', async () => {
    const course = await createTestCourse()
    const r1 = await createModule(course!.id, { title: 'First' })
    const r2 = await createModule(course!.id, { title: 'Second' })
    if ('error' in r1 || 'error' in r2) throw new Error('create failed')
    expect(r1.module.sortOrder).toBe(0)
    expect(r2.module.sortOrder).toBe(1)
    expect(r1.module.status).toBe('draft')
  })

  it('returns COURSE_NOT_FOUND creating a module on a missing course', async () => {
    expect(await createModule(MISSING_ID, { title: 'x' })).toEqual({ error: 'COURSE_NOT_FOUND' })
  })

  it('updates a module', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const result = await updateModule(mod!.id, { title: 'New Title', status: 'published' })
    if ('error' in result) throw new Error(result.error)
    expect(result.module.title).toBe('New Title')
    expect(result.module.status).toBe('published')
  })

  it('returns MODULE_NOT_FOUND updating a missing module', async () => {
    expect(await updateModule(MISSING_ID, { title: 'x' })).toEqual({ error: 'MODULE_NOT_FOUND' })
  })

  it('reorders modules by array index', async () => {
    const course = await createTestCourse()
    const a = await createTestModule(course!.id, { sortOrder: 0 })
    const b = await createTestModule(course!.id, { sortOrder: 1 })
    const c = await createTestModule(course!.id, { sortOrder: 2 })

    const result = await reorderModules(course!.id, [c!.id, a!.id, b!.id])
    if ('error' in result) throw new Error(result.error)
    expect(result.modules.map((m) => m.id)).toEqual([c!.id, a!.id, b!.id])
    expect(result.modules.map((m) => m.sortOrder)).toEqual([0, 1, 2])
  })

  it('rejects a reorder whose id set does not match the course modules', async () => {
    const course = await createTestCourse()
    const a = await createTestModule(course!.id)
    await createTestModule(course!.id)
    const result = await reorderModules(course!.id, [a!.id])
    expect(result).toMatchObject({ error: 'VALIDATION_ERROR' })
    const foreign = await reorderModules(course!.id, [a!.id, MISSING_ID])
    expect(foreign).toMatchObject({ error: 'VALIDATION_ERROR' })
  })

  // ─── Lessons ───

  it('creates lessons appended at the end with videoStatus none', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const r1 = await createLesson(mod!.id, { title: 'Lesson 1' })
    const r2 = await createLesson(mod!.id, { title: 'Lesson 2', decisionPrompt: 'Decide.' })
    if ('error' in r1 || 'error' in r2) throw new Error('create failed')
    expect(r1.lesson.sortOrder).toBe(0)
    expect(r2.lesson.sortOrder).toBe(1)
    expect(r1.lesson.videoStatus).toBe('none')
    expect(r2.lesson.decisionPrompt).toBe('Decide.')
  })

  it('returns MODULE_NOT_FOUND creating a lesson on a missing module', async () => {
    expect(await createLesson(MISSING_ID, { title: 'x' })).toEqual({ error: 'MODULE_NOT_FOUND' })
  })

  it('updates a lesson decision prompt', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id)
    const result = await updateLesson(lesson!.id, { decisionPrompt: 'One prompt per lesson' })
    if ('error' in result) throw new Error(result.error)
    expect(result.lesson.decisionPrompt).toBe('One prompt per lesson')
  })

  it('refuses to null the decision prompt of a published lesson', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id, {
      status: 'published',
      videoStatus: 'ready',
      captionsReady: true,
      decisionPrompt: 'Keep me',
    })
    const result = await updateLesson(lesson!.id, { decisionPrompt: null })
    expect(result).toMatchObject({ error: 'VALIDATION_ERROR' })
  })

  it('reorders lessons by array index', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const a = await createTestLesson(mod!.id, { sortOrder: 0 })
    const b = await createTestLesson(mod!.id, { sortOrder: 1 })
    const result = await reorderLessons(mod!.id, [b!.id, a!.id])
    if ('error' in result) throw new Error(result.error)
    expect(result.lessons.map((l) => l.id)).toEqual([b!.id, a!.id])
  })

  it('rejects lesson reorder with mismatched ids', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    await createTestLesson(mod!.id)
    const result = await reorderLessons(mod!.id, [MISSING_ID])
    expect(result).toMatchObject({ error: 'VALIDATION_ERROR' })
  })

  // ─── Video upload flow ───

  it('requests a tus upload URL and marks the lesson uploading', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id)

    const result = await requestLessonUploadUrl(lesson!.id, 1024 * 1024)
    if ('error' in result) throw new Error(result.error)
    expect(result.uploadUrl).toBe('https://upload.cloudflare.test/tus/abc')
    expect(result.streamVideoId).toBe('sv-1')
    expect(mockCreateTusUploadUrl).toHaveBeenCalledTimes(1)

    const [row] = await testDb.select().from(lessons).where(eq(lessons.id, lesson!.id))
    expect(row?.streamVideoId).toBe('sv-1')
    expect(row?.videoStatus).toBe('uploading')
  })

  it('returns LESSON_NOT_FOUND requesting an upload URL for a missing lesson', async () => {
    expect(await requestLessonUploadUrl(MISSING_ID, 1024)).toEqual({ error: 'LESSON_NOT_FOUND' })
  })

  it('maps tus provider failure to VIDEO_UPLOAD_FAILED and leaves the lesson untouched', async () => {
    mockCreateTusUploadUrl.mockRejectedValueOnce(
      new ProviderError('stream', 'createTusUploadUrl', 502, 'down') as never,
    )
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id)

    const result = await requestLessonUploadUrl(lesson!.id, 1024)
    expect(result).toMatchObject({ error: 'VIDEO_UPLOAD_FAILED' })
    const [row] = await testDb.select().from(lessons).where(eq(lessons.id, lesson!.id))
    expect(row?.videoStatus).toBe('none')
  })

  // ─── Captions ───

  it('triggers caption generation for a ready video', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id, { streamVideoId: 'sv-9', videoStatus: 'ready' })

    const result = await triggerCaptionGeneration(lesson!.id)
    if ('error' in result) throw new Error(result.error)
    expect(result.generation.language).toBe('en')
    expect(mockGenerateCaptions).toHaveBeenCalledWith('sv-9', 'en')
  })

  it('refuses caption generation when the video is not ready', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const noVideo = await createTestLesson(mod!.id)
    const processing = await createTestLesson(mod!.id, {
      streamVideoId: 'sv-x',
      videoStatus: 'processing',
    })
    expect(await triggerCaptionGeneration(noVideo!.id)).toMatchObject({ error: 'VIDEO_NOT_READY' })
    expect(await triggerCaptionGeneration(processing!.id)).toMatchObject({
      error: 'VIDEO_NOT_READY',
    })
    expect(await triggerCaptionGeneration(MISSING_ID)).toEqual({ error: 'LESSON_NOT_FOUND' })
  })

  it('maps caption provider failure to VIDEO_UPLOAD_FAILED', async () => {
    mockGenerateCaptions.mockRejectedValueOnce(
      new ProviderError('stream', 'generateCaptions', 500, 'boom') as never,
    )
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id, { streamVideoId: 'sv-9', videoStatus: 'ready' })
    expect(await triggerCaptionGeneration(lesson!.id)).toMatchObject({
      error: 'VIDEO_UPLOAD_FAILED',
    })
  })

  it('marks captions ready and unready', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id)
    const ready = await setCaptionsReady(lesson!.id, true)
    if ('error' in ready) throw new Error(ready.error)
    expect(ready.lesson.captionsReady).toBe(true)
    const unready = await setCaptionsReady(lesson!.id, false)
    if ('error' in unready) throw new Error(unready.error)
    expect(unready.lesson.captionsReady).toBe(false)
    expect(await setCaptionsReady(MISSING_ID, true)).toEqual({ error: 'LESSON_NOT_FOUND' })
  })

  it('refuses to unset captions on a published lesson', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id, {
      status: 'published',
      videoStatus: 'ready',
      captionsReady: true,
      decisionPrompt: 'p',
    })
    expect(await setCaptionsReady(lesson!.id, false)).toMatchObject({ error: 'VALIDATION_ERROR' })
  })

  // ─── Publish gate matrix ───

  it('publish gate: no video → VIDEO_NOT_READY', async () => {
    const admin = await createTestUser({ role: 'admin' })
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id, {
      captionsReady: true,
      decisionPrompt: 'p',
    })
    expect(await publishLesson(lesson!.id, admin!.id)).toMatchObject({ error: 'VIDEO_NOT_READY' })
  })

  it('publish gate: video uploading/processing/error → VIDEO_NOT_READY', async () => {
    const admin = await createTestUser({ role: 'admin' })
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    for (const videoStatus of ['uploading', 'processing', 'error'] as const) {
      const lesson = await createTestLesson(mod!.id, {
        streamVideoId: 'sv-x',
        videoStatus,
        captionsReady: true,
        decisionPrompt: 'p',
      })
      expect(await publishLesson(lesson!.id, admin!.id)).toMatchObject({
        error: 'VIDEO_NOT_READY',
      })
    }
  })

  it('publish gate: no captions → CAPTIONS_REQUIRED', async () => {
    const admin = await createTestUser({ role: 'admin' })
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id, {
      streamVideoId: 'sv-x',
      videoStatus: 'ready',
      captionsReady: false,
      decisionPrompt: 'p',
    })
    expect(await publishLesson(lesson!.id, admin!.id)).toMatchObject({
      error: 'CAPTIONS_REQUIRED',
    })
  })

  it('publish gate: no decision prompt → VALIDATION_ERROR', async () => {
    const admin = await createTestUser({ role: 'admin' })
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id, {
      streamVideoId: 'sv-x',
      videoStatus: 'ready',
      captionsReady: true,
      decisionPrompt: null,
    })
    expect(await publishLesson(lesson!.id, admin!.id)).toMatchObject({ error: 'VALIDATION_ERROR' })
  })

  it('publish gate: all good → published + lesson_published event recorded', async () => {
    const admin = await createTestUser({ role: 'admin' })
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createPublishableLesson(mod!.id)

    const result = await publishLesson(lesson!.id, admin!.id)
    if ('error' in result) throw new Error(result.error)
    expect(result.lesson.status).toBe('published')

    const rows = await testDb.select().from(events).where(eq(events.name, 'lesson_published'))
    expect(rows).toHaveLength(1)
    expect(rows[0]?.userId).toBe(admin!.id)
    expect(rows[0]?.properties).toEqual({ lessonId: lesson!.id })
  })

  it('publishing an already-published lesson no-ops without a duplicate event', async () => {
    const admin = await createTestUser({ role: 'admin' })
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createPublishableLesson(mod!.id)

    await publishLesson(lesson!.id, admin!.id)
    const second = await publishLesson(lesson!.id, admin!.id)
    if ('error' in second) throw new Error(second.error)
    expect(second.lesson.status).toBe('published')

    const rows = await testDb.select().from(events).where(eq(events.name, 'lesson_published'))
    expect(rows).toHaveLength(1)
  })

  it('publish returns LESSON_NOT_FOUND for a missing lesson', async () => {
    const admin = await createTestUser({ role: 'admin' })
    expect(await publishLesson(MISSING_ID, admin!.id)).toEqual({ error: 'LESSON_NOT_FOUND' })
  })
})
