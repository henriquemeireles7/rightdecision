# Architecture — How We Design Systems

> Last verified: 2026-04-09
> Maturity context: decisions/product/context.md, decisions/harness/context.md
> Implementation patterns: decisions/code.md
> Deep dive: decisions/product/00-legacy/001-architecture.md (DSA original)

## When to Read This
Before designing a new feature or making any data/storage decision.
This file defines the architectural PATTERNS. code.md defines the implementation RULES.

---

## Data Storage Decision Rule

Every piece of data belongs in exactly one of three stores. The wrong choice creates migration debt.

| Store | When | Test | Examples |
|---|---|---|---|
| **Filesystem** (.md in content/ or decisions/) | AI agents author it AND humans review it AND git versioning matters | "Would I PR-review changes to this?" | Course content, strategy docs, skills, brand voice |
| **PostgreSQL** (via Drizzle) | Application generates it AND needs queries, transactions, or relationships | "Would I write a SQL query against this?" | User data, pipeline state, analytics, clip metadata, posts |
| **Object Storage** (Railway R2/S3) | Binary files > 1MB | "Is this a file I can't read as text?" | Videos, audio, images, generated clips |

### Why Not "Just Use the DB for Everything"?
Course content as .md files means Claude can author lessons, git tracks revisions, humans PR-review changes. Putting course content in PostgreSQL means building a CMS. The file IS the CMS.

### Why Not "Just Use Files for Everything"?
Pipeline state (which clip is where, what failed) needs transactions, queries, and concurrent access safety. "Show me all clips with score > 8 posted to TikTok" is a SQL query, not a grep. Files break under concurrent writes.

---

## Step-Based Workflow Pattern

Every multi-step automation (podcast pipeline, future AI agents, future lead nurturing) follows this pattern. It is the architectural backbone of Business Decisions.

### The Pattern

```
1. Decompose into STEPS (each independently retryable)
2. Each step = feature folder + API endpoint + DB state transition
3. Steps needing human review = approval gates (skill pauses here)
4. Fully automated sequences = one skill runs multiple steps
5. Orchestrator is THIN — wiring steps + config for approval gates
6. API-first: agents, skills, and future UI all call the same endpoints
```

### Step Boundary Rule

How to decide where one step ends and another begins:

| Signal | Decision |
|---|---|
| Different external dependency (different failure mode) | Separate step |
| Human might review the output | Separate step (approval gate) |
| Independently useful ("re-run just this one") | Separate step |
| Same dependency, no review, always sequential | Same step |

### Skill-to-Step Mapping

Skills (what the user invokes) map to steps (what the code runs):

```
RULE: A skill ends where a human decision is needed.
RULE: If a sequence is 100% automated, one skill can span multiple steps.
RULE: If a step needs approval, the skill pauses there.
```

Two modes:
- **Auto mode** (solo developer, dogfooding): Skills run all steps straight through, no pauses.
- **Platform mode** (external customers): Skills pause at approval gates, customer reviews before proceeding.

The architecture supports both without code changes. The orchestrator reads a config that says which steps auto-proceed and which pause.

### DB State Machine Pattern

Every workflow has a status enum on its primary table. Each step transitions the status:

```
queued → step1_running → step1_done → step2_running → step2_done → ...
→ [APPROVAL GATE] → awaiting_approval → approved → next_step_running → ...
→ completed

Any step can → failed (with step_failed_at recording WHICH step)
Any failed step retryable via its own API endpoint
```

### Orchestrator Pattern

The orchestrator is THIN. It does not contain business logic. It:
1. Reads workflow config (which steps, which approval gates)
2. Calls step APIs in sequence
3. Checks status after each step
4. Pauses at approval gates (or auto-proceeds in auto mode)
5. Handles failure → records which step failed → enables targeted retry

The orchestrator lives in `features/(product)/workflow/`. Each step lives in its own feature folder.

---

## Feature Organization: Parenthesized Groups

Features are organized by product using parenthesized group folders (inspired by Next.js route groups). Parentheses signal "this is a grouping folder, not a feature." Imports include the group name but it's purely organizational.

```
features/
├── (shared)/           ← Used by both products
│   ├── account/
│   ├── subscription/
│   └── email/
│
├── (life)/             ← Life Decisions features
│   ├── course-player/
│   ├── course-progress/
│   ├── onboarding/
│   ├── paywall/
│   └── wins/
│
└── (business)/         ← Business Decisions features
    ├── transcribe/
    ├── clip-select/
    ├── workflow/
    └── ...
```

