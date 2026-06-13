# drip-email

## Purpose
Scheduled email sequences on the dripEmails table, sent by the scheduler's
processPendingDrips job. Two sequences share the table: the legacy free-intro drips
(emailIndex 0-2) and the V2 cohort-lifecycle drips (emailIndex 100-102, P4) — welcome,
starts-soon (T-1 day), upgrade nudge.

## Critical Rules
- NEVER change free-intro drip behavior (indexes 0-2) when touching cohort drips — the
  evergreen funnel must keep working until cutover.
- Index namespaces are FIXED: 0-99 free-intro, 100+ cohort lifecycle (COHORT_DRIP_INDEXES).
  The (userId, emailIndex) unique index is the dedup key — never reuse an index for a
  different email.
- Cohort drips REUSE the notNull decisionText column to carry the cohort-start instant
  (ISO string) — it is NOT a decision there. Parse with new Date(); corrupt values are
  marked 'skipped', never retried forever.
- ALWAYS schedule with upsert-on-(userId, emailIndex) where status='pending' — re-joining
  a later cohort reschedules pending sends to the new dates and NEVER resends sent rows.
- NEVER schedule a send whose time is already past (e.g. starts-soon when joining a
  running cohort) — skip it at scheduling time.
- The paid-user check-before-send applies to ALL free-intro drips but ONLY the upgrade
  nudge among cohort drips (a welcome to a paid user is fine; an upgrade pitch is not).
- Sending is the scheduler job's business: processPendingDrips flips status
  pending → sent/skipped; failures stay pending and retry until the 48h give-up window.
- Cohort drips are scheduled ONLY from the join flow (features/(life)/join) — that is the
  cutover gate; never schedule them from signup or free-intro paths.

## Imports (use from other modules)
```ts
import { processPendingDrips, scheduleDripSequence } from '@/features/(shared)/drip-email/scheduler'
import {
  scheduleCohortDripSequence,
  COHORT_DRIP_INDEXES,
  DEFAULT_COHORT_DRIP_OFFSETS,
} from '@/features/(shared)/drip-email/cohort-drips'
```

## Recipe: New cohort lifecycle email
```ts
// 1. Add the template to features/(shared)/email/cohort-emails.ts (voice.md first!)
// 2. Reserve the next index in COHORT_DRIP_INDEXES (never reuse/renumber)
// 3. Add the row to scheduleCohortDripSequence with its offset rule (skip past sends)
// 4. Map index → template in renderCohortDrip (scheduler.ts)
// 5. Tests: offset math, dedup/reschedule, send path, paid-skip semantics
```

## Verify
```sh
DATABASE_URL=postgresql://test:test@localhost:5432/test_b3 bun test "features/(shared)/drip-email"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| cohort-drips.ts | COHORT_DRIP_INDEXES, COHORT_DRIP_BASE_INDEX, CohortDripOffsets, DEFAULT_COHORT_DRIP_OFFSETS, scheduleCohortDripSequence |
| scheduler.ts | scheduleDripSequence, processPendingDrips |

## Internal Dependencies
- features/(shared)
- platform/db
- platform/env
- providers/email

<!-- Generated: 2026-06-12T23:31:24.931Z -->
