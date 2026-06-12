import { eq, sql } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { events } from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'
import * as analytics from '@/providers/analytics'
import type { EventInput, EventName, EventSource } from './taxonomy'
import { decisionMeta, eventSchema } from './taxonomy'

/**
 * The event spine write boundary (ADR 6, eng-schema M3/M4).
 *
 * Double-write contract:
 * - Postgres is the source of truth: the insert is awaited, inside the caller's
 *   transaction when one is given.
 * - PostHog (providers/analytics.ts) is a dumb mirror: fired only AFTER a
 *   successful insert — and, with a tx, only after the row is COMMITTED —
 *   fire-and-forget, errors swallowed + logged, never retried.
 * - Divergence is allowed in one direction only: Postgres ≥ PostHog.
 */

/** Service-layer error carrying EVENT_INVALID semantics; the route boundary maps it via throwError(c, err.code). */
export class EventInvalidError extends Error {
  readonly code = 'EVENT_INVALID' satisfies ErrorCode

  constructor(details: string) {
    super(`Invalid event name or properties: ${details}`)
    this.name = 'EventInvalidError'
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
export type DbOrTx = typeof db | Tx

export type EventEnvelope = EventInput & {
  /** Identity: at least one of userId/anonymousId is required (pre-auth funnel uses anonymousId). */
  userId?: string | null
  anonymousId?: string | null
  /** Event time override — backfill sets the original createdAt. Defaults to now(). */
  occurredAt?: Date
  /** Idempotency key for backfills ('user_decisions:<uuid>') — duplicates no-op on the partial unique index. */
  sourceRef?: string
  /** Ingestion channel. Defaults to 'app'. */
  source?: EventSource
}

/** How long we keep checking for the caller's commit before giving up on the mirror.
 * A rolled-back tx never becomes visible → no mirror (the allowed divergence direction). */
const MIRROR_COMMIT_CHECK_DELAYS_MS = [0, 25, 100, 250]

function validate(event: EventEnvelope): EventInput {
  const parsed = eventSchema.safeParse({ name: event.name, properties: event.properties })
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'event'}: ${issue.message}`)
      .join('; ')
    throw new EventInvalidError(details)
  }
  if (!event.userId && !event.anonymousId) {
    throw new EventInvalidError('userId or anonymousId is required')
  }
  return parsed.data
}

/** Mirror to PostHog. Fire-and-forget: swallowed + logged, NEVER retried. */
function fireMirror(name: EventName, properties: Record<string, unknown>, distinctId?: string) {
  try {
    analytics.track(name, properties, distinctId)
  } catch (error) {
    console.error('[events] PostHog mirror failed (not retried):', error)
  }
}

/**
 * Mirror only once the row is visible OUTSIDE the caller's transaction, i.e.
 * after commit. We poll the main connection a few times (bounded); if the row
 * never appears the transaction rolled back and we correctly mirror nothing.
 * This is commit detection, not a PostHog retry — the mirror fires at most once.
 */
function scheduleMirrorAfterCommit(
  eventId: string,
  name: EventName,
  properties: Record<string, unknown>,
  distinctId?: string,
) {
  void (async () => {
    for (const delayMs of MIRROR_COMMIT_CHECK_DELAYS_MS) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      try {
        const [committed] = await db
          .select({ id: events.id })
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1)
        if (committed) {
          fireMirror(name, properties, distinctId)
          return
        }
      } catch (error) {
        console.error('[events] post-commit mirror check failed (mirror skipped):', error)
        return
      }
    }
    // Row never became visible: the caller's transaction rolled back.
    // Correct outcome — Postgres ≥ PostHog holds, nothing to mirror.
  })()
}

/**
 * Record an event. The Postgres insert is awaited — pass the caller's `tx` for
 * decision-bearing events so the event commits/rolls back with the domain write.
 * Returns the event id, or null when a sourceRef duplicate no-oped (no re-mirror).
 * Throws EventInvalidError on taxonomy violations; DB errors propagate (the
 * caller's transaction must abort).
 */
export async function record(event: EventEnvelope, tx?: DbOrTx): Promise<string | null> {
  const parsed = validate(event)
  const meta = decisionMeta(parsed.name)
  const source = event.source ?? 'app'

  const inserted = await (tx ?? db)
    .insert(events)
    .values({
      userId: event.userId ?? null,
      anonymousId: event.anonymousId ?? null,
      name: parsed.name,
      properties: parsed.properties,
      source,
      // Baked into the taxonomy — the caller can't override what counts as a decision.
      isDecision: meta.isDecision,
      decisionKind: meta.decisionKind,
      sourceRef: event.sourceRef ?? null,
      ...(event.occurredAt ? { occurredAt: event.occurredAt } : {}),
    })
    .onConflictDoNothing({ target: events.sourceRef, where: sql`source_ref IS NOT NULL` })
    .returning({ id: events.id })

  const row = inserted[0]
  if (!row) return null // sourceRef duplicate: already recorded AND already mirrored

  const distinctId = event.userId ?? event.anonymousId ?? undefined
  const mirrorProperties = {
    ...parsed.properties,
    isDecision: meta.isDecision,
    decisionKind: meta.decisionKind,
    source,
  }

  if (tx) {
    // Inside a caller transaction: mirror only after the commit becomes visible.
    scheduleMirrorAfterCommit(row.id, parsed.name, mirrorProperties, distinctId)
  } else {
    // Autocommit insert already durable — mirror now.
    fireMirror(parsed.name, mirrorProperties, distinctId)
  }
  return row.id
}

/**
 * Telemetry-grade best-effort write (heartbeats): swallow-and-log on ANY
 * failure (validation, DB, mirror). Never throws, never joins a transaction.
 */
export async function track(event: EventEnvelope): Promise<string | null> {
  try {
    return await record(event)
  } catch (error) {
    console.error('[events] track() best-effort write failed (swallowed):', error)
    return null
  }
}
