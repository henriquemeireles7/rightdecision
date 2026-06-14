import { asc, eq, inArray } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { courses, lessons, modules } from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'
import { record } from '@/platform/events'
import { ProviderError } from '@/providers/errors'
import { createTusUploadUrl, generateCaptions } from '@/providers/video'

type ServiceError = { error: ErrorCode; details?: string }
type Course = typeof courses.$inferSelect
type Module = typeof modules.$inferSelect
type Lesson = typeof lessons.$inferSelect

/** postgres-js surfaces unique violations as code 23505 (drizzle may wrap it in `cause`). */
function isUniqueViolation(error: unknown): boolean {
  const err = error as { code?: string; cause?: { code?: string } } | null
  return err?.code === '23505' || err?.cause?.code === '23505'
}

// ─── Courses ───

export async function createCourse(input: {
  slug: string
  title: string
  description?: string
}): Promise<{ course: Course } | ServiceError> {
  try {
    const [course] = await db
      .insert(courses)
      .values({ slug: input.slug, title: input.title, description: input.description })
      .returning()
    if (!course) return { error: 'INTERNAL_ERROR' }
    return { course }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        error: 'VALIDATION_ERROR',
        details: `A course with slug "${input.slug}" already exists`,
      }
    }
    throw error
  }
}

export async function listCourses(): Promise<{ courses: Course[] }> {
  const rows = await db.select().from(courses).orderBy(asc(courses.createdAt))
  return { courses: rows }
}

export async function getCourse(
  courseId: string,
): Promise<{ course: Course; modules: Array<Module & { lessons: Lesson[] }> } | ServiceError> {
  const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId) })
  if (!course) return { error: 'COURSE_NOT_FOUND' }

  const courseModules = await db
    .select()
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.sortOrder), asc(modules.createdAt))

  const moduleIds = courseModules.map((m) => m.id)
  const courseLessons =
    moduleIds.length > 0
      ? await db
          .select()
          .from(lessons)
          .where(inArray(lessons.moduleId, moduleIds))
          .orderBy(asc(lessons.sortOrder), asc(lessons.createdAt))
      : []

  return {
    course,
    modules: courseModules.map((m) => ({
      ...m,
      lessons: courseLessons.filter((l) => l.moduleId === m.id),
    })),
  }
}

export async function updateCourse(
  courseId: string,
  patch: { slug?: string; title?: string; description?: string | null },
): Promise<{ course: Course } | ServiceError> {
  try {
    const [course] = await db
      .update(courses)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(courses.id, courseId))
      .returning()
    if (!course) return { error: 'COURSE_NOT_FOUND' }
    return { course }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        error: 'VALIDATION_ERROR',
        details: `A course with slug "${patch.slug}" already exists`,
      }
    }
    throw error
  }
}

/** Archive, never delete — published history and FKs stay intact. */
export async function archiveCourse(courseId: string): Promise<{ course: Course } | ServiceError> {
  const [course] = await db
    .update(courses)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(courses.id, courseId))
    .returning()
  if (!course) return { error: 'COURSE_NOT_FOUND' }
  return { course }
}

// ─── Modules ───

export async function createModule(
  courseId: string,
  input: { title: string; description?: string },
): Promise<{ module: Module } | ServiceError> {
  const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId) })
  if (!course) return { error: 'COURSE_NOT_FOUND' }

  const siblings = await db
    .select({ sortOrder: modules.sortOrder })
    .from(modules)
    .where(eq(modules.courseId, courseId))
  const nextSortOrder = siblings.reduce((max, row) => Math.max(max, row.sortOrder + 1), 0)

  const [created] = await db
    .insert(modules)
    .values({
      courseId,
      title: input.title,
      description: input.description,
      sortOrder: nextSortOrder,
    })
    .returning()
  if (!created) return { error: 'INTERNAL_ERROR' }
  return { module: created }
}

