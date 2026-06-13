import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { requirePermission } from '@/platform/auth/permissions'
import { throwError } from '@/platform/errors'
import { created, success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { generateCoverCandidates, pickCover } from './covers'
import {
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
} from './service'

const courseIdParam = z.object({ courseId: z.uuid() })
const moduleIdParam = z.object({ moduleId: z.uuid() })
const lessonIdParam = z.object({ lessonId: z.uuid() })

const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and dashes only')

const createCourseSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  description: z.string().optional(),
})
const updateCourseSchema = z.object({
  slug: slugSchema.optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
})
const createModuleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
})
const updateModuleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['draft', 'published']).optional(),
})
const createLessonSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  decisionPrompt: z.string().min(1).optional(),
})
const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  decisionPrompt: z.string().min(1).nullable().optional(),
})
const uploadUrlSchema = z.object({
  uploadLengthBytes: z.number().int().positive(),
})
const captionsReadySchema = z.object({ ready: z.boolean() })
const coverTargetSchema = z.object({
  kind: z.enum(['course', 'module', 'lesson']),
  id: z.uuid(),
})
const generateCoverSchema = coverTargetSchema.extend({ subject: z.string().min(1) })
const pickCoverSchema = coverTargetSchema.extend({ key: z.string().min(1) })

export const adminCourseBuilderRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(requirePermission('manage_content'))

  // ─── Courses ───
  .get('/courses', async (c) => {
    return success(c, await listCourses())
  })
  .post('/courses', zValidator('json', createCourseSchema), async (c) => {
    const result = await createCourse(c.req.valid('json'))
    if ('error' in result) return throwError(c, result.error, result.details)
    return created(c, result)
  })
  .get('/courses/:courseId', zValidator('param', courseIdParam), async (c) => {
    const result = await getCourse(c.req.valid('param').courseId)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
  .patch(
    '/courses/:courseId',
    zValidator('param', courseIdParam),
    zValidator('json', updateCourseSchema),
    async (c) => {
      const result = await updateCourse(c.req.valid('param').courseId, c.req.valid('json'))
      if ('error' in result) return throwError(c, result.error, result.details)
      return success(c, result)
    },
  )
  .post('/courses/:courseId/archive', zValidator('param', courseIdParam), async (c) => {
    const result = await archiveCourse(c.req.valid('param').courseId)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })

  // ─── Modules ───
  .post(
    '/courses/:courseId/modules',
    zValidator('param', courseIdParam),
    zValidator('json', createModuleSchema),
    async (c) => {
      const result = await createModule(c.req.valid('param').courseId, c.req.valid('json'))
      if ('error' in result) return throwError(c, result.error, result.details)
      return created(c, result)
    },
  )
  .post(
    '/courses/:courseId/modules/reorder',
    zValidator('param', courseIdParam),
    zValidator('json', z.object({ moduleIds: z.array(z.uuid()).min(1) })),
    async (c) => {
      const result = await reorderModules(
        c.req.valid('param').courseId,
        c.req.valid('json').moduleIds,
      )
      if ('error' in result) return throwError(c, result.error, result.details)
      return success(c, result)
    },
  )
  .patch(
    '/modules/:moduleId',
    zValidator('param', moduleIdParam),
    zValidator('json', updateModuleSchema),
    async (c) => {
      const result = await updateModule(c.req.valid('param').moduleId, c.req.valid('json'))
      if ('error' in result) return throwError(c, result.error, result.details)
      return success(c, result)
    },
  )

  // ─── Lessons ───
  .post(
    '/modules/:moduleId/lessons',
    zValidator('param', moduleIdParam),
    zValidator('json', createLessonSchema),
    async (c) => {
      const result = await createLesson(c.req.valid('param').moduleId, c.req.valid('json'))
      if ('error' in result) return throwError(c, result.error, result.details)
      return created(c, result)
    },
  )
  .post(
    '/modules/:moduleId/lessons/reorder',
    zValidator('param', moduleIdParam),
    zValidator('json', z.object({ lessonIds: z.array(z.uuid()).min(1) })),
    async (c) => {
      const result = await reorderLessons(
        c.req.valid('param').moduleId,
        c.req.valid('json').lessonIds,
      )
      if ('error' in result) return throwError(c, result.error, result.details)
      return success(c, result)
    },
  )
  .patch(
    '/lessons/:lessonId',
    zValidator('param', lessonIdParam),
    zValidator('json', updateLessonSchema),
    async (c) => {
      const result = await updateLesson(c.req.valid('param').lessonId, c.req.valid('json'))
      if ('error' in result) return throwError(c, result.error, result.details)
      return success(c, result)
    },
  )

  // ─── Video upload (tus — the route only hands out the URL) ───
  .post(
    '/lessons/:lessonId/upload-url',
    zValidator('param', lessonIdParam),
    zValidator('json', uploadUrlSchema),
    async (c) => {
      const result = await requestLessonUploadUrl(
        c.req.valid('param').lessonId,
        c.req.valid('json').uploadLengthBytes,
      )
      if ('error' in result) return throwError(c, result.error, result.details)
      return success(c, result)
    },
  )

  // ─── Captions ───
  .post('/lessons/:lessonId/captions/generate', zValidator('param', lessonIdParam), async (c) => {
    const result = await triggerCaptionGeneration(c.req.valid('param').lessonId)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
  .put(
    '/lessons/:lessonId/captions/ready',
    zValidator('param', lessonIdParam),
    zValidator('json', captionsReadySchema),
    async (c) => {
      const result = await setCaptionsReady(
        c.req.valid('param').lessonId,
        c.req.valid('json').ready,
      )
      if ('error' in result) return throwError(c, result.error, result.details)
      return success(c, result)
    },
  )

  // ─── Publish gate ───
  .post('/lessons/:lessonId/publish', zValidator('param', lessonIdParam), async (c) => {
    const result = await publishLesson(c.req.valid('param').lessonId, c.get('user').id)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })

  // ─── AI covers (ADR 18) ───
  .post('/covers/generate', zValidator('json', generateCoverSchema), async (c) => {
    const result = await generateCoverCandidates(c.req.valid('json'))
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
  .post('/covers/pick', zValidator('json', pickCoverSchema), async (c) => {
    const { kind, id, key } = c.req.valid('json')
    const result = await pickCover({ kind, id, key }, c.get('user').id)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
