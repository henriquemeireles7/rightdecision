import { and, asc, desc, eq, gte, lt } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { lives, programs } from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'
import { ProviderError } from '@/providers/errors'
import { createTusUploadUrl } from '@/providers/video'

type ServiceError = { error: ErrorCode; details?: string }
type Live = typeof lives.$inferSelect

export type LivesWhen = 'upcoming' | 'past' | 'all'

export async function scheduleLive(input: {
  programId: string
  title: string
  description?: string
  scheduledAt: Date
  youtubeUrl?: string
}): Promise<{ live: Live } | ServiceError> {
  const program = await db.query.programs.findFirst({ where: eq(programs.id, input.programId) })
  if (!program) return { error: 'PROGRAM_NOT_FOUND' }

  const [live] = await db.insert(lives).values(input).returning()
  if (!live) return { error: 'INTERNAL_ERROR' }
  return { live }
}

/** upcoming/past derives from scheduledAt vs now — no stored status (TD-1). */
export async function listLives(
  programId: string,
  when: LivesWhen = 'all',
  now: Date = new Date(),
): Promise<{ lives: Live[] } | ServiceError> {
  const program = await db.query.programs.findFirst({ where: eq(programs.id, programId) })
  if (!program) return { error: 'PROGRAM_NOT_FOUND' }

  const scope = eq(lives.programId, programId)
  const rows =
    when === 'upcoming'
      ? await db
          .select()
          .from(lives)
          .where(and(scope, gte(lives.scheduledAt, now)))
          .orderBy(asc(lives.scheduledAt))
      : when === 'past'
        ? await db
            .select()
            .from(lives)
            .where(and(scope, lt(lives.scheduledAt, now)))
            .orderBy(desc(lives.scheduledAt))
        : await db.select().from(lives).where(scope).orderBy(asc(lives.scheduledAt))
  return { lives: rows }
}

export async function updateLive(
  liveId: string,
  patch: {
    title?: string
    description?: string | null
    scheduledAt?: Date
    youtubeUrl?: string | null
  },
): Promise<{ live: Live } | ServiceError> {
  const live = await db.query.lives.findFirst({ where: eq(lives.id, liveId) })
  if (!live) return { error: 'NOT_FOUND' }
  if (live.cancelledAt) {
    return {
      error: 'VALIDATION_ERROR',
      details: 'A cancelled live cannot be updated — schedule a new one',
    }
  }
  const [updated] = await db
    .update(lives)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(lives.id, liveId))
    .returning()
  if (!updated) return { error: 'NOT_FOUND' }
  return { live: updated }
}

/** Cancellation is a human act (Gate C): explicit, idempotent, never a delete. */
export async function cancelLive(
  liveId: string,
  now: Date = new Date(),
): Promise<{ live: Live } | ServiceError> {
  const live = await db.query.lives.findFirst({ where: eq(lives.id, liveId) })
  if (!live) return { error: 'NOT_FOUND' }
  if (live.cancelledAt) return { live } // keep the original cancellation instant

  const [cancelled] = await db
    .update(lives)
    .set({ cancelledAt: now, updatedAt: now })
    .where(eq(lives.id, liveId))
    .returning()
  if (!cancelled) return { error: 'NOT_FOUND' }
  return { live: cancelled }
}

/**
 * tus direct upload for the replay recording. Sets replayStreamVideoId +
 * replayStatus='processing'; the Stream webhook flips it to 'ready'.
 */
export async function requestReplayUploadUrl(
  liveId: string,
  uploadLengthBytes: number,
): Promise<{ uploadUrl: string; streamVideoId: string } | ServiceError> {
  const live = await db.query.lives.findFirst({ where: eq(lives.id, liveId) })
  if (!live) return { error: 'NOT_FOUND' }
  if (live.cancelledAt) {
    return { error: 'VALIDATION_ERROR', details: 'A cancelled live cannot have a replay' }
  }

  let uploadUrl: string
  let streamVideoId: string
  try {
    ;({ uploadUrl, streamVideoId } = await createTusUploadUrl({
      uploadLengthBytes,
      name: `${live.title} (replay)`,
    }))
  } catch (error) {
    if (error instanceof ProviderError) {
      return { error: 'VIDEO_UPLOAD_FAILED', details: error.message }
    }
    throw error
  }

  await db
    .update(lives)
    .set({ replayStreamVideoId: streamVideoId, replayStatus: 'processing', updatedAt: new Date() })
    .where(eq(lives.id, liveId))
  return { uploadUrl, streamVideoId }
}
