# journal

## Purpose
Morning/evening journaling API (P5): fixed prompts, one entry per (user, calendar day, kind),
cumulative counts. Entries feed the per-user context store (P6 AI layer) and count toward
"Decisions Made" (decisionKind='journal').

## Critical Rules
- entryDate is a CLIENT-computed calendar date string ('YYYY-MM-DD' in the user's zone),
  sent explicitly and stored as a DATE — NEVER derive it server-side from UTC now, never
  do timezone math on it (eng-schema table 14).
- NO streak fields ANYWHERE in API responses — counts only (totalMornings, totalEvenings,
  totalDaysJournaled). Streak-guilt is hustle-culture, the brand's enemy. Tests assert the
  exact shape; adding a streak key is a test failure by design.
- record('journal_entry_saved', tx) fires on FIRST save of a (date, kind) only — edits
  never re-record (one decision per journal entry, not per keystroke).
- Prompts are fixed consts (MORNING_PROMPT/EVENING_PROMPT), voice.md-compliant, stored on
  the row at save time so old entries keep the prompt they answered.

## Decision: same-day re-save UPDATES (JOURNAL_DUPLICATE = race only)
The roadmap says "duplicate (user, date, kind) → JOURNAL_DUPLICATE 409" and the unique index
exists. Read literally that would 409 a user editing today's entry — but editing today's
entry is normal journaling behavior, and a 409 there is shame UX (the same instinct the
no-streak rule bans). Interpretation implemented here: saveEntry is check-then-write —
an existing (user, entryDate, kind) row is UPDATED (no new event); JOURNAL_DUPLICATE is
reserved for the race window where two concurrent first-saves hit the unique index — the
loser gets 409 and the client simply refetches/retries. The unique index stays the
integrity backstop the roadmap requires. (Same open-questions register as the roadmap:
flagged for founder review, default chosen = kinder UX.)

## Imports (use from other modules)
```ts
import { saveEntry, getEntries, MORNING_PROMPT, EVENING_PROMPT } from '@/features/(life)/journal/service'
import { journalRoutes } from '@/features/(life)/journal/routes'
```

## Recipe: Save an entry
```ts
const result = await saveEntry(userId, { entryDate: '2026-06-13', kind: 'morning', content })
if ('error' in result) return throwError(c, result.error) // JOURNAL_DUPLICATE (race only)
// result = { entry, created: boolean } — created=false means same-day edit, no event
```

## Verify
```sh
source /tmp/test-env.sh && DATABASE_URL=postgresql://test:test@localhost:5432/test_b4 bun test "features/(life)/journal"
```

---
## Files
| File | Exports |
|------|---------|
| routes.ts | createJournalRoutes, journalRoutes |
| service.ts | MORNING_PROMPT, EVENING_PROMPT, SaveEntryInput, saveEntry, EntriesRange, getEntries |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/events
- platform/server
- platform/types

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | createJournalRoutes, journalRoutes |
| service.ts | MORNING_PROMPT, EVENING_PROMPT, SaveEntryInput, saveEntry, EntriesRange, getEntries |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/events
- platform/server
- platform/types

<!-- Generated: 2026-06-13T01:29:20.705Z -->
