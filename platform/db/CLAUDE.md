# db

## Purpose
Drizzle ORM + PostgreSQL. Single schema file, postgres-js driver, migration system.

## Critical Rules
- ALL tables go in `schema.ts` — NEVER define tables in feature folders
- ALWAYS use `uuid('id').defaultRandom().primaryKey()` for primary keys
- ALWAYS add `createdAt` and `updatedAt` timestamps to new tables
  - EXCEPTION: `events` is append-only and has NO `updatedAt` — never add one, never UPDATE events rows (insert-only spine)
- ALWAYS use `timestamp(..., { withTimezone: true })` (timestamptz) for scheduling timestamps — anything that represents a real-world instant compared across timezones (startsAt, endsAt, scheduledAt, expiresAt, cancelledAt, confirmedAt, occurredAt, completedAt, lastWatchedAt). Legacy pre-V2 columns stay plain `timestamp`; do not retrofit.
- ALWAYS use `.references(() => parentTable.id, { onDelete: 'cascade' })` for foreign keys
- After schema changes: `bun run db:generate` then `bun run db:migrate` — NEVER edit migration files manually
- Use Drizzle query builder — NEVER raw SQL unless performance-critical
- Better Auth tables (users, sessions, accounts, verifications) are managed by Better Auth — do not modify their structure

## Imports (use from other modules)
```ts
import { db } from '@/platform/db/client'
import { users, purchases, courseProgress } from '@/platform/db/schema'
```

## Recipe: New Table
Add to `platform/db/schema.ts`:
```ts
export const myTable = pgTable('my_table', {
  id: uuid('id').defaultRandom().primaryKey(),
  // ... columns ...
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```
Then run: `bun run db:generate && bun run db:migrate`

## Verify
```sh
bunx tsc --noEmit platform/db/schema.ts
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| client.ts | db |
| schema.ts | users, sessions, accounts, verifications, purchases, subscriptions, courseProgress, onboardingSessions, onboardingProfiles, wins, bookmarks, platformAccounts, pipelineRuns, clips, posts, postAnalytics, webhookEvents, userDecisions, readingAnalytics, insights, freeIntroSessions, dripEmails |

## Internal Dependencies
- platform/env

<!-- Generated: 2026-04-09T09:30:25.860Z -->
