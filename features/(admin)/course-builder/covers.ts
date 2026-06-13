import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { courses, lessons, modules } from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'
import { record } from '@/platform/events'
import { ProviderError } from '@/providers/errors'
import { COVER_PROMPT_VERSION, generateCoverImage } from '@/providers/image-gen'
import { upload } from '@/providers/storage'

type ServiceError = { error: ErrorCode; details?: string }

export type CoverTargetKind = 'course' | 'module' | 'lesson'
export type CoverTarget = { kind: CoverTargetKind; id: string }

const CANDIDATE_COUNT = 4

/** Fixed aspects (ADR 18): 2:3 covers for courses/modules, 16:9 thumbnails for lessons. */
const ASPECT_BY_KIND = {
  course: '2:3',
  module: '2:3',
  lesson: '16:9',
} as const

const NOT_FOUND_BY_KIND = {
  course: 'COURSE_NOT_FOUND',
  module: 'MODULE_NOT_FOUND',
  lesson: 'LESSON_NOT_FOUND',
} as const satisfies Record<CoverTargetKind, ErrorCode>

async function findTarget(target: CoverTarget): Promise<{ id: string } | null> {
  switch (target.kind) {
    case 'course':
      return (await db.query.courses.findFirst({ where: eq(courses.id, target.id) })) ?? null
    case 'module':
      return (await db.query.modules.findFirst({ where: eq(modules.id, target.id) })) ?? null
    case 'lesson':
      return (await db.query.lessons.findFirst({ where: eq(lessons.id, target.id) })) ?? null
  }
}

/**
 * Generate 4 cover candidates (image-gen bytes → R2 via storage, TD-8) and return their
 * keys WITHOUT persisting anything — the picker renders them alongside existing covers
 * and only pickCover() writes (ADR 18).
 */
export async function generateCoverCandidates(input: {
  kind: CoverTargetKind
  id: string
  subject: string
}): Promise<
  { candidates: string[]; aspect: '2:3' | '16:9'; promptVersion: string } | ServiceError
> {
  const target = await findTarget(input)
  if (!target) return { error: NOT_FOUND_BY_KIND[input.kind] }

  const aspect = ASPECT_BY_KIND[input.kind]
  try {
    const candidates = await Promise.all(
      Array.from({ length: CANDIDATE_COUNT }, async () => {
        const bytes = await generateCoverImage({ subject: input.subject, aspect })
        const key = `covers/candidates/${input.kind}/${input.id}/${randomUUID()}.png`
        await upload(key, bytes, 'image/png')
        return key
      }),
    )
    return { candidates, aspect, promptVersion: COVER_PROMPT_VERSION }
  } catch (error) {
    if (error instanceof ProviderError) {
      return { error: 'COVER_GENERATION_FAILED', details: error.message }
    }
    throw error
  }
}

/** Persist the chosen candidate key (coverImageKey, or thumbnailKey for lessons). */
export async function pickCover(
  input: { kind: CoverTargetKind; id: string; key: string },
  adminUserId: string,
): Promise<{ coverImageKey: string } | ServiceError> {
  const target = await findTarget(input)
  if (!target) return { error: NOT_FOUND_BY_KIND[input.kind] }

  await db.transaction(async (tx) => {
    const now = new Date()
    switch (input.kind) {
      case 'course':
        await tx
          .update(courses)
          .set({ coverImageKey: input.key, updatedAt: now })
          .where(eq(courses.id, input.id))
        break
      case 'module':
        await tx
          .update(modules)
          .set({ coverImageKey: input.key, updatedAt: now })
          .where(eq(modules.id, input.id))
        break
      case 'lesson':
        await tx
          .update(lessons)
          .set({ thumbnailKey: input.key, updatedAt: now })
          .where(eq(lessons.id, input.id))
        break
    }
    await record({ name: 'cover_generated', properties: {}, userId: adminUserId }, tx)
  })

  return { coverImageKey: input.key }
}
