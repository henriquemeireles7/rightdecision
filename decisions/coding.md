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

## TDD Methodology
The Build Order enforces TDD: step 5 (write tests) comes BEFORE step 6 (write code).

### The Cycle: Red → Green → Refactor
1. **Red:** Write the test first. It MUST fail. If it passes, the test is wrong.
2. **Green:** Write the minimum code to make the test pass. No more.
3. **Refactor:** Clean up while tests stay green. Extract only if 3rd duplication.

### What to Test
- Test BEHAVIOR, not implementation. "When I call X with Y, I get Z."
- Test the public API of each module, not internal helpers.
- Test error paths: what happens with bad input, missing auth, locked lessons?
- Test edge cases: empty arrays, null values, boundary conditions.

### Test Structure
```ts
import { describe, it, expect } from 'bun:test'

describe('featureName', () => {
  it('should do the expected thing', () => {
    const result = myFunction(input)
    expect(result).toEqual(expected)
  })

  it('should throw on invalid input', () => {
    expect(() => myFunction(badInput)).toThrow()
  })
})
```

### Coverage Verification
Run `bun test --coverage` to verify 100% coverage. No exceptions.

## Hono Core Patterns
- Use `Hono` factory with typed environment (`AppEnv`)
- Chain routes with `.route()` for full type inference
- Use `c.var` for typed middleware context (auth user, permissions)
- Return `c.html()` for SSR pages, `success()`/`paginated()` for API
- Middleware chain: auth → permissions → handler (clean separation)
- Use `hono/client` RPC for type-safe frontend API calls

## Railway Deployment Patterns
- Single Dockerfile with Bun image — lightweight, fast builds
- PostgreSQL on same Railway project — zero network hop
- Environment variables through Railway dashboard → `platform/env.ts`
- Health check endpoint for Railway's built-in monitoring
- Database migrations run on deploy (not manually)

## Claude Code / Conductor Patterns
- Every folder with code has a CLAUDE.md (auto-loaded per directory)
- Nested CLAUDE.md has human-authored header + auto-generated footer
- Skills are one file each, self-contained, with clear triggers
- Use Conductor workspaces for parallel agent work on different tasks
- Hooks batch quality checks at Stop, not per-edit

## Dependency Rules
```
decisions/    →(informs humans, never imported)→  everything
CLAUDE.md     →(AI reads before coding)→          the code in their folder
content/      →(loaded at startup)→               providers/content.ts
providers/    →(imported by)→                      features/, platform/
platform/     →(imported by)→                      features/, pages/
features/     →(imported by)→                      pages/
pages/        →(renders)→                          the user
```
- `features/` NEVER imports from other `features/` (vertical slices are independent)
- `providers/` NEVER imports from `features/` (providers are dumb wrappers)
- `platform/` NEVER imports from `features/` (platform is generic foundation)
- `pages/` is ALWAYS thin — max 20 lines, just wiring imports
- `decisions/` is NEVER referenced in code — strategy layer only

## Security Patterns
- ALL input validated via Zod before processing (`@hono/zod-validator`)
- NEVER access `process.env` directly → use `platform/env.ts`
- NEVER return stack traces in production
- NEVER log sensitive data (passwords, tokens, card numbers)
- Wins Board descriptions stored as PLAIN TEXT — no markdown parsing (XSS prevention)
- Rate limit all public endpoints (auth: 10 req/min, reads: 100 req/min, wins: 3/day/user)
- Better Auth handles CSRF, session cookies, token rotation
- Stripe Checkout (hosted) — we never handle card data
- Cookie consent for analytics (PostHog)

## Performance Patterns
- No N+1 queries — use Drizzle relational queries for joins
- Course content loaded once at server startup into in-memory Map (< 100 classes)
- API responses: < 200ms for writes, < 500ms for search
- Page load (FCP): < 1.5s — SSR + Preact 3KB
- Cache invalidation: on deploy (server restart) — no runtime cache invalidation in V1

## Content Layer
Course content lives as markdown files in `content/`, not in the database.
```
content/
├── course/
│   └── en/                    # English (source of truth)
│       ├── module-00-onboarding/
│       ├── module-01-.../
│       └── module-09-.../
└── skills/                    # AI skills for Claude Cowork (future)
```
**Frontmatter schema (course .mdx files):**
```yaml
---
title: "Human-readable title"
slug: "url-slug"
type: "course"
status: "draft|review|published"
module: 1
lesson: 1
duration_minutes: 30
locale: "en"
video_url: "https://..."        # theory classes only
order: 1                        # display order within module
class_type: "theory|practical"  # practical = AI skill exercise
skill: "state-map"              # practical classes only
time_nudge: "Take 3-4 days..."  # last class per module only
---
```
**i18n:** `en/` is source of truth. Future: `pt-BR/` mirrors `en/` exactly. Fallback to `en/` if translation missing.
**Loading:** `providers/content.ts` loads all markdown at server startup into a typed `Map<string, CourseClass>`.

## Provider Rules
- ONE file per capability: `payments.ts`, `email.ts`, `content.ts`
- Name by capability, not vendor. Switch vendors by changing one file.
- Providers are thin and stateless — SDK wrapper + constants + typed helpers
- Providers NEVER import from `features/` — they are consumed BY features
- If it doesn't fit in one file, it's not a provider

## Folder CLAUDE.md Rule
- ALWAYS read the CLAUDE.md of any folder before creating/modifying files in it
- If creating a new folder, create its CLAUDE.md FIRST (see template in root CLAUDE.md)
- CLAUDE.md has: Purpose, Critical Rules, Imports, Recipe, Verify command
- Footer (Files, Dependencies) is auto-generated by Stop hook

## Key Utilities
| File | What |
|------|------|
| `platform/env.ts` | All environment variables |
| `platform/errors.ts` | Error codes + `throwError()` |
| `platform/server/responses.ts` | `success()`, `paginated()`, `created()`, `noContent()` |
| `platform/types.ts` | `AppUser`, `AppEnv` |
| `platform/db/schema.ts` | All database tables |
| `platform/server/routes.ts` | All API endpoints |
| `platform/auth/permissions.ts` | Roles + permissions |
