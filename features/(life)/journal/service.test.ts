import { afterAll, describe, expect, test } from 'bun:test'
import { and, eq } from 'drizzle-orm'
import { events, journalEntries } from '@/platform/db/schema'
import { createTestUser } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import {
  DEFAULT_ENTRIES_LIMIT,
  EVENING_PROMPT,
  getEntries,
  MORNING_PROMPT,
  saveEntry,
} from './service'

await setupTestDb()
afterAll(teardownTestDb)

async function journalEvents(userId: string) {
  return testDb
    .select()
    .from(events)
    .where(and(eq(events.userId, userId), eq(events.name, 'journal_entry_saved')))
}

describe('saveEntry', () => {
  test('first save inserts the entry, stores the fixed prompt, records the event', async () => {
    const user = await createTestUser()

    const result = await saveEntry(user!.id, {
      entryDate: '2026-06-10',
      kind: 'morning',
      content: 'Slept badly. Decided anyway.',
    })

    if ('error' in result) throw new Error(result.error)
    expect(result.created).toBe(true)
    expect(result.entry.prompt).toBe(MORNING_PROMPT)
    const recorded = await journalEvents(user!.id)
    expect(recorded).toHaveLength(1)
    expect(recorded[0]?.isDecision).toBe(true)
    expect(recorded[0]?.decisionKind).toBe('journal')
    expect(recorded[0]?.properties).toEqual({ entryDate: '2026-06-10', kind: 'morning' })
    // PII rule: content never reaches event properties
    expect(JSON.stringify(recorded[0]?.properties)).not.toContain('Slept badly')
  })

  test('re-saving the same (date, kind) UPDATES the entry and records NO second event', async () => {
    const user = await createTestUser()
    await saveEntry(user!.id, { entryDate: '2026-06-11', kind: 'evening', content: 'v1' })

    const result = await saveEntry(user!.id, {
      entryDate: '2026-06-11',
      kind: 'evening',
      content: 'v2 — added a thought before bed',
    })

    if ('error' in result) throw new Error(result.error)
    expect(result.created).toBe(false)
    const rows = await testDb
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.userId, user!.id), eq(journalEntries.entryDate, '2026-06-11')))
    expect(rows).toHaveLength(1)
    expect(rows[0]?.content).toBe('v2 — added a thought before bed')
    expect(await journalEvents(user!.id)).toHaveLength(1)
  })

  test('morning and evening of the same day are separate entries', async () => {
    const user = await createTestUser()

    await saveEntry(user!.id, { entryDate: '2026-06-12', kind: 'morning', content: 'am' })
    await saveEntry(user!.id, { entryDate: '2026-06-12', kind: 'evening', content: 'pm' })

    const rows = await testDb
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.userId, user!.id), eq(journalEntries.entryDate, '2026-06-12')))
    expect(rows).toHaveLength(2)
    expect(await journalEvents(user!.id)).toHaveLength(2)
  })

  test('entryDate is stored exactly as the client sent it — no timezone math', async () => {
    const user = await createTestUser()

    await saveEntry(user!.id, { entryDate: '2026-01-01', kind: 'morning', content: 'new year' })

    const [row] = await testDb
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, user!.id))
    expect(row?.entryDate).toBe('2026-01-01') // string in = string out, even across year boundary
  })

  test('race-condition insert (unique violation) → JOURNAL_DUPLICATE, never a crash', async () => {
    const user = await createTestUser()
    await saveEntry(user!.id, { entryDate: '2026-06-13', kind: 'morning', content: 'winner' })

    // Simulate the race: the existence check misses the concurrent winner's row.
    const result = await saveEntry(
      user!.id,
      { entryDate: '2026-06-13', kind: 'morning', content: 'loser' },
      { findExisting: async () => null },
    )

    expect('error' in result && result.error).toBe('JOURNAL_DUPLICATE')
    const rows = await testDb
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.userId, user!.id), eq(journalEntries.entryDate, '2026-06-13')))
    expect(rows[0]?.content).toBe('winner')
    expect(await journalEvents(user!.id)).toHaveLength(1) // loser recorded nothing
  })
})

