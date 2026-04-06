# Right Decision — Architecture & Methodology

> **Status:** DRAFT
> **Date:** 2026-04-03
> **Author:** Henry (Visionary) + Claude (Integrator)
>
> **[DECISION NEEDED]** flags mark open questions requiring visionary input.
> **[ASSUMPTION]** flags mark things assumed but not confirmed.

---

## 1. Executive Summary

Right Decision is an infobusiness + software company built on a custom architecture called **Domain-Spec Architecture (DSA)** — designed from first principles for a solo developer working with AI coding agents.

Every folder that contains code has a `SPEC.md` file. The spec defines intent, rules, and acceptance criteria. AI agents read the spec before touching any code. The build methodology is **Spec-Driven TDD**: write the spec, write the schema, write failing tests, make them pass, refactor, wire into pages.

The tech stack is unified TypeScript end-to-end: **Bun** runtime, **Hono** backend + SSR, **Preact** for interactive UI, **Drizzle** ORM generating **Zod** schemas that flow through **hono/client** RPC to the frontend — giving zero-cost type inference from database to UI with no manual type definitions.

---

## 2. Philosophy

### 2.1 Why This Architecture Exists

Traditional software architectures (MVC, Clean Architecture, Hexagonal, Feature-Sliced Design) optimize for **team coordination** — layers of abstraction exist so Developer A doesn't break Developer B's code.

This architecture optimizes for **context transfer between AI sessions**. Every time a new Claude Code instance starts, it knows nothing. The architecture's job is to make context transfer instant and complete for any domain of work.

### 2.2 Core Principles

1. **The folder tree IS the architecture diagram.** If `tree -L 3` doesn't explain the system, the structure has failed.

2. **Every folder with code has a SPEC.md.** The spec defines intent. The code implements intent. AI reads the spec before touching the code.

3. **Types flow from one source.** Drizzle table → Zod schema → Hono validator → hono/client type. Never define types manually.

4. **No abstraction without pain.** Don't create a service layer until you've copy-pasted the same logic three times. Don't create a `useApi` hook until you've written `fetch()` three times.

5. **Seven centralized files govern the system.** Errors, env, routes, responses, schema, permissions, events. Know these seven files, know the system.

6. **Providers are capabilities, not vendors.** Name by what it does (`payments.ts`), not who provides it (`stripe.ts`). Switch vendors by changing one file.

7. **Pages are wiring, not logic.** Every page file is under 20 lines. It imports from features and renders. All intelligence lives in the domain folders.

8. **Decisions before code.** No feature exists without a decision document in `decisions/`. No code exists without a SPEC.md in the folder. [ASSUMPTION: decisions/ will be actively maintained]

---

## 3. Tech Stack

### 3.1 Stack Table

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | **Bun** | 3-4x faster than Node.js, native TypeScript, built-in test runner, built-in bundler |
| Backend framework | **Hono** | Ultralight (14KB), web-standard, multi-runtime, TypeScript-first, RPC type bridge |
| Frontend (interactive) | **Preact** | React API at 3KB, full ecosystem compat via `preact/compat`, shadcn/ui works |
| Frontend (static) | **Hono SSR** | Zero client JS for marketing pages, same framework as backend |
| Type bridge | **hono/client** | Zero-cost type inference from backend routes to frontend calls |
| Styling | **Tailwind CSS v4** | Utility-first, design tokens via CSS custom properties |
| Validation | **Zod** | Runtime validation + TypeScript inference, generated from Drizzle |
| ORM | **Drizzle** | 7.4KB, code-first schema, SQL-like, edge-native, generates Zod via `drizzle-zod` |
| Database | **PostgreSQL** | On Railway, same provider as hosting, zero network hop |
| Auth | **Better Auth** | Self-hosted, TypeScript-first, Hono-native, plugin architecture (2FA, orgs, passkeys) |
| Payments | **Stripe** | Via `providers/payments.ts` |
| Email | **Resend** + React Email | Via `providers/email.ts` |
| Analytics | **PostHog** | Via `providers/analytics.ts` |
| Content | **MDX** files in repo | Git-versioned, custom loader, build-time import |
| Monorepo | **Turborepo** + Bun workspaces | Incremental builds, task pipelines |
| Testing | **bun:test** | Built-in, fast, Jest-compatible API, 100% coverage target |
| Linting + Formatting | **Biome** | Single tool replacing ESLint + Prettier, 25x faster, one config file |
| Env validation | **@t3-oss/env-core** + Zod | Build-time crash if env vars missing or invalid |
| CI | **GitHub Actions** | `biome ci` → `tsc --noEmit` → `bun test` → `bun run build` |
| Hosting | **Railway** | App + PostgreSQL, Dockerfile deploy, no vendor lock-in |
| Container | **Dockerfile** (Bun image) | Single lightweight production image |

### 3.2 Why Not Next.js

Next.js optimizes for Vercel's platform and large team coordination. For solo + AI:

- Server Components vs Client Components boundary adds cognitive overhead with no team-coordination payoff
- Bun + Next.js has severe compatibility issues (19-23x slower in benchmarks)
- Hono's route handlers are plain functions — AI agents understand them instantly
- hono/client RPC gives the same end-to-end type safety without framework magic
- No Vercel vendor lock-in

