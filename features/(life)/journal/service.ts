import { and, desc, eq, gte, lte, type SQL, sql } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { journalEntries } from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'
import { record } from '@/platform/events'

type ServiceError = { error: ErrorCode; details?: string }
type JournalEntry = typeof journalEntries.$inferSelect
type JournalKind = JournalEntry['kind']

/**
 * Fixed prompts (voice.md — Indy register). Stored on the row at save time so an
 * entry keeps the prompt it actually answered if these ever change.
 */
export const MORNING_PROMPT = 'What would deciding look like today? One small thing counts.'
export const EVENING_PROMPT =
  'What did you avoid today? Say it plainly — nobody reads this but you.'

const PROMPTS: Record<JournalKind, string> = {
  morning: MORNING_PROMPT,
  evening: EVENING_PROMPT,
}

/** postgres-js surfaces unique violations as code 23505 (drizzle may wrap it in `cause`). */
function isUniqueViolation(error: unknown): boolean {
  const err = error as { code?: string; cause?: { code?: string } } | null
  return err?.code === '23505' || err?.cause?.code === '23505'
}

async function findExistingEntry(
  userId: string,
  entryDate: string,
  kind: JournalKind,
): Promise<JournalEntry | null> {
  const [entry] = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.entryDate, entryDate),
        eq(journalEntries.kind, kind),
      ),
    )
    .limit(1)
  return entry ?? null
}

export type SaveEntryInput = {
  /** Calendar date string ('YYYY-MM-DD') computed CLIENT-side in the user's zone. */
  entryDate: string
  kind: JournalKind
  content: string
}

type SaveEntryDeps = {
  /** Options injection for TESTS ONLY (race simulation) — production callers never pass it. */
  findExisting?: typeof findExistingEntry
}

/**
 * Same-day re-save UPDATES (editing today's entry is normal journaling — see CLAUDE.md);
 * JOURNAL_DUPLICATE fires only on the race where two concurrent FIRST saves hit the
 * unique index. The decision event records once per (date, kind) — on the insert, in
 * the same transaction; edits never re-record.
 */
export async function saveEntry(
  userId: string,
  input: SaveEntryInput,
  deps: SaveEntryDeps = {},
): Promise<{ entry: JournalEntry; created: boolean } | ServiceError> {
  const findExisting = deps.findExisting ?? findExistingEntry

  const existing = await findExisting(userId, input.entryDate, input.kind)
  if (existing) {
    const [entry] = await db
      .update(journalEntries)
      .set({ content: input.content, updatedAt: new Date() })
      .where(eq(journalEntries.id, existing.id))
      .returning()
    return { entry: entry as JournalEntry, created: false }
  }

  try {
    return await db.transaction(async (tx) => {
      const [entry] = await tx
        .insert(journalEntries)
        .values({
          userId,
          entryDate: input.entryDate,
          kind: input.kind,
          prompt: PROMPTS[input.kind],
          content: input.content,
        })
        .returning()
      // First save of this (date, kind): the decision event commits with the row.
      // entryDate + kind only — NEVER the content (PII rule).
      await record(
        {
          name: 'journal_entry_saved',
          properties: { entryDate: input.entryDate, kind: input.kind },
          userId,
        },
        tx,
      )
      return { entry: entry as JournalEntry, created: true }
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      // Race: a concurrent first-save won between our check and our insert.
      return { error: 'JOURNAL_DUPLICATE' }
    }
    throw error
  }
}

export type EntriesRange = {
  from?: string
  to?: string
  /** Page size for the entries window. Defaults to DEFAULT_ENTRIES_LIMIT, capped at MAX_ENTRIES_LIMIT. */
  limit?: number
}

/**
 * Default entries window. The list is the journaling feed (newest first), not an archive:
 * an unbounded SELECT grows with every entry forever. 90 rows ≈ ~45 days of morning+evening
 * — enough for the live feed; older entries page in via the `to`/`from` range cursor.
 */
export const DEFAULT_ENTRIES_LIMIT = 90
export const MAX_ENTRIES_LIMIT = 365

/**
 * Entries (newest first, windowed, optionally range-scoped) + lifetime cumulative counts
 * ("47 mornings journaled"). The entries list is ALWAYS bounded by `limit` (default
 * DEFAULT_ENTRIES_LIMIT) so a member with years of history never triggers an unbounded
 * read; older entries page in via the from/to range cursor. The counts query stays a
 * lifetime aggregate (correct, cheap — count(*) over the index). NO streak fields anywhere
 * — by design, forever (no-shame rule; tests assert the exact shape).
 */
export async function getEntries(userId: string, range: EntriesRange = {}) {
  const clauses: SQL[] = [eq(journalEntries.userId, userId)]
  if (range.from) clauses.push(gte(journalEntries.entryDate, range.from))
  if (range.to) clauses.push(lte(journalEntries.entryDate, range.to))

  const limit = Math.min(Math.max(range.limit ?? DEFAULT_ENTRIES_LIMIT, 1), MAX_ENTRIES_LIMIT)

  const entries = await db
    .select()
    .from(journalEntries)
    .where(and(...clauses))
    .orderBy(desc(journalEntries.entryDate), desc(journalEntries.kind))
    .limit(limit)

  const [totals] = await db
    .select({
      totalMornings:
        sql<number>`count(*) filter (where ${journalEntries.kind} = 'morning')`.mapWith(Number),
      totalEvenings:
        sql<number>`count(*) filter (where ${journalEntries.kind} = 'evening')`.mapWith(Number),
      totalDaysJournaled: sql<number>`count(distinct ${journalEntries.entryDate})`.mapWith(Number),
    })
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId))

  return {
    entries,
    counts: {
      totalMornings: totals?.totalMornings ?? 0,
      totalEvenings: totals?.totalEvenings ?? 0,
      totalDaysJournaled: totals?.totalDaysJournaled ?? 0,
    },
    prompts: { morning: MORNING_PROMPT, evening: EVENING_PROMPT },
  }
}
