# onboarding

## Purpose
Anonymous onboarding flow before account creation. Multi-step form captures throughline questions, stores in JSONB sessions, consumes into onboardingProfiles on signup.

## Critical Rules
- NEVER require authentication for onboarding — sessions are anonymous (cookie-based UUID)
- ALWAYS validate step data with Zod before persisting to session_data JSONB
- ALWAYS check session expiry (ONBOARDING_SESSION_TTL_HOURS) before allowing updates
- ALWAYS consume session on account creation — write to onboardingProfiles, delete session
- NEVER allow going back past email step (step 6) — per PRD
- Session cookie must be HttpOnly, Secure, SameSite=Lax

## Imports (use from other modules)
```ts
import { db } from '@/platform/db/client'
import { onboardingSessions, onboardingProfiles } from '@/platform/db/schema'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import { env } from '@/platform/env'
```

## Verify
```sh
bun test features/onboarding/
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| ab-test.ts | ACTIVE_TESTS, assignVariant, assignAllVariants, getVariantContent |
| link-subscription.ts | linkAccountAfterCreation |
| routes.ts | onboardingRoutes |
| session.ts | SessionData, createSession, getSession, updateSession, consumeSession |

## Internal Dependencies
- platform/db
- platform/env
- platform/errors
- platform/server

<!-- Generated: 2026-04-10T08:28:38.403Z -->