### 3.3 Why Not React

React is 47.8KB. Preact is 3KB with the same API. For an infobusiness dashboard:

- Preact's `preact/compat` layer makes shadcn/ui, Radix, React Email all work unchanged
- No Concurrent Mode complexity, no `use()` hooks to debug
- Hono's built-in JSX (2.8KB) handles SSR for marketing pages — zero client JS

### 3.4 The Type Chain

This is the architectural superpower. Types are defined ONCE and flow everywhere:

```
platform/db/schema.ts           Drizzle table definitions (source of truth)
        ↓ generates via drizzle-zod
features/*/schema.ts            Zod schemas (runtime validation + TS types)
        ↓ used by
features/*/actions/*.ts         Hono route handlers with zValidator
        ↓ chained in
platform/server/app.ts          Exports AppRoutes type
        ↓ imported by
client hc<AppRoutes>            Fully typed frontend API client
        ↓ used by
features/*/components/*.tsx     Call API like a local function
```

Calling the API feels like calling a local function. No manual interfaces. No type duplication. No `any`. If the backend changes, the frontend gets a type error at compile time.

**Critical pattern** (from Hono documentation): Routes MUST be chained for type inference to work.

```typescript
// ✅ Correct — fully chained, types flow
const appRoutes = app
  .route('/auth', authRoutes)
  .route('/subscriptions', subscriptionRoutes)
  .route('/courses', courseRoutes)

export type AppRoutes = typeof appRoutes

// ❌ Wrong — separate calls, types break
app.route('/auth', authRoutes)
app.route('/subscriptions', subscriptionRoutes)
```

---

## 4. Folder Structure

