import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { events, readingAnalytics, userDecisions } from '@/platform/db/schema'
import { createTestUser } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import {
  backfillDecisionEvents,
  formatBackfillReport,
  LEGACY_DECISION_EVENT,
  LEGACY_READING_EVENT,
} from './backfill-decision-events'

async function createUserDecision(userId: string, n: number) {
  const [row] = await testDb
    .insert(userDecisions)
    .values({
      userId,
      classId: `class-${n}`,
      blockId: `block-${n}`,
      courseSlug: 'life-decisions',
      decisionType: 'text',
      prompt: `Prompt ${n}`,
      response: `Response ${n}`,
      createdAt: new Date('2025-11-03T12:00:00Z'),
    })
    .returning()
  if (!row) throw new Error('failed to create user decision')
  return row
}

async function createReadingAnalytics(userId: string, n: number) {
  const [row] = await testDb
    .insert(readingAnalytics)
    .values({
      userId,
      classId: `class-${n}`,
      courseSlug: 'life-decisions',
      timeSpentSec: 120 + n,
      scrollDepth: 80,
      completedAt: new Date('2025-11-04T09:00:00Z'),
      createdAt: new Date('2025-11-04T08:00:00Z'),
    })
    .returning()
  if (!row) throw new Error('failed to create reading analytics row')
  return row
}

describe('integration: backfill-decision-events', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(teardownTestDb)

  test('backfills userDecisions as decision events with correct sourceRef and flags', async () => {
    const user = await createTestUser()
    const decision = await createUserDecision(user!.id, 1)

    const report = await backfillDecisionEvents(testDb)

    expect(report.decisions.inserted).toBe(1)
    const [event] = await testDb
      .select()
      .from(events)
      .where(eq(events.sourceRef, `user_decisions:${decision.id}`))
    if (!event) throw new Error('expected event row')
    expect(event.name).toBe(LEGACY_DECISION_EVENT)
    expect(event.userId).toBe(user!.id)
    expect(event.source).toBe('backfill')
    expect(event.isDecision).toBe(true)
    expect(event.decisionKind).toBe('lesson_prompt')
    expect(event.occurredAt.getTime()).toBe(decision.createdAt.getTime())
    expect(event.properties).toMatchObject({
      classId: 'class-1',
      blockId: 'block-1',
      courseSlug: 'life-decisions',
      decisionType: 'text',
      response: 'Response 1',
    })
  })

  test('backfills readingAnalytics as non-decision events', async () => {
    const user = await createTestUser()
    const reading = await createReadingAnalytics(user!.id, 1)

    const report = await backfillDecisionEvents(testDb)

    expect(report.readings.inserted).toBe(1)
    const [event] = await testDb
      .select()
      .from(events)
      .where(eq(events.sourceRef, `reading_analytics:${reading.id}`))
    if (!event) throw new Error('expected event row')
    expect(event.name).toBe(LEGACY_READING_EVENT)
    expect(event.isDecision).toBe(false)
    expect(event.decisionKind).toBeNull()
    expect(event.source).toBe('backfill')
    expect(event.occurredAt.getTime()).toBe(reading.createdAt.getTime())
    expect(event.properties).toMatchObject({
      classId: 'class-1',
      timeSpentSec: 121,
      scrollDepth: 80,
    })
  })

  test('second run is a no-op (idempotent via sourceRef partial unique index)', async () => {
    const user = await createTestUser()
    await createUserDecision(user!.id, 1)
    await createUserDecision(user!.id, 2)
    await createReadingAnalytics(user!.id, 1)

    const first = await backfillDecisionEvents(testDb)
    const second = await backfillDecisionEvents(testDb)

    expect(first.decisions.inserted).toBe(2)
    expect(first.readings.inserted).toBe(1)
    expect(second.decisions.inserted).toBe(0)
    expect(second.readings.inserted).toBe(0)
    expect(second.decisions.skipped).toBe(2)
    expect(second.readings.skipped).toBe(1)
    expect(await testDb.select().from(events)).toHaveLength(3)
  })

  test('--dry-run writes nothing and reports would-insert counts', async () => {
    const user = await createTestUser()
    await createUserDecision(user!.id, 1)
    await createReadingAnalytics(user!.id, 1)

    const report = await backfillDecisionEvents(testDb, { dryRun: true })

    expect(report.dryRun).toBe(true)
    expect(report.decisions.inserted).toBe(1)
    expect(report.readings.inserted).toBe(1)
    expect(await testDb.select().from(events)).toHaveLength(0)
  })

  test('dry-run after a real run reports everything as skipped', async () => {
    const user = await createTestUser()
    await createUserDecision(user!.id, 1)
    await backfillDecisionEvents(testDb)

    const report = await backfillDecisionEvents(testDb, { dryRun: true })

    expect(report.decisions.inserted).toBe(0)
    expect(report.decisions.skipped).toBe(1)
    expect(await testDb.select().from(events)).toHaveLength(1)
  })

  test('handles an empty database without error', async () => {
    const report = await backfillDecisionEvents(testDb)

    expect(report.decisions.scanned).toBe(0)
    expect(report.readings.scanned).toBe(0)
    expect(report.decisions.inserted).toBe(0)
    expect(report.readings.inserted).toBe(0)
  })

  test('formatBackfillReport summarizes both sources', () => {
    const lines = formatBackfillReport({
      dryRun: true,
      decisions: { scanned: 5, inserted: 3, skipped: 2 },
      readings: { scanned: 4, inserted: 4, skipped: 0 },
    }).join('\n')

    expect(lines).toContain('DRY RUN')
    expect(lines).toContain('user_decisions')
    expect(lines).toContain('reading_analytics')
    expect(lines).toContain('3')
    expect(lines).toContain('4')
  })
})
