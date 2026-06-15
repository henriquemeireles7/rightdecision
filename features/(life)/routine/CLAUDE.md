# routine

## Purpose
Pillar 3 of the handbook — the intentional routine. A member defines `habits` (across life areas:
health, training, mind, relationships…) each carrying the INTENTION behind it, and logs them per
calendar day in `habit_logs`. This is a habit tracker by way of intention, not streak-guilt.

## Critical Rules
- ALWAYS scope by `userId`. Habits and logs both carry `userId`; writes match on (id, userId) so a
  wrong owner gets HABIT_NOT_FOUND. Logging a habit first verifies the habit is member-owned.
- `logDate` is a CLIENT-computed calendar date ('YYYY-MM-DD' in the user's zone), sent explicitly
  and stored as a DATE — NEVER derive it server-side from UTC now (same rule as journal).
- NO streak fields — by design, forever (streak-guilt is the brand's enemy; same rule as journal).
- One log row per (habit, logDate): first log INSERTs and records `habit_logged`; same-day re-log
  UPDATEs (done/note) and records NOTHING. The unique index (habit_id, log_date) is the backstop.
- NEVER put habit name / note text in event properties — `habit_logged` carries `habitId` +
  `logDate` ONLY (PII stays in the table).

## Imports (use from other modules)
```ts
import { routineRoutes, createRoutineRoutes } from '@/features/(life)/routine/routes'
import { listHabits, createHabit, logHabit, getHabitLogs } from '@/features/(life)/routine/service'
```

## Recipe: Log a habit for a day (idempotent per date)
```ts
// First log of (habit, date) inserts + records habit_logged in one tx; a re-log just updates.
const result = await logHabit(userId, habitId, { logDate: '2026-06-15', done: true })
if ('error' in result) return throwError(c, result.error) // HABIT_NOT_FOUND
// result = { log, created } — created=false means same-day edit, no event
```

## Verify
```sh
source /tmp/test-env.sh && bun test "features/(life)/routine"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | createRoutineRoutes, routineRoutes |
| service.ts | createHabitSchema, updateHabitSchema, logHabitSchema, CreateHabitInput, UpdateHabitInput, LogHabitInput, listHabits, createHabit, updateHabit, deleteHabit, logHabit, getHabitLogs |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/events
- platform/server
- platform/types

<!-- Generated: 2026-06-15T04:05:06.166Z -->