```
rightdecision/
├── AGENTS.md                          # 30-sec onboard + routing rules
├── turbo.json                         # Turborepo pipeline config
├── package.json                       # Bun workspaces
├── biome.json                         # Linting + formatting (replaces ESLint + Prettier)
├── Dockerfile                         # Bun production image
├── .env.example                       # Template — committed, no secrets
│
├── .github/
│   └── workflows/
│       └── ci.yml                     # biome ci → tsc → bun test → build
│
├── ui/                                # DESIGN SYSTEM
│   ├── SPEC.md                        # Design philosophy, spacing, color, rules
│   ├── tokens.ts                      # CSS custom properties + TS constants
│   ├── tailwind.preset.ts             # Tailwind config consuming tokens
│   ├── cn.ts                          # className utility (clsx + tailwind-merge)
│   └── primitives/                    # Button, Input, Card, Badge, Dialog, Skeleton...
│       ├── button.tsx
│       ├── button.test.tsx
│       ├── skeleton.tsx               # Base skeleton loading component
│       ├── skeleton-card.tsx          # Card-shaped loading state
│       └── ...
│
├── features/                          # USER JOBS-TO-BE-DONE — full vertical slices
│   ├── subscription/                  # "Subscribe to a plan"
│   │   ├── SPEC.md                    # Job, user flow, acceptance criteria, AI rules
│   │   ├── schema.ts                  # Zod schemas (THE contract)
│   │   ├── create-checkout.ts         # Action: create Stripe checkout session
│   │   ├── create-checkout.test.ts    # TDD: tests from SPEC acceptance criteria
│   │   ├── handle-webhook.ts          # Action: process Stripe webhook
│   │   ├── handle-webhook.test.ts
│   │   └── components/
│   │       ├── pricing-table.tsx
│   │       ├── pricing-table.test.tsx
│   │       ├── pricing-table-skeleton.tsx
│   │       └── billing-portal.tsx
│   │
│   ├── course-player/                 # "Take a lesson"
│   │   ├── SPEC.md
│   │   ├── schema.ts
│   │   ├── get-lesson.ts
│   │   ├── get-lesson.test.ts
│   │   └── components/
│   │       ├── lesson-viewer.tsx
│   │       ├── lesson-viewer-skeleton.tsx
│   │       └── lesson-nav.tsx
│   │
│   ├── course-progress/               # "Track my learning"
│   │   ├── SPEC.md
│   │   ├── schema.ts
│   │   ├── update-progress.ts
│   │   ├── update-progress.test.ts
│   │   └── components/
│   │       ├── progress-dashboard.tsx
│   │       └── progress-bar.tsx
│   │
│   ├── user-settings/                 # "Manage my account"
│   │   ├── SPEC.md
│   │   ├── schema.ts
│   │   ├── update-profile.ts
│   │   ├── update-profile.test.ts
│   │   └── components/
│   │       └── settings-form.tsx
│   │
│   └── onboarding/                    # "Get started"
│       ├── SPEC.md
│       ├── schema.ts
│       ├── complete-onboarding.ts
│       ├── complete-onboarding.test.ts
│       └── components/
│           └── onboarding-wizard.tsx
│
├── marketing/                         # PRE-AUTH CONVERSION
│   ├── SPEC.md                        # Funnel strategy, CTA rules, conversion goals
│   ├── landing/
│   │   └── components/                # Hero, features section, testimonials
│   ├── pricing/
│   │   └── components/                # Pricing comparison (imports features/subscription/ data)
│   ├── blog/
│   │   └── components/                # Blog list, blog post renderer
│   ├── help/
│   │   └── components/                # Help center article renderer
│   └── shared/
│       └── components/                # Header, footer, CTA section
│
├── providers/                         # EXTERNAL CAPABILITIES — one file per capability
│   ├── SPEC.md                        # Rules: providers are thin, stateless, one-file-each
│   ├── payments.ts                    # Stripe client + plan constants
│   ├── email.ts                       # Resend client + send function
│   └── analytics.ts                   # PostHog client + typed event definitions
│
├── platform/                          # THE FOUNDATION
│   ├── server/
│   │   ├── SPEC.md                    # Server architecture, middleware stack, error + response contract
│   │   ├── app.ts                     # Hono app — chains all routes, exports AppRoutes
│   │   ├── routes.ts                  # Single file mounting all feature + platform routes
│   │   ├── error.ts                   # Global error handler
│   │   └── responses.ts              # success(), paginated() — standard response shapes
│   │
│   ├── auth/
│   │   ├── SPEC.md                    # Auth decisions: Better Auth config, roles, session rules
│   │   ├── config.ts                  # Better Auth setup
│   │   ├── middleware.ts              # requireAuth() Hono middleware
│   │   ├── permissions.ts             # Role + permission matrix
│   │   └── routes.ts                  # Auth API routes
│   │
│   ├── db/
│   │   ├── SPEC.md                    # DB philosophy: naming, migrations, query patterns
│   │   ├── client.ts                  # Drizzle client
│   │   ├── schema.ts                  # ALL table definitions — single source of truth
│   │   └── migrations/
│   │
│   ├── middleware/
│   │   ├── rate-limit.ts
│   │   ├── cors.ts
│   │   └── logger.ts
│   │
│   ├── env.ts                         # Zod-validated env vars (t3-env). Crashes build if invalid.
│   ├── errors.ts                      # ALL error codes + throwError() helper
│   │
│   └── scripts/
│       ├── seed.ts                    # Database seed
│       └── migrate.ts                 # Migration runner
│
├── pages/                             # THIN ROUTING — no SPEC.md, max 20 lines per file
│   ├── (marketing)/                   # Public routes → Hono SSR (zero client JS)
│   │   ├── index.tsx                  # Landing page
│   │   ├── pricing.tsx                # Pricing page
│   │   ├── blog/[slug].tsx            # Blog post
│   │   └── help/[slug].tsx            # Help article
│   ├── (app)/                         # Auth'd routes → Preact (interactive)
│   │   ├── dashboard.tsx              # Course progress dashboard
│   │   ├── courses/[id].tsx           # Lesson viewer
│   │   └── settings.tsx               # User settings
│   └── (auth)/                        # Auth flows
│       ├── login.tsx
│       └── register.tsx
│
├── content/                           # MDX FILES — git-versioned, build-time imported
│   ├── course/
│   │   ├── en/
│   │   │   ├── module-01/
│   │   │   │   ├── 01-lesson.mdx
│   │   │   │   └── 02-lesson.mdx
│   │   │   └── module-02/
│   │   └── pt-BR/
│   │       └── module-01/
│   ├── blog/
│   │   ├── en/
│   │   └── pt-BR/
│   ├── marketing/
│   │   ├── en/
│   │   └── pt-BR/
│   └── help/
│       ├── en/
│       └── pt-BR/
│
└── decisions/                         # THE VISIONARY'S BRAIN — never linked in code
    └── visionary/
        ├── _template/
        │   ├── meta-template.md
        │   ├── draft-template.md
        │   └── final-template.md
        ├── 01-business-model/
        ├── 02-manifesto/
        ├── 03-methodology/
        └── ...
```

### 4.1 Dependency Direction

```
decisions/    ─(informs humans, never imported)─→  everything

SPEC.md files ─(AI reads before coding)─→  the code in their folder

content/      ─(imported at build time)─→  features/, marketing/

ui/           ─(imported by)─→  features/, marketing/

providers/    ─(imported by)─→  features/, platform/

platform/     ─(imported by)─→  features/, pages/

features/     ─(imported by)─→  pages/

marketing/    ─(imported by)─→  pages/

pages/        ─(renders)─→  the user
```

### 4.2 Dependency Rules

- `features/` NEVER imports from `marketing/` (and vice versa)
- `providers/` NEVER imports from `features/` (providers are dumb wrappers)
- `platform/` NEVER imports from `features/` (platform is generic foundation)
- `pages/` is ALWAYS thin — max 20 lines, just wiring imports
- `decisions/` is NEVER referenced in code — strategy layer per VIA
- `content/` has no SPEC.md — its rules come from `marketing/SPEC.md` and feature SPECs

---

## 5. The Seven Centralized Files

These seven files govern the entire system. An AI agent that reads them knows all contracts.

### 5.1 `platform/env.ts` — Environment Variables

Every external secret and config value, Zod-validated at build time.

