# scripts

## Purpose
CLI utilities run with `bun run`. Migrations, seeds, one-time tasks.

## Critical Rules
- Scripts are standalone — import from `platform/` but NEVER from `features/`
- ALWAYS call `process.exit(0)` on success, `process.exit(1)` on failure
- NEVER commit scripts that modify production data — seeds are dev-only
- `generate-context-files.ts` is the CLAUDE.md footer generator — changes here affect all context files

## Recipe: New Script
```ts
import { db } from '@/platform/db/client'

async function main() {
  // ... script logic ...
  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```
Run with: `bun run platform/scripts/my-script.ts`

## Verify
```sh
bunx tsc --noEmit platform/scripts/*.ts
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| generate-context-files.ts | — |
| harden-check.ts | — |
| migrate.ts | — |
| seed-accounts.ts | — |
| seed-users.ts | — |
| seed-wins.ts | — |
| validate-block-ids.ts | — |

## Internal Dependencies
- platform/auth
- platform/db

<!-- Generated: 2026-04-09T09:30:25.867Z -->
