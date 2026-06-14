import { and, eq, ne } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { lessons, lives } from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'
import { ProviderError } from '@/providers/errors'
import { parseWebhookEvent, verifyWebhookSignature } from '@/providers/video'

type WebhookResult =
  | { error: ErrorCode; details?: string }
  | { received: true; lessonsUpdated: number; livesUpdated: number }

/**
 * Stream webhook handler (eng-schema S4). HMAC-verified, IDEMPOTENT: every update is
 * guarded by a state predicate, so re-delivery matches zero rows and no-ops.
 * Matches lessons by streamVideoId AND lives by replayStreamVideoId — lesson videos and
 * live replays flow through the same Stream account.
 */
export async function handleStreamWebhook(
  rawBody: string,
  signatureHeader: string | null | undefined,
): Promise<WebhookResult> {
  if (!verifyWebhookSignature(rawBody, signatureHeader)) {
    return { error: 'STREAM_WEBHOOK_INVALID' }
  }

  let event: ReturnType<typeof parseWebhookEvent>
  try {
    event = parseWebhookEvent(rawBody)
  } catch (error) {
    if (error instanceof ProviderError) {
      return { error: 'VALIDATION_ERROR', details: 'Unparseable Stream webhook payload' }
    }
    throw error
  }

  const now = new Date()
  let lessonsUpdated = 0
  let livesUpdated = 0

  if (event.status.state === 'ready' || event.readyToStream) {
    const updatedLessons = await db
      .update(lessons)
      .set({
        videoStatus: 'ready',
        ...(event.duration !== undefined ? { durationSeconds: Math.round(event.duration) } : {}),
        updatedAt: now,
      })
      .where(and(eq(lessons.streamVideoId, event.uid), ne(lessons.videoStatus, 'ready')))
      .returning({ id: lessons.id })
    lessonsUpdated = updatedLessons.length

    const updatedLives = await db
      .update(lives)
      .set({ replayStatus: 'ready', updatedAt: now })
      .where(and(eq(lives.replayStreamVideoId, event.uid), ne(lives.replayStatus, 'ready')))
      .returning({ id: lives.id })
    livesUpdated = updatedLives.length
  } else if (event.status.state === 'error') {
    const updatedLessons = await db
      .update(lessons)
      .set({ videoStatus: 'error', updatedAt: now })
      .where(and(eq(lessons.streamVideoId, event.uid), ne(lessons.videoStatus, 'error')))
      .returning({ id: lessons.id })
    lessonsUpdated = updatedLessons.length

    // Reset failed replays so the admin can retry the upload.
    const updatedLives = await db
      .update(lives)
      .set({ replayStatus: 'none', replayStreamVideoId: null, updatedAt: now })
      .where(and(eq(lives.replayStreamVideoId, event.uid), eq(lives.replayStatus, 'processing')))
      .returning({ id: lives.id })
    livesUpdated = updatedLives.length
  } else {
    // pendingupload / downloading / queued / inprogress → encoding has started.
    // Only an 'uploading' lesson advances; 'ready' is never downgraded by late events.
    const updatedLessons = await db
      .update(lessons)
      .set({ videoStatus: 'processing', updatedAt: now })
      .where(and(eq(lessons.streamVideoId, event.uid), eq(lessons.videoStatus, 'uploading')))
      .returning({ id: lessons.id })
    lessonsUpdated = updatedLessons.length
  }

  return { received: true, lessonsUpdated, livesUpdated }
}
