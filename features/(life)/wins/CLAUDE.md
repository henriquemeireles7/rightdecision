# wins

## Purpose
Wins Board — social proof feed. Users share wins (280 chars, plain text, 4 life areas). Public anonymous feed + private My Wins. Rate limited 3/day/user.

## Critical Rules
- NEVER render win descriptions as HTML/markdown — PLAIN TEXT only (XSS prevention)
- ALWAYS rate limit: 3 wins per day per user (WIN_RATE_LIMIT_PER_DAY from env)
- ALWAYS validate description length: max 280 characters
- Public feed timestamps rounded to nearest hour (privacy)
- Anonymous feed: never expose user names or IDs
- Seeded wins (is_seed=true) hidden after 20+ real wins exist

## Imports (use from other modules)
```ts
import { db } from '@/platform/db/client'
import { wins } from '@/platform/db/schema'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import { env } from '@/platform/env'
```

## Verify
```sh
bun test features/wins/
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | winsRoutes |
| service.ts | createWin, getPublicFeed, getMyWins |
| wins-board.tsx | WinsBoard |

## Internal Dependencies
- platform/auth
- platform/db
- platform/env
- platform/errors
- platform/server
- platform/types

<!-- Generated: 2026-04-10T08:28:38.403Z -->
