import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'

// Mock providers BEFORE importing the covers service (TD-8: feature owns storage).
const actualImageGen = await import('@/providers/image-gen')
const mockGenerateCoverImage = mock((_opts: { subject: string; aspect: '2:3' | '16:9' }) =>
  Promise.resolve(new Uint8Array([1, 2, 3])),
)
mock.module('@/providers/image-gen', () => ({
  ...actualImageGen,
  generateCoverImage: mockGenerateCoverImage,
}))

const actualStorage = await import('@/providers/storage')
const mockUpload = mock((key: string) => Promise.resolve(key))
mock.module('@/providers/storage', () => ({
  ...actualStorage,
  upload: mockUpload,
}))

import { eq } from 'drizzle-orm'
import { courses, events, lessons, modules } from '@/platform/db/schema'
import {
  createTestCourse,
  createTestLesson,
  createTestModule,
  createTestUser,
} from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { ProviderError } from '@/providers/errors'
import { COVER_PROMPT_VERSION } from '@/providers/image-gen'

const { generateCoverCandidates, pickCover } = await import('./covers')

const MISSING_ID = '00000000-0000-0000-0000-000000000000'

describe('integration: cover generation (ADR 18)', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(async () => {
    await teardownTestDb()
    mockGenerateCoverImage.mockClear()
    mockUpload.mockClear()
    mockGenerateCoverImage.mockResolvedValue(new Uint8Array([1, 2, 3]))
    mockUpload.mockImplementation((key: string) => Promise.resolve(key))
  })

  it('generates 4 module cover candidates at 2:3 WITHOUT persisting', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id, { coverImageKey: null })

    const result = await generateCoverCandidates({
      kind: 'module',
      id: mod!.id,
      subject: 'a quiet kitchen at dawn',
    })
    if ('error' in result) throw new Error(result.error)

    expect(result.candidates).toHaveLength(4)
    expect(new Set(result.candidates).size).toBe(4)
    expect(result.aspect).toBe('2:3')
    expect(result.promptVersion).toBe(COVER_PROMPT_VERSION)
    expect(mockGenerateCoverImage).toHaveBeenCalledTimes(4)
    expect(mockGenerateCoverImage.mock.calls[0]?.[0]).toEqual({
      subject: 'a quiet kitchen at dawn',
      aspect: '2:3',
    })
    expect(mockUpload).toHaveBeenCalledTimes(4)

    // nothing persisted until pick
    const [row] = await testDb.select().from(modules).where(eq(modules.id, mod!.id))
    expect(row?.coverImageKey).toBeNull()
  })

  it('generates course covers at 2:3 and lesson thumbnails at 16:9', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id)

    const forCourse = await generateCoverCandidates({
      kind: 'course',
      id: course!.id,
      subject: 'subject',
    })
    if ('error' in forCourse) throw new Error(forCourse.error)
    expect(forCourse.aspect).toBe('2:3')

    const forLesson = await generateCoverCandidates({
      kind: 'lesson',
      id: lesson!.id,
      subject: 'subject',
    })
    if ('error' in forLesson) throw new Error(forLesson.error)
    expect(forLesson.aspect).toBe('16:9')
  })

  it('returns *_NOT_FOUND for missing targets', async () => {
    expect(await generateCoverCandidates({ kind: 'module', id: MISSING_ID, subject: 's' })).toEqual(
      { error: 'MODULE_NOT_FOUND' },
    )
    expect(await generateCoverCandidates({ kind: 'course', id: MISSING_ID, subject: 's' })).toEqual(
      { error: 'COURSE_NOT_FOUND' },
    )
    expect(await generateCoverCandidates({ kind: 'lesson', id: MISSING_ID, subject: 's' })).toEqual(
      { error: 'LESSON_NOT_FOUND' },
    )
  })

  it('maps image-gen failure to COVER_GENERATION_FAILED', async () => {
    mockGenerateCoverImage.mockRejectedValueOnce(
      new ProviderError('image-gen', 'generateCoverImage', 502, 'no image') as never,
    )
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const result = await generateCoverCandidates({ kind: 'module', id: mod!.id, subject: 's' })
    expect(result).toMatchObject({ error: 'COVER_GENERATION_FAILED' })
  })

  it('maps storage upload failure to COVER_GENERATION_FAILED', async () => {
    mockUpload.mockRejectedValueOnce(new ProviderError('r2', 'upload', 500, 'down') as never)
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const result = await generateCoverCandidates({ kind: 'module', id: mod!.id, subject: 's' })
    expect(result).toMatchObject({ error: 'COVER_GENERATION_FAILED' })
  })

  it('pickCover persists the module cover and records cover_generated', async () => {
    const admin = await createTestUser({ role: 'admin' })
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id, { coverImageKey: null })

    const result = await pickCover(
      { kind: 'module', id: mod!.id, key: 'covers/candidates/module/x/1.png' },
      admin!.id,
    )
    if ('error' in result) throw new Error(result.error)
    expect(result.coverImageKey).toBe('covers/candidates/module/x/1.png')

    const [row] = await testDb.select().from(modules).where(eq(modules.id, mod!.id))
    expect(row?.coverImageKey).toBe('covers/candidates/module/x/1.png')

    const recorded = await testDb.select().from(events).where(eq(events.name, 'cover_generated'))
    expect(recorded).toHaveLength(1)
    expect(recorded[0]?.userId).toBe(admin!.id)
  })

  it('pickCover persists course covers and lesson thumbnails', async () => {
    const admin = await createTestUser({ role: 'admin' })
    const course = await createTestCourse({ coverImageKey: null })
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id)

    const forCourse = await pickCover(
      { kind: 'course', id: course!.id, key: 'covers/c.png' },
      admin!.id,
    )
    if ('error' in forCourse) throw new Error(forCourse.error)
    const [courseRow] = await testDb.select().from(courses).where(eq(courses.id, course!.id))
    expect(courseRow?.coverImageKey).toBe('covers/c.png')

    const forLesson = await pickCover(
      { kind: 'lesson', id: lesson!.id, key: 'thumbs/l.png' },
      admin!.id,
    )
    if ('error' in forLesson) throw new Error(forLesson.error)
    const [lessonRow] = await testDb.select().from(lessons).where(eq(lessons.id, lesson!.id))
    expect(lessonRow?.thumbnailKey).toBe('thumbs/l.png')
  })

  it('pickCover returns *_NOT_FOUND for missing targets', async () => {
    const admin = await createTestUser({ role: 'admin' })
    expect(await pickCover({ kind: 'module', id: MISSING_ID, key: 'k' }, admin!.id)).toEqual({
      error: 'MODULE_NOT_FOUND',
    })
  })
})
