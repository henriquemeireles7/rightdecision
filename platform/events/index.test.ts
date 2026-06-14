import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { events } from '@/platform/db/schema'
import type { EventEnvelope } from '@/platform/events'
import { EventInvalidError, record, track } from '@/platform/events'
import { createTestUser } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import * as analytics from '@/providers/analytics'

const LESSON_ID = '7b8a4c1e-2f3d-4a5b-9c8d-1e2f3a4b5c6d'
const MISSING_USER_ID = '00000000-0000-4000-8000-000000000000'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor(condition: () => boolean, timeoutMs = 1500) {
  const start = Date.now()
  while (!condition() && Date.now() - start < timeoutMs) {
    await sleep(20)
  }
}

async function allEvents() {
  return testDb.select().from(events)
}

async function makeUser() {
  const user = await createTestUser()
  if (!user) throw new Error('failed to create test user')
  return user
}

async function singleEvent() {
  const rows = await allEvents()
  expect(rows).toHaveLength(1)
  const row = rows[0]
  if (!row) throw new Error('expected exactly one event row')
  return row
}

describe('integration: platform/events', () => {
  let trackSpy: ReturnType<typeof spyOn<typeof analytics, 'track'>>

  beforeAll(setupTestDb)
  afterAll(teardownTestDb)

  beforeEach(() => {
    trackSpy = spyOn(analytics, 'track').mockImplementation(() => {})
  })

  afterEach(async () => {
    // let any deferred post-commit mirror checks finish before resetting state
    await sleep(500)
    trackSpy.mockRestore()
    await testDb.delete(events)
  })

  describe('record(): validation (EVENT_INVALID semantics)', () => {
    test('rejects an invalid event name; no row, no mirror', async () => {
      const user = await makeUser()
      const bad = {
        name: 'made_up_event',
        properties: {},
        userId: user.id,
      } as unknown as EventEnvelope
      const promise = record(bad)
      await expect(promise).rejects.toBeInstanceOf(EventInvalidError)
      await expect(record(bad)).rejects.toMatchObject({ code: 'EVENT_INVALID' })
      expect(await allEvents()).toHaveLength(0)
      expect(trackSpy).not.toHaveBeenCalled()
    })

    test('rejects invalid properties; no row, no mirror', async () => {
      const user = await makeUser()
      const bad = {
        name: 'watch_heartbeat',
        properties: { lessonId: LESSON_ID, secondsWatched: 'thirty' },
        userId: user.id,
      } as unknown as EventEnvelope
      await expect(record(bad)).rejects.toMatchObject({ code: 'EVENT_INVALID' })
      expect(await allEvents()).toHaveLength(0)
      expect(trackSpy).not.toHaveBeenCalled()
    })

    test('rejects an event with neither userId nor anonymousId', async () => {
      await expect(
        record({ name: 'lesson_started', properties: { lessonId: LESSON_ID } }),
      ).rejects.toMatchObject({ code: 'EVENT_INVALID' })
      expect(await allEvents()).toHaveLength(0)
    })
  })

  describe('record(): decision flags come from the taxonomy, never the caller', () => {
    test('decision event gets isDecision + decisionKind baked in', async () => {
      const user = await makeUser()
      await record({
        name: 'decision_prompt_answered',
        properties: { lessonId: LESSON_ID },
        userId: user.id,
      })
      const row = await singleEvent()
      expect(row.isDecision).toBe(true)
      expect(row.decisionKind).toBe('lesson_prompt')
    })

    test('non-decision event gets isDecision=false, decisionKind=null', async () => {
      const user = await makeUser()
      await record({ name: 'lesson_started', properties: { lessonId: LESSON_ID }, userId: user.id })
      const row = await singleEvent()
      expect(row.isDecision).toBe(false)
      expect(row.decisionKind).toBeNull()
    })

    test('caller-supplied isDecision/decisionKind are ignored', async () => {
      const user = await makeUser()
      const tampered = {
        name: 'watch_heartbeat',
        properties: { lessonId: LESSON_ID, secondsWatched: 30 },
        userId: user.id,
        isDecision: true,
        decisionKind: 'journal',
      } as unknown as EventEnvelope
      await record(tampered)
      const row = await singleEvent()
      expect(row.isDecision).toBe(false)
      expect(row.decisionKind).toBeNull()
    })
  })

  describe('record(): Postgres insert + PostHog mirror ordering', () => {
    test('writes the row, then mirrors once with the validated properties + meta', async () => {
      const user = await makeUser()
      const id = await record({
        name: 'decision_prompt_answered',
        properties: { lessonId: LESSON_ID },
        userId: user.id,
      })
      expect(id).not.toBeNull()
      const row = await singleEvent()
      expect(row.name).toBe('decision_prompt_answered')
      expect(row.properties).toEqual({ lessonId: LESSON_ID })
      expect(row.userId).toBe(user.id)
      expect(row.source).toBe('app')
      expect(trackSpy).toHaveBeenCalledTimes(1)
      expect(trackSpy).toHaveBeenCalledWith(
        'decision_prompt_answered',
        expect.objectContaining({
          lessonId: LESSON_ID,
          isDecision: true,
          decisionKind: 'lesson_prompt',
          source: 'app',
        }),
        user.id,
      )
    })

    test('mirror is NOT called when the insert fails (FK violation)', async () => {
      await expect(
        record({
          name: 'lesson_started',
          properties: { lessonId: LESSON_ID },
          userId: MISSING_USER_ID,
        }),
      ).rejects.toThrow()
      expect(trackSpy).not.toHaveBeenCalled()
      expect(await allEvents()).toHaveLength(0)
    })

    test('mirror failure does not throw or block; the Postgres row survives', async () => {
      trackSpy.mockImplementation(() => {
        throw new Error('posthog down')
      })
      const user = await makeUser()
      const id = await record({
        name: 'lesson_completed',
        properties: { lessonId: LESSON_ID },
        userId: user.id,
      })
      expect(id).not.toBeNull()
      expect(await allEvents()).toHaveLength(1)
    })
  })

  describe('record(): caller transaction participation', () => {
    test('committed transaction persists the row and mirrors after commit', async () => {
      const user = await makeUser()
      await testDb.transaction(async (tx) => {
        await record(
          {
            name: 'decision_prompt_answered',
            properties: { lessonId: LESSON_ID },
            userId: user.id,
          },
          tx,
        )
        // mirror must not fire while the transaction is still open
        expect(trackSpy).not.toHaveBeenCalled()
      })
      expect(await allEvents()).toHaveLength(1)
      await waitFor(() => trackSpy.mock.calls.length > 0)
      expect(trackSpy).toHaveBeenCalledTimes(1)
    })

    test('rolled-back transaction removes the row and produces NO mirror call', async () => {
      const user = await makeUser()
      await expect(
        testDb.transaction(async (tx) => {
          await record(
            {
              name: 'decision_prompt_answered',
              properties: { lessonId: LESSON_ID },
              userId: user.id,
            },
            tx,
          )
          throw new Error('domain write failed — roll everything back')
        }),
      ).rejects.toThrow('domain write failed')
      expect(await allEvents()).toHaveLength(0)
      // give the deferred commit-visibility checks time to exhaust
      await sleep(600)
      expect(trackSpy).not.toHaveBeenCalled()
    })
  })

  describe('record(): envelope options', () => {
    test('anonymous events persist with null userId and mirror with anonymousId', async () => {
      const id = await record({
        name: 'cohort_page_viewed',
        properties: {},
        anonymousId: 'anon-123',
      })
      expect(id).not.toBeNull()
      const row = await singleEvent()
      expect(row.userId).toBeNull()
      expect(row.anonymousId).toBe('anon-123')
      expect(trackSpy).toHaveBeenCalledWith('cohort_page_viewed', expect.any(Object), 'anon-123')
    })

    test('occurredAt override persists (backfill sets original event time)', async () => {
      const user = await makeUser()
      const occurredAt = new Date('2024-03-01T12:00:00.000Z')
      await record({
        name: 'legacy_reading_backfilled',
        properties: {
          classId: 'c1',
          courseSlug: 'life-decisions',
          timeSpentSec: 60,
          scrollDepth: 50,
        },
        userId: user.id,
        source: 'backfill',
        occurredAt,
      })
      const row = await singleEvent()
      expect(row.occurredAt.getTime()).toBe(occurredAt.getTime())
      expect(row.source).toBe('backfill')
    })

    test('source persists for non-default channels', async () => {
      const user = await makeUser()
      await record({
        name: 'watch_heartbeat',
        properties: { lessonId: LESSON_ID, secondsWatched: 30 },
        userId: user.id,
        source: 'stream_player',
      })
      const row = await singleEvent()
      expect(row.source).toBe('stream_player')
    })

    test('sourceRef conflict no-ops: insert twice, one row, one mirror, second returns null', async () => {
      const user = await makeUser()
      const envelope: EventEnvelope = {
        name: 'legacy_decision_backfilled',
        properties: {
          classId: 'c1',
          blockId: 'b1',
          courseSlug: 'life-decisions',
          decisionType: 'text',
        },
        userId: user.id,
        source: 'backfill',
        sourceRef: 'user_decisions:11111111-1111-4111-8111-111111111111',
      }
      const first = await record(envelope)
      const second = await record(envelope)
      expect(first).not.toBeNull()
      expect(second).toBeNull()
      const row = await singleEvent()
      expect(row.sourceRef).toBe('user_decisions:11111111-1111-4111-8111-111111111111')
      expect(trackSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('track(): best-effort telemetry', () => {
    test('writes an events row and mirrors to PostHog', async () => {
      const user = await makeUser()
      const id = await track({
        name: 'watch_heartbeat',
        properties: { lessonId: LESSON_ID, secondsWatched: 30 },
        userId: user.id,
        source: 'stream_player',
      })
      expect(id).not.toBeNull()
      expect(await allEvents()).toHaveLength(1)
      expect(trackSpy).toHaveBeenCalledTimes(1)
    })

    test('swallows DB failure: resolves null, no throw, no mirror', async () => {
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
      try {
        const id = await track({
          name: 'watch_heartbeat',
          properties: { lessonId: LESSON_ID, secondsWatched: 30 },
          userId: MISSING_USER_ID,
        })
        expect(id).toBeNull()
        expect(trackSpy).not.toHaveBeenCalled()
        expect(errorSpy).toHaveBeenCalled()
      } finally {
        errorSpy.mockRestore()
      }
    })

    test('swallows invalid events: resolves null, nothing written', async () => {
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
      try {
        const id = await track({
          name: 'not_an_event',
          properties: {},
          anonymousId: 'anon-1',
        } as unknown as EventEnvelope)
        expect(id).toBeNull()
        expect(await allEvents()).toHaveLength(0)
        expect(trackSpy).not.toHaveBeenCalled()
      } finally {
        errorSpy.mockRestore()
      }
    })
  })
})