```typescript
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV:              z.enum(['development', 'test', 'production']),
    DATABASE_URL:          z.string().url(),
    STRIPE_SECRET_KEY:     z.string().startsWith('sk_'),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
    RESEND_API_KEY:        z.string().min(1),
    BETTER_AUTH_SECRET:    z.string().min(32),
    POSTHOG_API_KEY:       z.string().min(1),
  },
  clientPrefix: 'PUBLIC_',
  client: {
    PUBLIC_APP_URL:        z.string().url(),
    PUBLIC_STRIPE_KEY:     z.string().startsWith('pk_'),
    PUBLIC_POSTHOG_HOST:   z.string().url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
```

**Rule:** NEVER access `process.env` directly. ALWAYS import from `platform/env.ts`.

### 5.2 `platform/errors.ts` — Error Codes

Every error the system can return, defined once.

```typescript
export const errors = {
  // Auth
  UNAUTHORIZED:       { code: 'UNAUTHORIZED',       status: 401, message: 'Authentication required' },
  FORBIDDEN:          { code: 'FORBIDDEN',           status: 403, message: 'Insufficient permissions' },
  SESSION_EXPIRED:    { code: 'SESSION_EXPIRED',     status: 401, message: 'Session expired' },

  // Payments
  PAYMENT_FAILED:     { code: 'PAYMENT_FAILED',      status: 402, message: 'Payment could not be processed' },
  NO_SUBSCRIPTION:    { code: 'NO_SUBSCRIPTION',     status: 403, message: 'Active subscription required' },
  PLAN_NOT_FOUND:     { code: 'PLAN_NOT_FOUND',      status: 404, message: 'Subscription plan not found' },

  // Content
  NOT_FOUND:          { code: 'NOT_FOUND',           status: 404, message: 'Resource not found' },
  CONTENT_UNAVAILABLE:{ code: 'CONTENT_UNAVAILABLE', status: 404, message: 'Content not available in requested locale' },
  LESSON_LOCKED:      { code: 'LESSON_LOCKED',       status: 403, message: 'Complete previous lessons first' },

  // Validation
  VALIDATION_ERROR:   { code: 'VALIDATION_ERROR',    status: 400, message: 'Invalid input' },

  // System
  INTERNAL_ERROR:     { code: 'INTERNAL_ERROR',      status: 500, message: 'Something went wrong' },
  RATE_LIMITED:       { code: 'RATE_LIMITED',         status: 429, message: 'Too many requests, try again later' },
} as const satisfies Record<string, { code: string; status: number; message: string }>

export type ErrorCode = keyof typeof errors

export function throwError(c: Context, errorCode: ErrorCode, details?: string) {
  const { status, ...body } = errors[errorCode]
  return c.json({ ok: false, ...body, ...(details ? { details } : {}) }, status)
}
```

**Rule:** NEVER return ad-hoc error objects. ALWAYS use `throwError()`.

### 5.3 `platform/db/schema.ts` — Database Schema

Every database table defined in a single file. Source of truth for all types.

```typescript
import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core'

// ─── Users ───
export const users = pgTable('users', {
  id:        uuid('id').defaultRandom().primaryKey(),
  email:     text('email').notNull().unique(),
  name:      text('name').notNull(),
  role:      text('role', { enum: ['free', 'pro', 'admin'] }).notNull().default('free'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

// ─── Subscriptions ───
export const subscriptions = pgTable('subscriptions', {
  id:               uuid('id').defaultRandom().primaryKey(),
  userId:           uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripeSubId:      text('stripe_sub_id').notNull(),
  plan:             text('plan', { enum: ['pro_monthly', 'pro_annual'] }).notNull(),
  status:           text('status', { enum: ['active', 'canceled', 'past_due'] }).notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
})

// ─── Course Progress ───
export const courseProgress = pgTable('course_progress', {
  id:          uuid('id').defaultRandom().primaryKey(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lessonId:    text('lesson_id').notNull(),
  completed:   boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at'),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
})
```

[ASSUMPTION: These are the initial tables. Schema will grow as features are added.]

### 5.4 `platform/server/routes.ts` — Route Registry

Every API endpoint in the system, mounted in one file.

```typescript
import type { Hono } from 'hono'
import { authRoutes } from '@/platform/auth/routes'
import { subscriptionRoutes } from '@/features/subscription/routes'
import { courseRoutes } from '@/features/course-player/routes'
import { progressRoutes } from '@/features/course-progress/routes'
import { settingsRoutes } from '@/features/user-settings/routes'

export function mountRoutes(app: Hono) {
  return app
    .route('/auth', authRoutes)
    .route('/subscriptions', subscriptionRoutes)
    .route('/courses', courseRoutes)
    .route('/progress', progressRoutes)
    .route('/settings', settingsRoutes)
}
```

**Rule:** To see every endpoint in the system, read this one file.

### 5.5 `platform/server/responses.ts` — Response Shapes

Standardized response wrappers. Every success response uses these.

