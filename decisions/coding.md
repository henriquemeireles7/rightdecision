# Coding — How We Build Software

> Last verified: 2026-04-06
> Full architecture: decisions/001-architecture.md

## Data Flow
```
Drizzle table → drizzle-zod → Zod schema → @hono/zod-validator → hono/client RPC → Preact component
```
Types flow from ONE source. Never define types manually — infer from Zod/Drizzle.

## API Contracts
- Routes: Hono chains with `.route()` for type inference (AppRoutes)
- Validation: `@hono/zod-validator` on every endpoint
- Responses: always `success()` or `paginated()` from `platform/server/responses.ts`
- Errors: always `throwError()` from `platform/errors.ts` — never ad-hoc errors
- Auth: `requireAuth` middleware from `platform/auth/middleware.ts`
- Permissions: `requirePermission()` from `platform/auth/permissions.ts`

## Backend Patterns
- **Providers:** ONE file per capability, named by what it does (`payments.ts`, `email.ts`) not vendor
- **Middleware:** Hono middleware chain, auth → permissions → handler
- **Env vars:** ALL through `platform/env.ts` via `@t3-oss/env-core` — never `process.env`
- **Route chains:** must be connected for AppRoutes type inference

## Frontend Patterns
- **Preact** for interactive UI (not React — 3KB vs 40KB)
- **Hono SSR** for static/marketing pages (zero client JS)
- **Pages:** max 20 lines — just wiring, all logic in features/
- **Styling:** Tailwind CSS v4 with design tokens from decisions/design.md
- **Islands:** push `'use client'` boundaries as far down as possible

## Database Patterns
- **Schema:** `platform/db/schema.ts` — single source of truth
- **Migrations:** `bun run db:generate` → `bun run db:migrate`
- **Seeds:** `bun run db:seed` for dev data
- **ORM:** Drizzle — SQL-like, code-first, generates Zod schemas

## Testing Patterns
- 100% coverage, no exceptions
- Colocated: `foo.ts` → `foo.test.ts` same folder
- Runner: `bun:test` (built-in, Jest-compatible API)
- Tests MUST fail first (TDD)
- No abstraction until 3rd duplication (applies to test helpers too)

## Key Utilities
| File | What |
|------|------|
| `platform/env.ts` | All environment variables |
| `platform/errors.ts` | Error codes + `throwError()` |
| `platform/server/responses.ts` | `success()`, `paginated()` |
| `platform/types.ts` | `AppUser`, `AppEnv` |
