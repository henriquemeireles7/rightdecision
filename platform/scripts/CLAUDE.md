# scripts

## Purpose
CLI utilities run with `bun run`. Migrations, seeds, one-time tasks.

## Critical Rules
- Scripts are standalone — import from `platform/` but NEVER from `features/`
- ALWAYS call `process.exit(0)` on success, `process.exit(1)` on failure
- NEVER commit scripts that modify production data — seeds are dev-only
- `generate-context-files.ts` is the CLAUDE.md footer generator — changes here affect all context files
- Data-changing scripts are NEVER Drizzle migrations — they live here, support `--dry-run`, and are idempotent (run twice = zero new rows)
- ALWAYS export the core logic as a function taking a `Db` instance; the CLI wrapper is a thin `if (import.meta.main)` block — tests call the function against the test DB
- Idempotency mechanisms: enrollments via `onConflictDoNothing` on (userId, programId); events backfill via the partial unique index on sourceRef; seed via delete+recreate scoped to seed slugs/emails

## V2 Data Scripts
- `migrate-subscribers-to-enrollments.ts` — existing-subscriber auto-enrollment at V2 cutover (eng-schema M8). Selects subscriptions in (active, past_due, trialing) within the 30-day grace window; NULL-userId rows are REPORTED, never enrolled. Paid program is looked up (or created as a draft placeholder) by slug `life-decisions-paid`.
- `backfill-decision-events.ts` — userDecisions → events (isDecision, decisionKind='lesson_prompt') and readingAnalytics → events (non-decision). sourceRef=`user_decisions:<id>` / `reading_analytics:<id>`; occurredAt = original createdAt; source='backfill'.
- `seed-v2.ts` — V2 dev seed; produces every UI-relevant state from the foundation roadmap enumeration. Seed users live at `@seed.rightdecision.io`; cleanup is scoped to those emails + seed slugs. This is the `db:seed` entrypoint.

## Recipe: New Script
```ts
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '@/platform/db/schema'

type Db = PostgresJsDatabase<typeof schema>

export async function doTheThing(db: Db, opts: { dryRun?: boolean } = {}) {
  // ... testable script logic, returns a report object ...
}

if (import.meta.main) {
  const { db } = await import('@/platform/db/client')
  doTheThing(db, { dryRun: Bun.argv.includes('--dry-run') })
    .then((report) => {
      console.log(report)
      process.exit(0)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
```
Run with: `bun run platform/scripts/my-script.ts [--dry-run]`

## Verify
```sh
DATABASE_URL=postgresql://test:test@localhost:5432/test bun test platform/scripts/
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| backfill-decision-events.ts | LEGACY_DECISION_EVENT, LEGACY_READING_EVENT, BackfillReport, backfillDecisionEvents, formatBackfillReport |
| build-client.ts | buildClient |
| harden-check.ts | — |
| migrate-subscribers-to-enrollments.ts | PAID_PROGRAM_SLUG, GRACE_PERIOD_DAYS, OrphanedSubscription, MigrationReport, ensurePaidProgram, migrateSubscribersToEnrollments, formatMigrationReport |
| migrate.ts | — |
| seed-accounts.ts | — |
| seed-users.ts | — |
| seed-v2.ts | FREE_PROGRAM_SLUG, SEED_COURSE_SLUG, SEED_TEMPLATE_SLUG, SEED_EMAIL_DOMAIN, DEFAULT_SEED_PASSWORD, SEED_EMAILS, SeedSummary, seedV2 |
| seed-wins.ts | — |
| validate-block-ids.ts | — |

## Internal Dependencies
- platform/auth
- platform/db
- platform/env

<!-- Generated: 2026-06-12T22:38:50.222Z -->
