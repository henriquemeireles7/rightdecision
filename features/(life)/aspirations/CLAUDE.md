# aspirations

## Purpose
Pillar 1 of the handbook — the Dream Board. A member's aspirations: what they want across life
areas, each held as three columns — `current` (where they are now), `nextStep` (the one move),
`dream` (the aspiration) — plus an image and a link. Deliberately DATELESS: this surface stays
aspirational; dates belong to the plan (pillar 2).

## Critical Rules
- ALWAYS scope every read/write by `userId` — aspirations are private; never expose another
  user's rows. Update/delete match on (id, userId) so a wrong owner gets ASPIRATION_NOT_FOUND.
- NEVER add date/deadline fields here — aspirations are intentionally dateless (see plan for dates).
- NEVER put aspiration text (title/dream/notes) in event properties — `aspiration_created`
  carries `aspirationId` + `lifeArea` ONLY (PII stays in the table).
- The create write + its `aspiration_created` event are ONE transaction (record(event, tx)).
- `aspiration_created` is NOT a Decision Graph event — do not add it to decisionTaxonomy.

## Imports (use from other modules)
```ts
import { aspirationsRoutes, createAspirationsRoutes } from '@/features/(life)/aspirations/routes'
import {
  listAspirations,
  createAspiration,
  updateAspiration,
  deleteAspiration,
  createAspirationSchema,
} from '@/features/(life)/aspirations/service'
```

## Recipe: New write path
```ts
// Insert + decision-free event in ONE transaction; scope reads/writes by userId.
const aspiration = await db.transaction(async (tx) => {
  const [row] = await tx.insert(aspirations).values({ userId, ...input }).returning()
  await record({ name: 'aspiration_created', properties: { aspirationId: row!.id, lifeArea: row!.lifeArea }, userId }, tx)
  return row!
})
```

## Verify
```sh
source /tmp/test-env.sh && bun test "features/(life)/aspirations"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | createAspirationsRoutes, aspirationsRoutes |
| service.ts | createAspirationSchema, updateAspirationSchema, CreateAspirationInput, UpdateAspirationInput, listAspirations, createAspiration, updateAspiration, deleteAspiration |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/events
- platform/server
- platform/types

<!-- Generated: 2026-06-15T04:05:06.165Z -->
