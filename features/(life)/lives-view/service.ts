import { and, asc, eq } from 'drizzle-orm'
import { activeEnrollmentClause, canAccessLive } from '@/features/(shared)/enrollment/service'
import { db } from '@/platform/db/client'
import { enrollments, lives } from '@/platform/db/schema'
import { record } from '@/platform/events'
import { signPlaybackToken } from '@/providers/video'

type LiveRow = typeof lives.$inferSelect

/** Options injection for TESTS ONLY — production callers never pass it. */
type EventDeps = { record?: typeof record }

export const liveStates = ['upcoming', 'live-now', 'replay-ready', 'cancelled'] as const
export type LiveState = (typeof liveStates)[number]

/**
 * Derived state (TD-1: derived state can't drift), precedence order is load-bearing:
 * cancelled → replay-ready (ready status AND a video id) → upcoming → live-now.
 */
export function deriveLiveState(
  live: Pick<LiveRow, 'scheduledAt' | 'cancelledAt' | 'replayStatus' | 'replayStreamVideoId'>,
  now: Date,
): LiveState {
  if (live.cancelledAt) return 'cancelled'
  if (live.replayStatus === 'ready' && live.replayStreamVideoId) return 'replay-ready'
  if (now < live.scheduledAt) return 'upcoming'
  return 'live-now'
}

function toLiveView(live: LiveRow, now: Date) {
  return {
    id: live.id,
    programId: live.programId,
    title: live.title,
    description: live.description,
    scheduledAt: live.scheduledAt,
    cancelledAt: live.cancelledAt,
    youtubeUrl: live.youtubeUrl,
    replayReady: deriveLiveState(live, now) === 'replay-ready',
    state: deriveLiveState(live, now),
  }
}

/** Resolver for requireEnrollment: the program owning this live. */
export async function programIdForLive(liveId: string): Promise<string | null> {
  const [row] = await db
    .select({ programId: lives.programId })
    .from(lives)
    .where(eq(lives.id, liveId))
    .limit(1)
  return row?.programId ?? null
}

/**
 * Enrollment-scoped lives list (ONE Lives section, ADR 3) — cancelled lives are
 * returned with state 'cancelled', never silently skipped (Gate C).
 */
export async function listLives(userId: string, now = new Date()) {
  const rows = await db
    .select({ live: lives })
    .from(lives)
    .innerJoin(
      enrollments,
      and(
        eq(enrollments.programId, lives.programId),
        eq(enrollments.userId, userId),
        activeEnrollmentClause(),
      ),
    )
    .orderBy(asc(lives.scheduledAt))
  return rows.map((row) => toLiveView(row.live, now))
}

/** Single live with derived state; records 'live_viewed' when it is live right now. */
export async function getLive(
  userId: string,
  liveId: string,
  now = new Date(),
  deps: EventDeps = {},
) {
  const recordEvent = deps.record ?? record

  const [live] = await db.select().from(lives).where(eq(lives.id, liveId)).limit(1)
  if (!live) return { error: 'NOT_FOUND' as const }
  if (!(await canAccessLive(userId, liveId))) return { error: 'ENROLLMENT_REQUIRED' as const }

  const view = toLiveView(live, now)
  if (view.state === 'live-now') {
    await recordEvent({ name: 'live_viewed', properties: { liveId }, userId })
  }
  return { data: view }
}

/**
 * Gated replay playback: canAccessLive + replay-ready, then a signed Stream token
 * (TD-6) and record('replay_watched'). Not-ready replays (processing, cancelled,
 * missing video) are VIDEO_NOT_READY — no token, no event.
 */
export async function getLiveReplay(
  userId: string,
  liveId: string,
  now = new Date(),
  deps: EventDeps = {},
) {
  const recordEvent = deps.record ?? record

  const [live] = await db.select().from(lives).where(eq(lives.id, liveId)).limit(1)
  if (!live) return { error: 'NOT_FOUND' as const }
  if (!(await canAccessLive(userId, liveId))) return { error: 'ENROLLMENT_REQUIRED' as const }
  if (deriveLiveState(live, now) !== 'replay-ready' || !live.replayStreamVideoId) {
    return { error: 'VIDEO_NOT_READY' as const }
  }

  const playbackToken = await signPlaybackToken(live.replayStreamVideoId)
  await recordEvent({ name: 'replay_watched', properties: { liveId }, userId })

  return { data: { playbackToken, streamVideoId: live.replayStreamVideoId } }
}