export async function updateModule(
  moduleId: string,
  patch: { title?: string; description?: string | null; status?: 'draft' | 'published' },
): Promise<{ module: Module } | ServiceError> {
  const [updated] = await db
    .update(modules)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(modules.id, moduleId))
    .returning()
  if (!updated) return { error: 'MODULE_NOT_FOUND' }
  return { module: updated }
}

/** sortOrder = array index (non-unique index — single-pass update, eng-schema table 6). */
export async function reorderModules(
  courseId: string,
  moduleIds: string[],
): Promise<{ modules: Module[] } | ServiceError> {
  const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId) })
  if (!course) return { error: 'COURSE_NOT_FOUND' }

  const existing = await db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, courseId))
  const existingIds = new Set(existing.map((m) => m.id))
  const requested = new Set(moduleIds)
  if (existingIds.size !== requested.size || ![...existingIds].every((id) => requested.has(id))) {
    return {
      error: 'VALIDATION_ERROR',
      details: 'moduleIds must contain exactly the ids of this course’s modules',
    }
  }

  await db.transaction(async (tx) => {
    for (const [index, id] of moduleIds.entries()) {
      await tx
        .update(modules)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(modules.id, id))
    }
  })
  const reordered = await db
    .select()
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.sortOrder))
  return { modules: reordered }
}

// ─── Lessons ───

export async function createLesson(
  moduleId: string,
  input: { title: string; description?: string; decisionPrompt?: string },
): Promise<{ lesson: Lesson } | ServiceError> {
  const parent = await db.query.modules.findFirst({ where: eq(modules.id, moduleId) })
  if (!parent) return { error: 'MODULE_NOT_FOUND' }

  const siblings = await db
    .select({ sortOrder: lessons.sortOrder })
    .from(lessons)
    .where(eq(lessons.moduleId, moduleId))
  const nextSortOrder = siblings.reduce((max, row) => Math.max(max, row.sortOrder + 1), 0)

  const [created] = await db
    .insert(lessons)
    .values({
      moduleId,
      title: input.title,
      description: input.description,
      decisionPrompt: input.decisionPrompt,
      sortOrder: nextSortOrder,
    })
    .returning()
  if (!created) return { error: 'INTERNAL_ERROR' }
  return { lesson: created }
}

export async function updateLesson(
  lessonId: string,
  patch: { title?: string; description?: string | null; decisionPrompt?: string | null },
): Promise<{ lesson: Lesson } | ServiceError> {
  const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) })
  if (!lesson) return { error: 'LESSON_NOT_FOUND' }

  // Publish invariant holds for the lesson's whole published life, not just at publish time.
  if (lesson.status === 'published' && 'decisionPrompt' in patch && patch.decisionPrompt === null) {
    return {
      error: 'VALIDATION_ERROR',
      details: 'A published lesson must keep its decision prompt — unpublish first',
    }
  }

  const [updated] = await db
    .update(lessons)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(lessons.id, lessonId))
    .returning()
  if (!updated) return { error: 'LESSON_NOT_FOUND' }
  return { lesson: updated }
}

export async function reorderLessons(
  moduleId: string,
  lessonIds: string[],
): Promise<{ lessons: Lesson[] } | ServiceError> {
  const parent = await db.query.modules.findFirst({ where: eq(modules.id, moduleId) })
  if (!parent) return { error: 'MODULE_NOT_FOUND' }

  const existing = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(eq(lessons.moduleId, moduleId))
  const existingIds = new Set(existing.map((l) => l.id))
  const requested = new Set(lessonIds)
  if (existingIds.size !== requested.size || ![...existingIds].every((id) => requested.has(id))) {
    return {
      error: 'VALIDATION_ERROR',
      details: 'lessonIds must contain exactly the ids of this module’s lessons',
    }
  }

  await db.transaction(async (tx) => {
    for (const [index, id] of lessonIds.entries()) {
      await tx
        .update(lessons)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(lessons.id, id))
    }
  })
  const reordered = await db
    .select()
    .from(lessons)
    .where(eq(lessons.moduleId, moduleId))
    .orderBy(asc(lessons.sortOrder))
  return { lessons: reordered }
}