```typescript
import type { Context } from 'hono'

export function success<T>(c: Context, data: T) {
  return c.json({ ok: true as const, data })
}

export function paginated<T>(c: Context, data: T[], total: number, page: number, perPage: number) {
  return c.json({
    ok: true as const,
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
}

export function created<T>(c: Context, data: T) {
  return c.json({ ok: true as const, data }, 201)
}

export function noContent(c: Context) {
  return c.body(null, 204)
}
```

**Rule:** NEVER return raw `c.json({ ... })`. ALWAYS use `success()`, `created()`, `paginated()`, or `throwError()`.

### 5.6 `platform/auth/permissions.ts` — Permission Matrix

Every role and what it can do.

```typescript
export const permissions = {
  free:  ['view_landing', 'view_pricing', 'view_blog', 'view_help'],
  pro:   ['view_course', 'track_progress', 'download_resources', 'manage_settings'],
  admin: ['manage_content', 'manage_users', 'view_analytics', 'manage_subscriptions'],
} as const

export type Role = keyof typeof permissions
export type Permission = (typeof permissions)[Role][number]

export function hasPermission(role: Role, permission: Permission): boolean {
  const rolePerms = permissions[role] as readonly string[]
  return rolePerms.includes(permission)
}

export function requirePermission(permission: Permission) {
  return async (c: Context, next: Next) => {
    const user = c.get('user')
    if (!user || !hasPermission(user.role, permission)) {
      return throwError(c, 'FORBIDDEN')
    }
    await next()
  }
}
```

### 5.7 `providers/analytics.ts` — Event Registry

Every trackable event with typed properties.

```typescript
import { z } from 'zod'
import PostHog from 'posthog-node'
import { env } from '@/platform/env'

export const posthog = new PostHog(env.POSTHOG_API_KEY, { host: env.PUBLIC_POSTHOG_HOST })

export const events = {
  SIGNUP_COMPLETED:   z.object({ method: z.enum(['email', 'google']) }),
  LOGIN:              z.object({ method: z.enum(['email', 'google']) }),
  CHECKOUT_STARTED:   z.object({ planId: z.string() }),
  SUBSCRIPTION_CREATED: z.object({ plan: z.string(), amount: z.number() }),
  LESSON_STARTED:     z.object({ lessonId: z.string(), moduleId: z.string() }),
  LESSON_COMPLETED:   z.object({ lessonId: z.string(), durationSec: z.number() }),
  ONBOARDING_STEP:    z.object({ step: z.number(), total: z.number() }),
} as const

type EventName = keyof typeof events
type EventProps<T extends EventName> = z.infer<(typeof events)[T]>

export function track<T extends EventName>(userId: string, event: T, props: EventProps<T>) {
  const validated = events[event].parse(props)
  posthog.capture({ distinctId: userId, event, properties: validated })
}
```

**Rule:** NEVER call `posthog.capture()` directly. ALWAYS use `track()` with a typed event.

---

## 6. Build Methodology — Spec-Driven TDD

### 6.1 The Build Loop

Every unit of work follows this sequence. No step can be skipped.

```
SPEC → SCHEMA → TEST (RED) → CODE (GREEN) → REFACTOR → WIRE
```

**Step 1: SPEC** — Write or update SPEC.md in the target folder.
Define the job-to-be-done, user flow, acceptance criteria, and rules for AI agents.

**Step 2: SCHEMA** — Write `schema.ts` (the contract).
For DB-backed entities, generate from Drizzle via `drizzle-zod`. For API inputs, write Zod schemas directly. This is ALWAYS the second file created.

**Step 3: TEST (RED)** — Write failing tests from acceptance criteria.
Each criterion in the SPEC.md becomes one or more test cases. Tests are colocated: `foo.ts` → `foo.test.ts` in the same folder.

**Step 4: CODE (GREEN)** — Write the minimum code to pass tests.
Actions (Hono handlers), components (Preact/JSX), utilities. Nothing more than what the tests require.

**Step 5: REFACTOR** — Clean up while tests stay green.
Extract shared logic only if duplicated 3+ times. Simplify naming. Ensure code reads as clearly as the spec.

**Step 6: WIRE** — Connect to pages/ (thin routing layer).
Import from features, render in pages. Max 20 lines per page file.

### 6.2 What a SPEC.md Contains

```markdown
# [Feature Name] — SPEC

## Job to Be Done
One sentence: "I want to [action] so I can [outcome]."

## User Flow
1. Step one → what happens
2. Step two → what happens
3. Step three → what happens

## Acceptance Criteria
- [ ] Criterion 1 (testable, specific, measurable)
- [ ] Criterion 2
- [ ] Criterion 3

## API Endpoints (if applicable)
- POST /api/endpoint — description
- GET /api/endpoint — description

## Rules for AI
- Specific constraints: what to use, what NOT to do
- Which providers to use
- Which centralized files to reference
- Performance requirements
- Security requirements
```

### 6.3 Build Order for New Features

