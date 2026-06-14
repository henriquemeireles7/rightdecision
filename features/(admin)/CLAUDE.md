# (admin)

## Purpose
The admin feature group (Platform V2, Project 2): everything the founder + co-founder use to
author content — course builder, materials, lives, cohorts, programs, analytics. One admin
group, no orphans. Project 7 (distribution) extends this group later — P2 and P7 are
SEQUENTIAL, never parallel.

## Critical Rules
- ALWAYS gate every route on admin role: `.use(requireAuth).use(requirePermission('manage_content'))`
  at the top of the chain (analytics uses `view_analytics`). Admin gating stays ROLE-based —
  never enrollment-based (eng-schema S7).
- EXCEPTION: the Stream webhook route (`course-builder/webhook-routes.ts`) is NOT auth-gated —
  Cloudflare calls it; it is gated by HMAC signature verification instead (eng-schema S4).
- NEVER proxy uploads through Hono — video goes direct via tus (`createTusUploadUrl`),
  files go direct to R2 via presigned PUT (`getUploadUrl`). Routes only hand out URLs.
- ALWAYS keep route modules CHAINED (single `new Hono<AppEnv>().use(...).get(...)` expression)
  for AppRoutes type inference. Export the module; platform/server/routes.ts mounts it.
- ALWAYS Zod-validate input with zValidator ('json'/'query'/'param') — validate `:id` params
  as z.uuid() so bad ids 400 instead of leaking postgres uuid cast errors.
- NEVER return raw c.json() — success()/created()/paginated()/throwError() only.
- Services return `{ error: ErrorCode, details? }` objects (the (business) pattern);
  routes map them via throwError(c, result.error, result.details).
- ALWAYS record() admin events (lesson_published, cover_generated) inside the same
  transaction as the domain write, with the admin's userId.
- Design bar (binding for the later SPA phase): "plain Stripe dashboard" polish, same tokens
  as the rest of the app, desktop-first, 100% interaction-state coverage (loading/empty/
  error/success), ink-on-gold contrast rule. Read decisions/design.md before any UI work.
- Cross-group imports: (admin) → (shared) is allowed (same precedent as (life) → (shared),
  e.g. landing → website/seo; the features-don't-import-features rule is enforced at the
  parenthesized-GROUP level). Cohorts reuse the scheduler's first-Monday date math directly.

## Imports (use from other modules)
```ts
import { adminCourseBuilderRoutes } from '@/features/(admin)/course-builder/routes'
import { streamWebhookRoutes } from '@/features/(admin)/course-builder/webhook-routes'
import { adminMaterialsRoutes } from '@/features/(admin)/materials/routes'
import { adminLivesRoutes } from '@/features/(admin)/lives/routes'
import { adminCohortsRoutes } from '@/features/(admin)/cohorts/routes'
import { adminProgramsRoutes } from '@/features/(admin)/programs/routes'
import { adminAnalyticsRoutes } from '@/features/(admin)/analytics/routes'
```

## Recipe: New admin route module
```ts
export const adminThingRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(requirePermission('manage_content'))
  .post('/', zValidator('json', createSchema), async (c) => {
    const result = await createThing(c.req.valid('json'))
    if ('error' in result) return throwError(c, result.error, result.details)
    return created(c, { thing: result.thing })
  })
```

## Testing
- Service tests: REAL test DB (setupTestDb/teardownTestDb + factories), providers mocked via
  `mock.module('@/providers/x', () => ({ ...actual, fn: mockFn }))` BEFORE importing the service.
- Route tests: `installTestAuth()` from `features/(admin)/test-helpers.ts` (mocks requireAuth
  to read x-test-user-id/x-test-user-role headers; requirePermission stays REAL so admin
  gating is actually exercised). Always test the trio: no auth → 401, non-admin → 403,
  admin → 2xx.

## Verify
```sh
source /tmp/test-env.sh && DATABASE_URL=postgresql://test:test@localhost:5432/test_b1 bun test "features/(admin)"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| test-helpers.ts | installTestAuth, asUser |

## Internal Dependencies
- platform/errors
- platform/types

<!-- Generated: 2026-06-12T23:31:24.935Z -->