describe('getEntries', () => {
  test('returns entries in range with cumulative counts', async () => {
    const user = await createTestUser()
    await saveEntry(user!.id, { entryDate: '2026-06-01', kind: 'morning', content: 'a' })
    await saveEntry(user!.id, { entryDate: '2026-06-01', kind: 'evening', content: 'b' })
    await saveEntry(user!.id, { entryDate: '2026-06-03', kind: 'morning', content: 'c' })
    await saveEntry(user!.id, { entryDate: '2026-05-01', kind: 'morning', content: 'old' })

    const { entries, counts } = await getEntries(user!.id, {
      from: '2026-06-01',
      to: '2026-06-30',
    })

    expect(entries).toHaveLength(3)
    expect(entries.map((e) => e.entryDate)).toEqual(['2026-06-03', '2026-06-01', '2026-06-01'])
    // counts are lifetime cumulative ("47 mornings journaled"), not range-scoped
    expect(counts).toEqual({ totalMornings: 3, totalEvenings: 1, totalDaysJournaled: 3 })
  })

  test('range is optional — returns everything', async () => {
    const user = await createTestUser()
    await saveEntry(user!.id, { entryDate: '2026-06-02', kind: 'morning', content: 'a' })

    const { entries } = await getEntries(user!.id, {})

    expect(entries).toHaveLength(1)
  })

  test('entries list is bounded by an explicit limit (newest first), counts stay lifetime', async () => {
    const user = await createTestUser()
    // 5 distinct days, morning + evening each = 10 entries.
    for (let day = 1; day <= 5; day++) {
      const entryDate = `2026-04-0${day}`
      await saveEntry(user!.id, { entryDate, kind: 'morning', content: `am-${day}` })
      await saveEntry(user!.id, { entryDate, kind: 'evening', content: `pm-${day}` })
    }

    const { entries, counts } = await getEntries(user!.id, { limit: 3 })

    // Only the newest 3 rows come back...
    expect(entries).toHaveLength(3)
    expect(entries.map((e) => e.entryDate)).toEqual(['2026-04-05', '2026-04-05', '2026-04-04'])
    // ...but the counts query is a lifetime aggregate, unaffected by the window.
    expect(counts).toEqual({ totalMornings: 5, totalEvenings: 5, totalDaysJournaled: 5 })
  })

  test('the entries window defaults to DEFAULT_ENTRIES_LIMIT when no limit is passed', async () => {
    const user = await createTestUser()
    const total = DEFAULT_ENTRIES_LIMIT + 5
    const dateFor = (i: number) => {
      // One entry per day so every (date, kind) is unique; dates walk forward from a base.
      const d = new Date(Date.UTC(2025, 0, 1 + i))
      return d.toISOString().slice(0, 10)
    }
    for (let i = 0; i < total; i++) {
      await saveEntry(user!.id, { entryDate: dateFor(i), kind: 'morning', content: `e-${i}` })
    }

    const { entries } = await getEntries(user!.id)

    expect(entries).toHaveLength(DEFAULT_ENTRIES_LIMIT)
  })

  test('NO streak fields anywhere in the response shape (no-shame rule)', async () => {
    const user = await createTestUser()
    await saveEntry(user!.id, { entryDate: '2026-06-05', kind: 'morning', content: 'a' })

    const result = await getEntries(user!.id, {})

    expect(Object.keys(result.counts).sort()).toEqual([
      'totalDaysJournaled',
      'totalEvenings',
      'totalMornings',
    ])
    expect(JSON.stringify(result).toLowerCase()).not.toContain('streak')
  })
})

describe('prompts', () => {
  test('fixed prompts exist and pass the banned-vocabulary smoke test', () => {
    const banned = ['delve', 'robust', 'comprehensive', 'journey', 'unlock', 'empower']
    for (const prompt of [MORNING_PROMPT, EVENING_PROMPT]) {
      expect(prompt.length).toBeGreaterThan(10)
      for (const word of banned) {
        expect(prompt.toLowerCase()).not.toContain(word)
      }
    }
  })
})