```
1. SPEC.md              human writes intent
2. schema.ts            human/AI writes contract (Zod schemas)
3. errors.ts            update if new error codes needed
4. env.ts               update if new env vars needed
5. *.test.ts            AI writes from SPEC acceptance criteria (must FAIL)
6. *.ts                 AI writes to pass tests
7. components/*.tsx     AI writes to match SPEC user flow
8. pages/*.tsx           AI wires routes (max 20 lines)
9. routes.ts            mount new routes in platform/server/routes.ts
10. analytics.ts         add new events to providers/analytics.ts
```

### 6.4 Testing Standards

- **Framework:** `bun:test` (built-in, Jest-compatible API)
- **Coverage target:** 100%. No exceptions.
- **Colocation:** `foo.ts` → `foo.test.ts` in the same directory. No `__tests__/` folders.
- **Test naming:** Describe what, not how. `it('creates a Stripe checkout session for pro_monthly')`, not `it('should call stripe.create')`.
- **Schema-driven edge cases:** Every Zod schema implies test cases — valid inputs, each invalid variant, missing required fields, wrong types.
- **No mocking the database.** Use a test database or in-memory fixtures. Mock only external providers (Stripe, Resend).

---

## 7. Platform Layer — SPEC Details

### 7.1 Server SPEC (`platform/server/SPEC.md`)

#### Architecture
- Hono app on Bun runtime
- All routes mounted in `platform/server/routes.ts`
- Route types exported as `AppRoutes` for hono/client RPC
- Routes MUST be chained (not separate `.route()` calls)

#### Middleware Stack (order matters)
1. `logger` — logs all requests (method, path, status, duration)
2. `cors` — allows configured origins
3. `rate-limit` — per-route limits
4. `auth` — on protected routes only (via `requireAuth` middleware)

#### Error Contract
All errors use `platform/errors.ts`. Response shape is always:
```json
{ "ok": false, "code": "ERROR_CODE", "message": "Human-readable message", "details": "optional" }
```

#### Success Contract
All success responses use `platform/server/responses.ts`:
```json
{ "ok": true, "data": {} }
{ "ok": true, "data": [], "meta": { "total": 100, "page": 1, "perPage": 20, "totalPages": 5 } }
```

#### Performance
- No N+1 queries. Use Drizzle relational queries for joins.
- Rate limit all public endpoints (10 req/min for auth, 100 req/min for reads)
- Cache static content responses (marketing, blog) for 60 seconds
- [DECISION NEEDED: CDN for static assets? Cloudflare in front of Railway?]

#### Security
- NEVER access `process.env` directly → use `platform/env.ts`
- NEVER return stack traces in production
- NEVER log sensitive data (passwords, tokens, card numbers)
- ALL input validated via Zod before processing
- Better Auth handles CSRF, session cookies, token rotation
- Helmet-equivalent headers set via Hono middleware

### 7.2 Database SPEC (`platform/db/SPEC.md`)

#### Conventions
- Table names: plural, snake_case (`users`, `course_progress`, `subscriptions`)
- Column names: snake_case (`created_at`, `user_id`)
- Every table has: `id` (uuid, auto-generated), `created_at`, `updated_at`
- Soft deletes: `deleted_at` column where applicable
- Foreign keys: cascade on delete unless explicitly documented otherwise

#### Migration Rules
- Generate: `bun drizzle-kit generate`
- Review SQL before applying
- NEVER modify a migration after it's been applied
- NEVER use `drizzle-kit push` in production
- Migration files are committed to git

#### The Type Chain Rule
Drizzle table → `drizzle-zod` → Zod schema → Hono validator → hono/client type.
NEVER define types manually. They all flow from `schema.ts`.

### 7.3 Auth SPEC (`platform/auth/SPEC.md`)

#### Provider
Better Auth — self-hosted, database-backed sessions, TypeScript-first.

#### Auth Methods
- Email + password (primary)
- Google OAuth (secondary)
- [DECISION NEEDED: Magic link? Passkeys?]

#### Session Management
- Database sessions (not JWT) — revocable, auditable
- Session duration: 30 days
- Auto-renewal on activity
- [ASSUMPTION: Better Auth handles session cookie rotation]

#### Roles
Three roles: `free`, `pro`, `admin`. Defined in `platform/auth/permissions.ts`.

#### Protected Routes
- `/app/*` — requires `requireAuth()` middleware
- `/api/*` (except `/api/auth/*`) — requires `requireAuth()` middleware
- Marketing pages, blog, help — public

---

## 8. Provider Layer

### 8.1 Provider Rules (`providers/SPEC.md`)

1. **One file per capability.** `payments.ts`, `email.ts`, `analytics.ts`, `storage.ts`.
2. **Name by capability, not vendor.** If you switch from Stripe to Lemon Squeezy, rename nothing — change one file.
3. **Providers are thin and stateless.** Client initialization + constants + typed helper functions. No business logic.
4. **Providers NEVER import from features.** They are consumed BY features, never the reverse.
5. **If it doesn't fit in one file, it's not a provider.** Webhook handlers belong in `platform/` or `features/`. The provider is just the SDK wrapper.

### 8.2 Provider Interfaces

