import { inArray } from 'drizzle-orm'
import { z } from 'zod'
import { upsertLessonProgress } from '@/features/(life)/player/service'
import { db } from '@/platform/db/client'
import { lessons } from '@/platform/db/schema'
import { track } from '@/platform/events'

/** Max heartbeats per POST — at 1/30s cadence this is >25 minutes of buffered playback. */
export const WATCH_EVENTS_MAX_BATCH = 50

/**
 * The accepted batch shape — mirrors the 'watch_heartbeat' entry of the
 * platform/events taxonomy (the taxonomy is the contract; this endpoint never
 * invents event shapes). Invalid payloads are rejected with EVENT_INVALID.
 */
const heartbeatSchema = z.object({
  lessonId: z.uuid(),
  secondsWatched: z.number().int().nonnegative(),
  occurredAt: z.coerce.date().optional(),
})
export const watchEventsBatchSchema = z.object({
  events: z.array(heartbeatSchema).min(1).max(WATCH_EVENTS_MAX_BATCH),
})
export type WatchHeartbeat = z.infer<typeof heartbeatSchema>

type IngestDeps = {
  /** Options injection for TESTS ONLY (upsert call counting) — production callers never pass it. */
  onUpsert?: () => void
}

/**
 * Batched ingestion (eng-schema S5): every heartbeat is track()ed to the spine
 * best-effort, then the batch folds to ONE monotonic lesson_progress upsert per
 * lesson (max secondsWatched + latest occurredAt). Unknown lesson ids are
 * tracked-then-skipped — ingestion is forgiving, the read model is strict.
 */
export async function ingestWatchEvents(
  userId: string,
  heartbeats: WatchHeartbeat[],
  deps: IngestDeps = {},
) {
  let tracked = 0
  for (const heartbeat of heartbeats) {
    const eventId = await track({
      name: 'watch_heartbeat',
      properties: { lessonId: heartbeat.lessonId, secondsWatched: heartbeat.secondsWatched },
      userId,
      ...(heartbeat.occurredAt ? { occurredAt: heartbeat.occurredAt } : {}),
    })
    if (eventId) tracked++
  }

  // Fold to the latest position per lesson — single upsert per lesson per batch
  const folded = new Map<string, { secondsWatched: number; watchedAt: Date }>()
  for (const heartbeat of heartbeats) {
    const at = heartbeat.occurredAt ?? new Date()
    const current = folded.get(heartbeat.lessonId)
    folded.set(heartbeat.lessonId, {
      secondsWatched: Math.max(current?.secondsWatched ?? 0, heartbeat.secondsWatched),
      watchedAt: current && current.watchedAt > at ? current.watchedAt : at,
    })
  }

  const knownLessons = await db
    .select({ id: lessons.id, durationSeconds: lessons.durationSeconds })
    .from(lessons)
    .where(inArray(lessons.id, [...folded.keys()]))

  let progressUpdated = 0
  for (const lesson of knownLessons) {
    const fold = folded.get(lesson.id)
    if (!fold) continue
    deps.onUpsert?.()
    await upsertLessonProgress(userId, lesson.id, {
      secondsWatched: fold.secondsWatched,
      durationSeconds: lesson.durationSeconds,
      watchedAt: fold.watchedAt,
    })
    progressUpdated++
  }

  return { tracked, progressUpdated }
}