// ─── Video upload flow (tus direct creator upload — bytes never touch Hono) ───

export async function requestLessonUploadUrl(
  lessonId: string,
  uploadLengthBytes: number,
): Promise<{ uploadUrl: string; streamVideoId: string } | ServiceError> {
  const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) })
  if (!lesson) return { error: 'LESSON_NOT_FOUND' }

  let uploadUrl: string
  let streamVideoId: string
  try {
    ;({ uploadUrl, streamVideoId } = await createTusUploadUrl({
      uploadLengthBytes,
      name: lesson.title,
    }))
  } catch (error) {
    if (error instanceof ProviderError) {
      return { error: 'VIDEO_UPLOAD_FAILED', details: error.message }
    }
    throw error
  }

  await db
    .update(lessons)
    .set({ streamVideoId, videoStatus: 'uploading', updatedAt: new Date() })
    .where(eq(lessons.id, lessonId))
  return { uploadUrl, streamVideoId }
}

// ─── Captions (Stream-native generation — roadmap open question resolved as Stream) ───

export async function triggerCaptionGeneration(
  lessonId: string,
): Promise<{ generation: { language: string; status: string } } | ServiceError> {
  const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) })
  if (!lesson) return { error: 'LESSON_NOT_FOUND' }
  if (!lesson.streamVideoId || lesson.videoStatus !== 'ready') {
    return {
      error: 'VIDEO_NOT_READY',
      details: 'Captions can only be generated once the video is ready',
    }
  }
  try {
    const generation = await generateCaptions(lesson.streamVideoId, 'en')
    return { generation }
  } catch (error) {
    if (error instanceof ProviderError) {
      return {
        error: 'VIDEO_UPLOAD_FAILED',
        details: `Caption generation failed: ${error.message}`,
      }
    }
    throw error
  }
}

export async function setCaptionsReady(
  lessonId: string,
  ready: boolean,
): Promise<{ lesson: Lesson } | ServiceError> {
  const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) })
  if (!lesson) return { error: 'LESSON_NOT_FOUND' }
  if (lesson.status === 'published' && !ready) {
    return {
      error: 'VALIDATION_ERROR',
      details: 'A published lesson must keep its captions — unpublish first',
    }
  }
  const [updated] = await db
    .update(lessons)
    .set({ captionsReady: ready, updatedAt: new Date() })
    .where(eq(lessons.id, lessonId))
    .returning()
  if (!updated) return { error: 'LESSON_NOT_FOUND' }
  return { lesson: updated }
}

// ─── Publish gate (eng-schema table 7 PUBLISH INVARIANT) ───

export async function publishLesson(
  lessonId: string,
  adminUserId: string,
): Promise<{ lesson: Lesson } | ServiceError> {
  const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) })
  if (!lesson) return { error: 'LESSON_NOT_FOUND' }
  if (lesson.status === 'published') return { lesson } // idempotent — no duplicate event

  if (lesson.videoStatus !== 'ready') return { error: 'VIDEO_NOT_READY' }
  if (!lesson.captionsReady) return { error: 'CAPTIONS_REQUIRED' }
  if (lesson.decisionPrompt === null) {
    return { error: 'VALIDATION_ERROR', details: 'A decision prompt is required before publishing' }
  }

  const published = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(lessons)
      .set({ status: 'published', updatedAt: new Date() })
      .where(eq(lessons.id, lessonId))
      .returning()
    await record({ name: 'lesson_published', properties: { lessonId }, userId: adminUserId }, tx)
    return updated
  })
  if (!published) return { error: 'INTERNAL_ERROR' }
  return { lesson: published }
}