```typescript
// providers/payments.ts
import Stripe from 'stripe'
import { env } from '@/platform/env'

export const payments = new Stripe(env.STRIPE_SECRET_KEY)

export const plans = {
  pro_monthly: { priceId: 'price_xxx', amount: 2900, interval: 'month' },
  pro_annual:  { priceId: 'price_yyy', amount: 24900, interval: 'year' },
} as const

export type PlanId = keyof typeof plans
```

```typescript
// providers/email.ts
import { Resend } from 'resend'
import { env } from '@/platform/env'

export const email = new Resend(env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, react: JSX.Element) {
  return email.emails.send({
    from: 'Right Decision <hello@rightdecision.com>',
    to,
    subject,
    react,
  })
}
```

---

## 9. Content Layer

### 9.1 Content Structure

All user-facing content lives in `content/` with locale subfolders. Every piece must exist in both `en/` and `pt-BR/`.

### 9.2 Frontmatter Schema

```yaml
---
title: "Human-readable title"
slug: "url-slug"
type: "course|blog|marketing|help"
status: "draft|review|published"
created: "2026-04-07"
updated: "2026-04-07"
author: "henry|indy|ai"
locale: "en|pt-BR"
# Course-specific
module: 1
lesson: 1
duration_minutes: 15
# Blog-specific
seo_title: "SEO title"
seo_description: "Meta description"
tags: ["tag1", "tag2"]
# Marketing-specific
funnel_stage: "awareness|consideration|decision"
cta: "Primary CTA text"
---
```

### 9.3 i18n Rules

- `en/` is always created first (source of truth)
- `pt-BR/` mirrors `en/` structure exactly — same filenames, same folders
- If `pt-BR/` translation doesn't exist, the app falls back to `en/`
- Portuguese content is localized (culturally adapted), not word-for-word translated

### 9.4 Content Loading

[DECISION NEEDED: Custom MDX loader or use a library like `@mdx-js/mdx`?]

Content is imported at build time, not fetched via API. The loader parses frontmatter + MDX body and returns typed objects.

---

## 10. Infrastructure & CI/CD

### 10.1 CI Pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2

      - name: Install
        run: bun install --frozen-lockfile

      - name: Lint + Format
        run: bun biome ci .

      - name: Typecheck
        run: bun tsc --noEmit

      - name: Test
        run: bun test --coverage

      - name: Build (validates env)
        run: bun run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          # ... all required env vars
```

Four steps: lint → typecheck → test → build. All fast because Bun + Biome.

### 10.2 Deployment

Railway auto-deploys from `main` branch. The Dockerfile builds a production Bun image:

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS build  
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build

FROM base AS runtime
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
```

### 10.3 Biome Configuration (`biome.json`)

```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded",
      "trailingCommas": "all"
    }
  },
  "files": {
    "ignore": ["node_modules", "dist", ".next", "content/"]
  }
}
```

[DECISION NEEDED: Semicolons or no semicolons? `asNeeded` is shown above.]
[DECISION NEEDED: Single quotes or double quotes?]

### 10.4 Local Development Commands

```json
{
  "scripts": {
    "dev": "bun run --hot platform/server/app.ts",
    "build": "bun run build",
    "check": "biome ci . && tsc --noEmit && bun test",
    "test": "bun test --coverage",
    "lint": "biome check --write .",
    "format": "biome format --write .",
    "db:generate": "bun drizzle-kit generate",
    "db:migrate": "bun platform/scripts/migrate.ts",
    "db:seed": "bun platform/scripts/seed.ts",
    "db:studio": "bun drizzle-kit studio"
  }
}
```

**Pre-commit check:** `bun run check` runs everything. Same command in CI. If it passes locally, it passes in CI.

---

## 11. AGENTS.md Template

```markdown
# Right Decision — Agent Instructions

## What is this
Right Decision is an infobusiness + software company. Solo developer + AI agents.
Stack: Bun, Hono, Preact, Drizzle, Zod, PostgreSQL, Better Auth, Tailwind.

## CRITICAL: Read SPEC.md before ANY code change
Before modifying ANY file, read the SPEC.md in that folder.
If no SPEC.md exists and you're creating a new folder, create SPEC.md FIRST.

Routing:
- Working in ui/ → read ui/SPEC.md
- Working in features/*/ → read features/*/SPEC.md
- Working in marketing/ → read marketing/SPEC.md
- Working in providers/ → read providers/SPEC.md
- Working in platform/*/ → read platform/*/SPEC.md

## Build Order (NEVER skip steps)
1. Write/update SPEC.md
2. Write/update schema.ts
3. Update platform/errors.ts if new errors needed
4. Update platform/env.ts if new env vars needed
5. Write tests (MUST FAIL first)
6. Write code to pass tests
7. Refactor while tests stay green
8. Wire into pages/ last

## Seven Files You Must Know
1. platform/env.ts — all environment variables
2. platform/errors.ts — all error codes + throwError()
3. platform/db/schema.ts — all database tables
4. platform/server/routes.ts — all API endpoints
5. platform/server/responses.ts — success(), paginated()
6. platform/auth/permissions.ts — roles + permissions
7. providers/analytics.ts — all trackable events

## Rules
- 100% test coverage, no exceptions
- Tests colocated: foo.ts → foo.test.ts same folder
- No types defined manually — infer from Zod/Drizzle
- Providers are ONE file each, named by capability not vendor
- Pages are max 20 lines — just wiring
- No abstraction until the 3rd duplication
- NEVER return ad-hoc errors — use throwError()
- NEVER return raw c.json() — use success() or paginated()
- NEVER access process.env — use env from platform/env.ts
- Route chains must be connected (for AppRoutes type inference)
- All content in content/ must have both en/ and pt-BR/

## Commands
- bun run check — lint + typecheck + test (run before every commit)
- bun run dev — start dev server
- bun test --coverage — run tests
- bun biome check --write . — fix lint + format issues
```

