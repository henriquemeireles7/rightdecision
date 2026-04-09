# free-intro

## Purpose
Free 3-lesson intro funnel. Anonymous sessions, email gate, account merge, decision export.
Converts social media traffic into registered users and paid subscribers.

## Critical Rules
- NEVER expose decision answer text in analytics events (PII)
- ALWAYS validate session data before merge (corrupted JSONB = fresh start, not crash)
- ALWAYS use SELECT FOR UPDATE when merging sessions to prevent race conditions
- Anonymous sessions expire after 7 days — clean up expired sessions periodically
- Email gate must include consent checkbox — required for GDPR/CAN-SPAM
- Rate limit email submissions: 5 per IP per hour

## Imports (use from other modules)
```ts
import { db } from '@/platform/db/client'
import { freeIntroSessions, users } from '@/platform/db/schema'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import { sendEmail } from '@/providers/email'
```

## Verify
```sh
bun test features/\(shared\)/free-intro/
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| export.ts | generateDecisionDocument |
| routes.ts | freeIntroRoutes |
| session.ts | createAnonSession, saveLessonOneAnswer, getSessionData, mergeToAccount |

## Internal Dependencies
- platform/db
- platform/errors
- platform/rate-limit
- platform/server
- providers/analytics

<!-- Generated: 2026-04-09T09:30:25.865Z -->