Import path: `@/features/(business)/transcribe/service`

### Rules
- Features inside `(shared)/` are imported by BOTH products. Changes require testing both.
- Features inside `(life)/` NEVER import from `(business)/` and vice versa.
- If a `(life)/` or `(business)/` feature needs to be shared, move it to `(shared)/`.
- Each feature folder still has its own CLAUDE.md, routes.ts, service.ts, tests.

---

## Website Architecture (Doc 11)

Public-facing website at rightdecisions.io. All pages SSR'd via `renderPage()` — no client-side JS for content pages.

### Content System
- **Blog:** Markdown files in `content/blog/`, rendered by `providers/markdown.ts`. Frontmatter: title, date, author, cluster, keywords, FAQ.
- **Concepts:** Markdown in `content/concepts/`. SEO-keyword-targeted pages with FAQ schema + DefinedTerm schema.
- **Profiles:** Persona intelligence in `content/profiles/`. Template system, validation script, health scoring.

### SEO Infrastructure
- `features/(shared)/website/seo.ts` — JSON-LD schema builders (Article, FAQ, Organization, Person, Product, WebSite, Breadcrumb, DefinedTerm)
- `features/(shared)/website/sitemap.ts` — Dynamic sitemap.xml, robots.txt, RSS feed, IndexNow key verification
- `features/(shared)/website/og-image.ts` — Programmatic OG images via satori + resvg

### SEO Providers
- `providers/indexnow.ts` — Push URLs to Bing/Yandex/Seznam via IndexNow protocol
- `providers/search-console.ts` — Google Search Console API for indexing status

### SEO Scripts
- `bun run indexnow` — Post-deploy URL submission
- `bun run seo-health` — Monthly SEO dashboard
- `bun run freshness` — Content age tracker (90-day GEO decay threshold)
- `bun run content:check` — Content quality validation

### Data Storage
| Store | Content |
|-------|---------|
| `content/blog/` | Blog posts (markdown + frontmatter) |
| `content/concepts/` | Concept pages (markdown + FAQ + keywords) |
| `content/profiles/` | Persona profiles (markdown + learning + changelog) |

---

## Scale Assumptions

| Metric | V1 Target | V2 Trigger |
|--------|-----------|------------|
| Users | <1,000 | >5,000 concurrent |
| Courses | 1 (Life Decisions) | 3+ courses |
| BD tenants | 0 (dogfooding only) | First paying BD client |
| DB size | <1GB | >10GB |
| API requests | <100/min | >1,000/min |

When V2 triggers hit, revisit: connection pooling, read replicas, CDN for static content, service extraction.

## Error Propagation Pattern

```
Provider (external API) → Feature (business logic) → API (HTTP handler) → Client (user)
    ↓ throws                   ↓ catches + wraps          ↓ maps to HTTP      ↓ sees message
  ProviderError             throwError('CODE')          success()/error()    User-friendly text
```

- Providers throw raw errors (timeout, 429, malformed response)
- Features catch and wrap with `throwError()` from platform/errors.ts
- API layer maps error codes to HTTP status via responses.ts
- Client sees user-friendly message, never raw errors
- Every error is logged with full context (what was attempted, for whom)

## Monolith Split Criteria

Current architecture is a monolith. Do NOT split until ALL of these are true:
1. Deploy takes >10 minutes (currently ~2 min)
2. Two features need different scaling profiles (e.g., content pipeline at 100x vs auth at 1x)
3. Team size >3 (currently 1 + AI agents)

Split candidates when ready: content pipeline (CPU-heavy), BD tenant isolation, analytics ingestion.

## Decisions Log

| Date | Decision | Why |
|---|---|---|
| 2026-04-07 | Data Storage Decision Rule created | PRD review revealed inconsistent storage decisions (manifest.json vs DB). Codified the rule. |
| 2026-04-07 | Step-Based Workflow Pattern created | "Content pipeline" was a monolithic feature. Decomposing into steps enables independent retry, approval gates, and API-first architecture. |
| 2026-04-07 | Parenthesized feature groups | Two products sharing one codebase need clear organizational boundaries without breaking imports. |
