/**
 * Legacy-data backfill into the V2 events spine (free Decision Graph data).
 *
 * - userDecisions → decision events (isDecision=true, decisionKind='lesson_prompt')
 * - readingAnalytics → non-decision telemetry events
 *
 * Idempotent via the partial unique index on events.sourceRef
 * (sourceRef='user_decisions:<id>' / 'reading_analytics:<id>') + ON CONFLICT
 * DO NOTHING — re-run = no duplicate events. occurredAt is the ORIGINAL
 * createdAt of the source row; source='backfill'.
 *
 * Event names: platform/events/taxonomy did not exist when this was written,
 * so rows are inserted directly into the events table under the names below.
 * If/when the taxonomy declares these, keep the names in sync.
 *
 * Usage: bun run platform/scripts/backfill-decision-events.ts [--dry-run]
 */

import { isNotNull } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '@/platform/db/schema'
import { events, readingAnalytics, userDecisions } from '@/platform/db/schema'

type Db = PostgresJsDatabase<typeof schema>

export const LEGACY_DECISION_EVENT = 'legacy_decision_backfilled'
export const LEGACY_READING_EVENT = 'legacy_reading_backfilled'

const CHUNK_SIZE = 500

type SourceCounts = { scanned: number; inserted: number; skipped: number }

export type BackfillReport = {
  dryRun: boolean
  decisions: SourceCounts
  readings: SourceCounts
}

type EventInsert = typeof events.$inferInsert

async function insertChunked(db: Db, rows: EventInsert[]): Promise<number> {
  let inserted = 0
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE)
    // No target: plain ON CONFLICT DO NOTHING covers the partial unique
    // index on sourceRef (WHERE source_ref IS NOT NULL) — re-runs no-op.
    const result = await db
      .insert(events)
      .values(chunk)
      .onConflictDoNothing()
      .returning({ id: events.id })
    inserted += result.length
  }
  return inserted
}

export async function backfillDecisionEvents(
  db: Db,
  opts: { dryRun?: boolean } = {},
): Promise<BackfillReport> {
  const dryRun = opts.dryRun ?? false

  const decisions = await db.select().from(userDecisions)
  const readings = await db.select().from(readingAnalytics)

  const decisionRows: EventInsert[] = decisions.map((decision) => ({
    userId: decision.userId,
    name: LEGACY_DECISION_EVENT,
    properties: {
      classId: decision.classId,
      blockId: decision.blockId,
      courseSlug: decision.courseSlug,
      decisionType: decision.decisionType,
      prompt: decision.prompt,
      response: decision.response,
      isCustom: decision.isCustom,
    },
    source: 'backfill' as const,
    isDecision: true,
    decisionKind: 'lesson_prompt' as const,
    sourceRef: `user_decisions:${decision.id}`,
    occurredAt: decision.createdAt,
  }))

  const readingRows: EventInsert[] = readings.map((reading) => ({
    userId: reading.userId,
    name: LEGACY_READING_EVENT,
    properties: {
      classId: reading.classId,
      courseSlug: reading.courseSlug,
      timeSpentSec: reading.timeSpentSec,
      scrollDepth: reading.scrollDepth,
      completedAt: reading.completedAt?.toISOString() ?? null,
    },
    source: 'backfill' as const,
    isDecision: false,
    sourceRef: `reading_analytics:${reading.id}`,
    occurredAt: reading.createdAt,
  }))

  if (dryRun) {
    const existing = await db
      .select({ sourceRef: events.sourceRef })
      .from(events)
      .where(isNotNull(events.sourceRef))
    const existingRefs = new Set(existing.map((row) => row.sourceRef))
    const wouldInsertDecisions = decisionRows.filter(
      (row) => !existingRefs.has(row.sourceRef ?? null),
    ).length
    const wouldInsertReadings = readingRows.filter(
      (row) => !existingRefs.has(row.sourceRef ?? null),
    ).length
    return {
      dryRun: true,
      decisions: {
        scanned: decisions.length,
        inserted: wouldInsertDecisions,
        skipped: decisions.length - wouldInsertDecisions,
      },
      readings: {
        scanned: readings.length,
        inserted: wouldInsertReadings,
        skipped: readings.length - wouldInsertReadings,
      },
    }
  }

  const insertedDecisions = await insertChunked(db, decisionRows)
  const insertedReadings = await insertChunked(db, readingRows)

  return {
    dryRun: false,
    decisions: {
      scanned: decisions.length,
      inserted: insertedDecisions,
      skipped: decisions.length - insertedDecisions,
    },
    readings: {
      scanned: readings.length,
      inserted: insertedReadings,
      skipped: readings.length - insertedReadings,
    },
  }
}

export function formatBackfillReport(report: BackfillReport): string[] {
  const verb = report.dryRun ? 'would be inserted' : 'inserted'
  const lines: string[] = []
  if (report.dryRun) lines.push('DRY RUN — no writes performed.')
  lines.push(
    `user_decisions → events: ${report.decisions.scanned} scanned, ${report.decisions.inserted} ${verb}, ${report.decisions.skipped} skipped (already backfilled)`,
    `reading_analytics → events: ${report.readings.scanned} scanned, ${report.readings.inserted} ${verb}, ${report.readings.skipped} skipped (already backfilled)`,
  )
  return lines
}

if (import.meta.main) {
  const { db } = await import('@/platform/db/client')
  backfillDecisionEvents(db, { dryRun: Bun.argv.includes('--dry-run') })
    .then((report) => {
      for (const line of formatBackfillReport(report)) console.log(line)
      process.exit(0)
    })
    .catch((err) => {
      console.error('Backfill failed:', err)
      process.exit(1)
    })
}
