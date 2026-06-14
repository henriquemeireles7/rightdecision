# server

## Purpose
Hono HTTP server. Route mounting, response helpers, global middleware. AppRoutes type inference flows from here to frontend.

## Critical Rules
- ALWAYS chain routes with `.route()` in `mountRoutes()` — breaking the chain breaks AppRoutes type inference for the entire frontend
- NEVER use raw `c.json()` in route handlers — use `success()`, `paginated()`, `created()`, or `noContent()`. Exception: `/health` and `/health/ready` use raw `c.json()` because health checks are infrastructure, not API responses
- NEVER add business logic here — this is wiring only. Logic goes in `features/`
- Response helpers enforce `{ ok: true, data }` shape — NEVER deviate from this contract
- Global middleware order in `app.ts`: health checks → logger → cors → routes → error handler. Do not reorder.
- Health checks are registered BEFORE middleware so they always respond, even if middleware breaks
- `/health` — liveness, returns `{ status: "ok" }`, Railway hits this during deploys
- `/health/ready` — readiness, checks DB + Stripe + Resend + R2, returns service-level status with latency

## Imports (use from other modules)
```ts
import { success, paginated, created, noContent } from '@/platform/server/responses'
```

## Recipe: Wire New Feature
In `routes.ts` inside `mountRoutes()`:
```ts
.route('/api/my-feature', myRoutes)
```
The route MUST be chained (not standalone) to preserve AppRoutes type inference.

## Verify
```sh
bunx tsc --noEmit platform/server/app.ts && bun test platform/server/
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| app.ts | AppRoutes, default |
| health.ts | checkHealth |
| render.tsx | renderPage |
| responses.ts | success, paginated, created, accepted, partial |
| routes.ts | mountRoutes |

## Internal Dependencies
- features/(admin)
- features/(business)
- features/(life)
- features/(shared)
- platform/auth
- platform/db
- platform/env
- providers/analytics
- providers/email
- providers/payments

<!-- Generated: 2026-06-13T02:53:44.061Z -->
