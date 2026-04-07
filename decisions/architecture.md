# Architecture — How We Design Systems

> Last verified: 2026-04-07
> Implementation patterns: decisions/coding.md
> Deep dive: decisions/001-architecture.md (DSA original)

## When to Read This
Before writing a PRD (d-prd), designing a new feature, or making any data/storage decision.
This file defines the architectural PATTERNS. coding.md defines the implementation RULES.

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

## Decisions Log

| Date | Decision | Why |
|---|---|---|
| 2026-04-07 | Data Storage Decision Rule created | PRD review revealed inconsistent storage decisions (manifest.json vs DB). Codified the rule. |
| 2026-04-07 | Step-Based Workflow Pattern created | "Content pipeline" was a monolithic feature. Decomposing into steps enables independent retry, approval gates, and API-first architecture. |
| 2026-04-07 | Parenthesized feature groups | Two products sharing one codebase need clear organizational boundaries without breaking imports. |