---

## 12. Design System Approach (`ui/SPEC.md` Outline)

[DECISION NEEDED: Final design token values. The following are starting points inspired by Linear/Stripe.]

### 12.1 Design Philosophy
- Monochrome base with one accent color
- High contrast, dense but breathable
- Professional but not corporate
- References: Linear, Stripe, Anthropic

### 12.2 Spacing Scale
Base unit: 4px. Scale stops: 1(4px), 2(8px), 3(12px), 4(16px), 6(24px), 8(32px), 12(48px), 16(64px), 24(96px).
Rule: Section gaps use 8+. Component internals use 1-4. Never use arbitrary values.

### 12.3 Typography
[DECISION NEEDED: Font choice. Options: Inter, Geist, system fonts.]

### 12.4 Colors
[DECISION NEEDED: Accent color. Options: Indigo, Blue, Violet.]
[DECISION NEEDED: Dark mode support? Changes token architecture significantly.]

### 12.5 Border Radius
Default: 6px. Cards: 8px. Modals: 12px. Pills: 9999px.

### 12.6 Component Rules
- NEVER hardcode colors, spacing, or radii in components — use tokens
- CHECK `ui/primitives/` before building any UI element
- Default to `size="sm"` for dense interfaces
- Loading states use Skeleton primitives from `ui/primitives/`

---

## 13. Open Questions

| # | Question | Impact | Options |
|---|----------|--------|---------|
| 1 | Dark mode? | Changes token architecture | Yes (CSS vars swap per theme) / No (hardcoded values) |
| 2 | Font choice | Visual identity | Inter / Geist / System |
| 3 | Accent color | Brand identity | Indigo / Blue / Violet |
| 4 | Semicolons in Biome | Code style | Yes / No (asNeeded) |
| 5 | CDN for static assets | Performance | Cloudflare in front / Railway alone |
| 6 | Magic link auth | UX convenience | Yes (Better Auth plugin) / No (email+password only) |
| 7 | MDX loader | Content pipeline | Custom / @mdx-js/mdx / content-collections |
| 8 | Monorepo packages | Code organization | Single package / Multiple Turborepo packages |
| 9 | HonoX for marketing SSR | Framework choice | HonoX file-routing / Custom Hono SSR |
| 10 | Client-side router for dashboard | SPA navigation | TanStack Router / React Router / Preact Router |

---

## 14. Implementation Sequence

Phase 1: Foundation (do first, everything depends on it)
1. Initialize monorepo (Turborepo + Bun workspaces)
2. Create folder structure (all directories, empty SPEC.md files)
3. Configure Biome, TypeScript, Tailwind
4. Set up platform/env.ts with t3-env
5. Set up platform/errors.ts + platform/server/responses.ts
6. Set up platform/db/ (Drizzle + Railway PostgreSQL)
7. Set up platform/server/app.ts (Hono app, middleware stack)
8. Set up platform/auth/ (Better Auth)
9. Set up CI pipeline (.github/workflows/ci.yml)
10. Write root AGENTS.md

Phase 2: Providers (thin wrappers, quick)
11. providers/payments.ts (Stripe)
12. providers/email.ts (Resend)
13. providers/analytics.ts (PostHog)

Phase 3: Design System
14. ui/SPEC.md (design decisions)
15. ui/tokens.ts + ui/tailwind.preset.ts
16. ui/primitives/ (Button, Input, Card, Skeleton — minimum viable set)

Phase 4: First Feature (proves the methodology)
17. features/subscription/ (full SPEC → Schema → TDD → Wire cycle)

Phase 5: Content Pipeline
18. content/ folder structure with sample MDX
19. Content loader
20. marketing/ pages (landing, pricing, blog)

Phase 6: Remaining Features
21. features/course-player/
22. features/course-progress/
23. features/onboarding/
24. features/user-settings/

Phase 7: Content & Polish
25. Populate content/ with real course content
26. Help center
27. Email templates
28. Analytics event integration throughout

---

## 15. Changelog (Draft → Final tracking)

| Change | Status |
|--------|--------|
| Initial draft | Complete |
| Design token values | [DECISION NEEDED] |
| Font and color choices | [DECISION NEEDED] |
| Dark mode decision | [DECISION NEEDED] |
| MDX loader choice | [DECISION NEEDED] |
| Client router choice | [DECISION NEEDED] |
| Biome style preferences | [DECISION NEEDED] |
| CDN decision | [DECISION NEEDED] |