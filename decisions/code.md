# Coding — How We Build Software

> Last verified: 2026-04-09
> Full architecture: decisions/product/00-legacy/001-architecture.md

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
- **Providers:** ONE file per capability, named by what it does (`payments.ts`, `email.ts`, `indexnow.ts`, `search-console.ts`, `profile.ts`, `markdown.ts`) not vendor
- **Middleware:** Hono middleware chain, auth → permissions → handler
- **Env vars:** ALL through `platform/env.ts` via `@t3-oss/env-core` — never `process.env`
- **Route chains:** must be connected for AppRoutes type inference

## Frontend Patterns
- **Preact** for interactive UI (not React — 3KB vs 40KB)
- **Hono SSR** for static/marketing pages (zero client JS)
- **Pages:** max 20 lines — just wiring, all logic in features/
- **Styling:** Tailwind CSS v4 with design tokens from decisions/design.md
- **Islands:** push `'use client'` boundaries as far down as possible

## Frontend Implementation Rules
Read `decisions/design.md` before writing any CSS/TSX. These are the concrete patterns:

### Layout & Spacing
- Use `gap` for sibling spacing — never margin-based spacing between flex/grid children
- Use `repeat(auto-fit, minmax(280px, 1fr))` for self-adjusting card grids (no fixed column counts)
- Use `max-width: 65ch` on prose/reading content (course classes, long text)
- Max widths: 1200px (outer), 800px (content), 640px (reading) — defined in design tokens
- Use `@container` queries for component-level responsiveness, media queries for page-level

### Typography in Code
- Use `clamp()` for hero/display headings: `clamp(2.75rem, 2rem + 3vw, 3.5rem)`
- Use fixed `rem` values for body text and UI — never `px` for font sizes
- `font-variant-numeric: tabular-nums` on any data/numbers column
- `font-variant-ligatures: none` on code blocks
- `font-display: swap` on all `@font-face` declarations
- Minimum body font size: 16px (1rem) — never go below

### Interactive Elements
- Every interactive element needs 8 states accounted for (see design.md Interaction States)
- Touch targets: minimum 44px (use padding if visual size is smaller)
- Use `:focus-visible` for keyboard focus rings — never `outline: none` without replacement
- Use `@media (hover: hover)` to gate hover effects (they don't exist on mobile)
- Use native `<dialog>` for modals with `inert` on background — never roll custom overlay
- Use Popover API for tooltips and dropdowns where supported
- Button labels: specific verb + object ("Save changes" not "Submit")

### Responsive
- Mobile-first: only `min-width` media queries — never `max-width`
- Three breakpoints: `sm(640px)` `md(768px)` `lg(1024px)` — let content dictate, don't add more
- Use `env(safe-area-inset-*)` for content near screen edges
- Use `@media (pointer: fine/coarse)` to adapt touch target sizes

### Animation
- Only animate `transform` and `opacity` — never `width`, `height`, `top`, `left`
- For height transitions: `grid-template-rows: 0fr → 1fr` (zero layout thrash)
- Wrap non-essential animation in `@media (prefers-reduced-motion: no-preference)`
- Easing: `cubic-bezier(0.25, 1, 0.5, 1)` (quart-out) as default. Never bounce/elastic.
- Duration: 100-150ms micro, 200-300ms state change, 300-500ms structural

### Z-Index
- Use semantic scale from design.md: dropdown(100), sticky(200), modal-backdrop(300), modal(400), toast(500), tooltip(600)
- Never use arbitrary z-index values (`z-[9999]` is a code smell)

### Accessibility
- Heading hierarchy: h1→h2→h3, never skip levels
- `<button>` for actions, `<a>` for navigation — never the reverse
- All images need `alt` text (empty `alt=""` for decorative images)
- Color never as sole indicator — pair with icon/text/pattern
- Contrast: 4.5:1 minimum for all text (check `--text-muted` especially)

### Anti-Patterns (AI Slop)
Before shipping, run the slop test: "Would someone recognize this as AI-generated?"
- No glassmorphism or frosted glass
- No gradient text on metrics
- No identical 3-column icon+heading+text grids
- No everything-centered layouts with no visual hierarchy
- No decorative blobs or abstract shapes as filler

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
Multi-course registry: `content/courses.json`. Each course has its own directory.
```
content/
├── courses.json               # Course registry (slug, title, contentDir, status)
├── courses/
│   └── life-decisions/
│       └── en/                # English (source of truth)
│           ├── module-00-onboarding/
│           ├── module-01-.../
│           └── module-09-.../
├── blog/                      # Blog posts
├── concepts/                  # SEO concept pages
├── legal/                     # Legal pages
└── skills/                    # AI skills for Claude Code (future)
```
**Content rendering:** Use `renderCourseMarkdown()` from `providers/markdown.ts` for course content.
Supports `> [!quote]` (pull quotes) and `> [!insight]` (callout boxes). First paragraph gets drop cap.
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

## Error Handling Recipe

```ts
// In platform/errors.ts — define the error
export const errors = {
  COURSE_NOT_FOUND: { status: 404, message: 'Course not found' },
  DECISION_LIMIT:   { status: 429, message: 'Decision limit reached' },
  // ... add new errors here, never ad-hoc
}

// In feature code — throw the error
throwError('COURSE_NOT_FOUND')  // → 404 + structured JSON response

// In API handler — errors auto-map to HTTP status via responses.ts
// The client sees: { error: true, code: 'COURSE_NOT_FOUND', message: 'Course not found' }
```

Rule: every new error path needs a named error code in platform/errors.ts. Catch-all `catch(e)` is forbidden — name the specific error.

## Database Migration Recipe

1. Edit `platform/db/schema.ts` — add/modify table
2. Run `bunx drizzle-kit generate` — creates migration file
3. Review the generated SQL (check for table locks, data loss)
4. Run `bunx drizzle-kit migrate` — applies migration
5. Verify: `bunx drizzle-kit studio` to inspect the result
6. For renames: create new column → copy data → drop old column (never direct rename in prod)
7. For rollback: write a reverse migration manually (drizzle doesn't auto-rollback)

## Performance Budget

| Metric | Target | Enforcement |
|--------|--------|-------------|
| Client JS bundle | <50KB gzipped | Check in CI |
| API p95 latency | <500ms | PostHog monitoring |
| Lighthouse performance | >90 | Monthly check via d-health |
| DB query count per request | <5 (no N+1) | Code review |
| Time to interactive | <2s on 3G | Lighthouse |
