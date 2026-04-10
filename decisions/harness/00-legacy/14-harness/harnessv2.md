# Harness V2 — Initiative-Based Three-Domain Architecture

> Status: DRAFT (v2 rewrite)
> Date: 2026-04-09
> Purpose: Redesign the AI development methodology around initiatives, projects, and three domains (ops/code/harness) with a self-updating knowledge base.

---

## What decisions/ Is

decisions/ is the **intelligence layer**. It holds strategy, plans, and reference knowledge. It does NOT dictate which code files you touch. It does NOT reorganize the project structure. features/, platform/, providers/, content/, pages/ stay exactly where they are at root.

The three domains in decisions/ represent **intention** — what you're thinking about:
- **Code:** Thinking about the product. Features, architecture, UX.
- **Ops:** Thinking about running the business. Campaigns, content, affiliates, SEO, email, social.
- **Harness:** Thinking about improving the development system. Skills, hooks, methodology, automation.

Any domain can produce code changes in any folder. An ops initiative for affiliate tracking might create `providers/affiliate.ts`. A harness initiative might create `features/(shared)/admin/`. The domain is the INTENT, not a file permission boundary.

---

## The Core Cycle

Everything we do follows one cycle:

```
STRATEGY → EXECUTION → LEARN → NEW STRATEGY
```

Every Conductor workspace runs one of two session types:

**STRATEGY session:** Creates the intelligence. Thinks about what to do and why.
- Founder gives context about the domain and initiative
- /d-decide or /plan-ceo-review to shape the strategy
- Output: initiative folder in decisions/ with document.md + project folders with roadmap.md
- Finishes with: PR + merge (small, docs-only change)

**EXECUTION session:** Does the work. Implements one specific project.
- Agent reads project/roadmap.md
- /plan-ceo-review on the project's roadmap to refine and lock it
- Implementation: /d-code for product features, domain-specific skills for other work
- /d-review, /ship
- Finishes with: PR + merge (code + tests + content)
- /d-sync updates synced/ files based on what was built

---

## The Problem with Harness V1

V1 was built for one agent doing one thing at a time. It shipped a lot: 13 docs, auth, payments, courses, onboarding, a website. But structural bottlenecks:

1. **Single-threaded.** Serial pipeline: doc → tasks → code → review → ship. No parallelism.
2. **Knowledge scattered.** Strategy docs, content, methodology, voice guide, CLAUDE.md. Five separate systems, no formal relationship. Update one, others go stale.
3. **No backlog grooming.** Manual project picking. No skill that analyzes the roadmap, codebase state, and content gaps to generate parallel projects.
4. **Skills overengineered AND weak.** 27 skills. d-meta + d-input + d-plan = 3 skills for one thing. d-jtbd + d-prd + d-tasks = 3 more for planning that produces wrong beads. Content pipeline = 6+ fragments.
5. **Beads/tasks don't match reality.** Plans aren't big enough for a task management system. Agent picks wrong beads, creates wrong coding tasks, overhead doesn't pay off.
6. **Agents stop before finishing.** Ask agent to code a plan, it does 70% and says "done." The completion verification doesn't exist.
7. **Dead code accumulates.** Knip found abandoned exports. Build Order creates exports early (schema, errors), wiring step (pages) gets skipped. No mechanism catches drift.
8. **No project scoping.** Roadmap is one big file. No way to break work into initiative → projects that can run in parallel workspaces.
9. **Source docs go stale.** After shipping a project, the strategy docs, reference files, and CLAUDE.md don't update to reflect what was built.

---

## The Initiative → Project Hierarchy

This is the structural change that enables everything else.

### What's an Initiative?

An initiative is a strategic bet. It has a strategy.md that defines WHAT we're doing and WHY. Examples:
- "Free Course Funnel" (ops)
- "Decision Graph V1" (code)
- "Harness V2" (harness)
- "Paid Traffic Campaign" (ops)
- "Content SEO Foundation" (ops)

An initiative produces 1-5 projects. Each project is small enough for one Conductor workspace, one PR.

### What's a Project?

A project is the unit of execution. One workspace, one branch, one PR. It has:
- `roadmap.md` — what this specific project delivers (scope, files, acceptance criteria)
- `plan.md` — the reviewed plan (output of gstack /plan-ceo-review or /plan-eng-review)
- `future-todos.md` — deferred work discovered during implementation

A project is scoped by TWO dimensions:
1. **Time:** Can one agent complete it in 1-3 sessions? If not, split.
2. **Cohesion:** Does it change one coherent thing? If it touches auth AND billing AND UI, split.

### How Initiatives Become Projects

```
1. Founder identifies initiative ("we need a free funnel")
2. Roadmap session (1 workspace):
   - /d-decide "Free Course Funnel"    → raw.md + document.md (strategy)
   - /d-groom                          → 1-5 project folders with roadmaps
   - Output: initiative folder with strategy + project folders
3. Implementation sessions (1 workspace per project):
   - Agent reads project/roadmap.md
   - gstack reviews (office-hours, CEO, eng)
   - /d-code implements with TDD + completion audit
   - /d-review checks quality
   - /ship creates PR, merges to master
4. After all projects merge:
   - /d-sync updates synced/ files across all domains
   - Learning feeds back into next roadmap session
```

---

## The Knowledge Base Structure

### Three Domains, Each with Source and Synced

```
decisions/
├── code/                               ← Domain: building the product
│   ├── source/                         ← Human-authored strategy docs
│   │   ├── decision-graph-v1/          ← Initiative
│   │   │   ├── raw.md                  (founder thinking — immutable)
│   │   │   ├── document.md             (strategy — static once written)
│   │   │   ├── project-schema/         ← Project 1
│   │   │   │   ├── roadmap.md          (what this project delivers)
│   │   │   │   ├── plan.md             (reviewed plan from gstack)
│   │   │   │   └── future-todos.md     (deferred work)
│   │   │   └── project-ui/             ← Project 2
│   │   │       ├── roadmap.md
│   │   │       ├── plan.md
│   │   │       └── future-todos.md
│   │   ├── free-course-funnel/
│   │   │   ├── raw.md
│   │   │   ├── document.md
│   │   │   └── project-email-capture/
│   │   └── ...
│   │
│   └── synced/                         ← Derived, auto-maintained by d-sync
│       ├── coding.md                   (how we build software — updates after code projects)
│       ├── architecture.md             (system design — updates after code projects)
│       ├── roadmap.md                  (CODE roadmap — what's next for the product)
│       ├── lifedecisions.md            (LD product reference)
│       ├── businessdecisions.md        (BD product reference)
│       └── design.md                   (design system reference)
│
├── ops/                                ← Domain: running the business
│   ├── source/
│   │   ├── paid-traffic-campaign/      ← Initiative
│   │   │   ├── raw.md
│   │   │   ├── document.md
│   │   │   └── project-meta-ads-setup/
│   │   ├── content-seo-foundation/
│   │   ├── affiliate-program/
│   │   ├── social-media-setup/
│   │   └── ...
│   │
│   └── synced/
│       ├── company.md                  (company positioning — updates after ops decisions)
│       ├── voice.md                    (brand voice — updates after content projects)
│       ├── roadmap.md                  (OPS roadmap — what's next for the business)
│       └── deploy.md                   (how we ship — updates after infra changes)
│
├── harness/                            ← Domain: improving the methodology
│   ├── source/
│   │   ├── harness-v2/                 ← Initiative (THIS DOCUMENT)
│   │   │   ├── raw.md
│   │   │   ├── document.md
│   │   │   └── project-skill-consolidation/
│   │   ├── self-learning-pipeline/
│   │   └── ...
│   │
│   └── synced/
│       ├── harness.md                  (AI development system — updates after harness projects)
│       ├── hardening.md                (security & quality — updates after incidents)
│       └── roadmap.md                  (HARNESS roadmap — what's next for methodology)
│
└── INDEX.md                            ← Auto-generated by d-sync (Karpathy pattern)
```

### Key Design Decisions

1. **Only raw.md and document.md in source.** No meta.md, no input.md. raw.md is the founder's brain dump (immutable). document.md is the strategy (static once written). That's it. Simpler.

2. **company.md and voice.md are in synced/ (ops).** They CAN be updated by projects. If an ops initiative changes positioning or brand voice, d-sync updates these files.

3. **Each domain has its own roadmap.md in synced/.** Not one global roadmap. Code has its roadmap, ops has its roadmap, harness has its roadmap. Each gets updated independently.

4. **Plans live inside project folders.** Not in a separate plans/ directory. The plan belongs to the project it describes. When the project is done, the plan stays as documentation of what was decided.

5. **INDEX.md at the root.** Auto-generated by d-sync. Lists every file across all three domains with one-line summaries. The LLM reads this first to navigate the knowledge base (Karpathy pattern).

### Source Files vs Synced Files

**Source files** (human-authored via d-decide, immutable after writing):
- raw.md — founder's unstructured thinking
- document.md — strategy document
- project/roadmap.md — project scope
- project/plan.md — reviewed implementation plan
- project/future-todos.md — deferred work

**Synced files** (derived, auto-maintained by d-sync after every project):
- coding.md, architecture.md, etc. — reference files per domain
- roadmap.md (per domain) — current priorities
- company.md, voice.md — foundational files that evolve
- INDEX.md — knowledge base navigation

The boundary is enforced by folder: d-sync writes ONLY to synced/ directories and INDEX.md. Never touches source/.

---

## d-sync: The Knowledge Base Engine

d-sync runs after every project merges to master. It's the mechanism that makes the knowledge base self-updating.

### When It Runs
- After every `/ship` (project PR merged) — automatic
- After every `/d-decide` (new strategy doc written) — automatic
- On-demand: `/d-sync` (manual)
- Weekly: `/d-sync lint` (scheduled health check)

### How It Works

**Step 1: Detect what changed**
```
git log --since="last d-sync run" --name-only
→ Map changed files to their domain (code/ops/harness)
→ Map changed files to relevant synced files
```

**Step 2: Staleness detection (git timestamps)**
```
For each (source_file, synced_file) in DEPENDENCY_MAP:
  source_modified = git log -1 --format=%ct source_file
  synced_modified = git log -1 --format=%ct synced_file
  if source_modified > synced_modified: STALE
```

**Step 3: Update stale synced files**
For each stale synced file:
1. Read all its source files
2. Read current codebase state (if the synced file references code patterns)
3. Read the current synced file
4. LLM: "Update this reference file to reflect current source truth. Preserve structure. Only change what's outdated."
5. Write updated file
6. Commit: `chore(d-sync): update [synced file] from [sources]`

**Step 4: Regenerate INDEX.md**
After all synced files updated, regenerate the knowledge base index.

**Step 5: Verification**
- If synced file changed >50% of lines → WARN (possible hallucination)
- Human reviews d-sync PRs

### d-sync lint mode (`/d-sync lint`)
Read-only scan, no file changes:
1. Staleness check across all three domains
2. Contradiction detection between source and synced
3. Orphaned documents (source files with no synced dependents)
4. Broken internal references
5. Gaps (topics in source not covered by any synced file)
Output: report sorted by severity.

### Dependency Map
Hardcoded in the skill. Explicit (source → synced) pairs per domain:

```
CODE:
  code/source/*/document.md → code/synced/architecture.md
  code/source/*/document.md → code/synced/coding.md
  code/source/*/document.md → code/synced/lifedecisions.md
  code/source/*/document.md → code/synced/businessdecisions.md
  codebase state (features/, platform/) → code/synced/coding.md

OPS:
  ops/source/*/document.md → ops/synced/company.md
  ops/source/*/document.md → ops/synced/voice.md
  ops/source/*/document.md → ops/synced/deploy.md
  content/ state → ops/synced/voice.md

HARNESS:
  harness/source/*/document.md → harness/synced/harness.md
  .claude/skills/ state → harness/synced/harness.md
  .claude/hooks/ state → harness/synced/harness.md
  d-health reports → harness/synced/hardening.md
```

---

## The Skill Consolidation: 27 → ~10

### Skills to KEEP (proven, strong)
| Skill | Domain | What it does |
|-------|--------|-------------|
| **d-review** | code | Multi-phase pre-commit review. Script-first + AI. Our strongest skill. Unchanged. |
| **d-harness** | harness | Error → prevention feedback loop. Unchanged. |
| **d-health** | harness | Codebase audit. 10 sessions, report-only. Unchanged. |
| **d-fail** | harness | Deploy failure recovery. Unchanged. |
| **d-autoreview** | code | Review chain: d-review → /simplify → /qa → /ship. Unchanged. |

### Skills to CREATE (new)
| Skill | Domain | What it does |
|-------|--------|-------------|
| **d-decide** | all | Make a decision. Frame → Think (interactive, 2-3 options per Q) → Write. Replaces d-meta + d-input + d-plan + d-auto + d-autodocs. Outputs raw.md + document.md. |
| **d-groom** | all | Backlog grooming. Reads initiative strategy.md + current state → generates 1-5 project folders with roadmaps. Gap analysis (what exists vs what should exist). |
| **d-code** | code | Meticulous plan execution with TDD. Tests FIRST, code second. Completion audit + wiring audit. See detailed spec below. |
| **d-content** | ops | Turn strategy into content. Routes by type: blog, handbook, methodology, social, clips. Includes adversarial quality review (voice.md + factual accuracy). |
| **d-sync** | harness | Knowledge base sync engine. Runs after every project. Staleness detection + LLM update + INDEX.md generation + lint mode. |

### Skills to DELETE
d-meta, d-input, d-plan (→ d-decide), d-auto, d-autodocs (→ d-decide), d-jtbd, d-prd (→ gstack office-hours + plan reviews), d-tasks, d-autocode (→ gstack + d-code), d-write (→ d-content), d-process-episode, d-select-clips, d-socialpost (→ d-content), d-generate-metadata, d-collect-analytics, d-whats-working (→ d-analytics or delete), d-profile-create, d-profile-learn, d-profile-preview (→ d-profile or delete), d-skill (keep or merge into harness workflow), d-code (current version deleted, rewritten from scratch).

**Net: 27 → ~10 skills.** Each does one complete thing end-to-end.

---

## The New d-code: TDD + Completion Audit

The most important new skill. Fixes the "70% done" problem.

```
Phase 1: PLAN DECOMPOSITION
- Read the plan (project/plan.md from gstack review)
- Extract every concrete deliverable (files, routes, tests, migrations, UI)
- Create a checklist in the session
- Show checklist to confirm scope

Phase 2: TDD IMPLEMENTATION (per deliverable)
- For each item on the checklist:
  a. Write the TEST first (must fail — red)
  b. Write the CODE to pass the test (green)
  c. Refactor while tests stay green
  d. Mark item complete
- NEVER skip to next item until current item's tests pass

Phase 3: COMPLETION AUDIT
- Re-read the original plan (project/plan.md)
- Diff every deliverable in the plan against what was built
- For each gap found:
  a. Write the test (red)
  b. Write the code (green)
  c. Mark complete
- Optional: dispatch subagent/Codex for independent verification
- Run `bun run check` (full lint + typecheck + test)

Phase 4: WIRING AUDIT (prevents dead code)
- For every new export: verify it's imported somewhere
- For every new route: verify it's mounted in routes.ts
- For every new schema: verify it has a migration
- For every new error code: verify it's used in a handler
- Run knip to catch orphaned exports
- Fix any dead code found

Phase 5: HANDOFF
- Output: what was built, what was tested, what's ready for d-review
- Update project/future-todos.md with any deferred work discovered
```

### Why TDD in d-code?
Tests first means:
1. The agent thinks about WHAT the code should do before HOW
2. Tests serve as the completion checklist (if all tests pass, the deliverable is done)
3. Phase 3 completion audit has tests to verify against (not just "does a file exist")
4. Dead code is less likely because every export was written to pass a specific test

---

## The Full Workflow (V2)

```
STRATEGY SESSION (1 workspace per initiative)
├── Founder gives context about the initiative
├── /d-decide "Initiative Name"     → raw.md + document.md
├── /d-groom                        → 1-5 project folders with roadmaps
├── /ship                           → PR + merge (docs only)
└── /d-sync                         → update synced/ files

EXECUTION SESSION (1 workspace per project)
├── Read project/roadmap.md
├── /plan-ceo-review on roadmap     → refine scope, lock decisions
├── /plan-eng-review (if code)      → lock architecture
├── Implementation (/d-code, /d-content, or direct coding)
├── /d-review                       → multi-phase review
├── /ship                           → PR + merge to master
└── /d-sync                         → update synced/ files
```

---

## Execution Skills by Domain

**Code execution:** `/d-code` — TDD implementation with completion + wiring audit. The standard.

**Ops execution:** Varies by task. `/d-content` for content generation. Direct coding for campaign setup, tracking integration. `/d-code` when the ops project involves building a feature (e.g., affiliate tracking provider). Reports, metrics analysis — might just be a conversation with code.

**Harness execution:** Can use `/d-code` for building new skills (they're TypeScript). Or direct coding for hooks, CLAUDE.md updates, config changes.

The point: execution skills are tools, not domain boundaries. Use whatever skill fits the project.

---

## The Product Connection: B2C + B2B

Everything we build is also our B2B product. This is the meta-strategy.

**B2C (Life Decisions):** $197/yr. Decisions course + AI exercises. The "self-help that works" product.

**B2B (Business Decisions):** $1,997/yr. The platform that runs your business the way we run ours. Company-as-code. Claude Code as execution layer.

The connection: our ops domain IS the B2B product. When we set up a paid traffic campaign for ourselves, that workflow becomes a template for BD clients. When we create content from strategy docs, that pipeline becomes a feature clients use. The harness itself becomes the product.

This means:
- Free content (methodology, handbook, guides, blog) comes from ops/synced/ files → d-content → content/
- Course content comes from code/source/ strategy docs → d-content → content/courses/
- The platform features come from code/source/ initiatives → d-code → features/
- The harness patterns come from harness/source/ → become BD skill templates

The source-of-truth (decisions/) transforms into both the free content and the paid product. This is why the knowledge base structure matters. It's not just internal tooling. It IS the product.

---

## d-groom: Initiative → Projects

### What It Does

1. **Reads the initiative strategy** (document.md)
2. **Reads the current state:**
   - Domain-specific synced/roadmap.md
   - Recent git log (what shipped)
   - Codebase state (knip, health audit)
   - Content state (what exists vs what should exist)

3. **Generates 1-5 projects** using two scoping dimensions:
   - **Time:** Each project completable in 1-3 agent sessions
   - **Cohesion:** Each project changes one coherent thing

4. **For each project, creates a folder with:**
   ```
   project-[name]/
   ├── roadmap.md          (scope, deliverables, acceptance criteria, files touched)
   └── future-todos.md     (empty — filled during implementation)
   ```
   plan.md is created later by gstack review, not by d-groom.

5. **Validates parallelism:**
   - Warns if projects modify same platform/ files
   - Suggests execution order when dependencies exist
   - Founder reviews and decides which projects run in parallel

### Usage
```
/d-groom                    → generates projects from current initiative
/d-groom code               → generates code projects from code/synced/roadmap.md
/d-groom ops                → generates ops projects
/d-groom harness            → generates harness projects
```

---

## d-decide: One Skill for Decisions

Replaces d-meta + d-input + d-plan + d-auto + d-autodocs.

### Flow
```
Phase 1: FRAME
- What decision needs to be made?
- Read relevant source files and synced files
- What are the options? What are the constraints?

Phase 2: THINK (interactive)
- Ask founder 5-7 questions
- Each question presents 2-3 concrete options (not open-ended)
- Capture raw thinking → save as raw.md (immutable)

Phase 3: WRITE
- Combine frame + thinking into strategy document
- Save as document.md (static once written)

Phase 4: PROPAGATE
- Run d-sync to update affected synced files
- Update domain roadmap if priorities changed
```

Usage: `/d-decide "Free Course Funnel"` or `/d-decide "Should we add a free tier?"`

The name matters: it's "make a decision," not "write a document."

---

## d-content: Strategy → Content

One skill for all content creation. Routes by content type.

```
/d-content blog "Why decisions beat goals"       → blog post from strategy docs
/d-content handbook "How we review code"         → handbook page from synced files
/d-content methodology "Constraint Mapping"      → methodology guide (free content, not course)
/d-content social "Launch announcement"          → social posts across platforms
/d-content clips "Episode 5"                     → clip selection from podcast
```

Each route runs end-to-end:
1. Read source material (strategy docs + synced reference files)
2. Generate content (voice.md compliance built in)
3. **Adversarial quality review** (dispatch subagent to check voice.md compliance, factual accuracy, brand consistency)
4. Save to correct content/ subfolder
5. Commit

---

## Self-Learning: After Every Project

The learning step in the meta-cycle (ROADMAP → IMPLEMENTATION → **LEARN** → NEW ROADMAP) happens through d-sync:

### What d-sync Updates After a Code Project
- `code/synced/coding.md` — new patterns, conventions, utilities discovered
- `code/synced/architecture.md` — new components, data flows, integration points
- `code/synced/roadmap.md` — mark shipped projects, update priorities
- `code/synced/lifedecisions.md` or `businessdecisions.md` — if product scope changed

### What d-sync Updates After an Ops Project
- `ops/synced/company.md` — if positioning or products changed
- `ops/synced/voice.md` — if brand voice evolved
- `ops/synced/roadmap.md` — mark shipped, update priorities
- `ops/synced/deploy.md` — if infrastructure changed

### What d-sync Updates After a Harness Project
- `harness/synced/harness.md` — new skills, hooks, methodology changes
- `harness/synced/hardening.md` — new security rules, incident learnings
- `harness/synced/roadmap.md` — mark shipped, update priorities

### What d-sync Always Updates
- `decisions/INDEX.md` — regenerate the full knowledge base index

### The d-harness Error Loop (Still Active)
On top of d-sync's project-level learning, d-harness still runs on every error:
```
Error → d-harness classifies → creates prevention artifact → error class eliminated
```
Prevention artifacts: Hook > Script > CLAUDE.md rule > Config. Zero recurring errors.

---

## Agent Allocation Model

Realistic starting configuration: **5 concurrent agents** (scale to 10+ as comfortable):

```
CODE (2 agents):
├── Agent 1: Worktree A — Code project from initiative
└── Agent 2: Worktree B — Code project from initiative

OPS (1 agent):
└── Agent 3: Ops project (content, campaign, SEO)

HARNESS (1 agent):
└── Agent 4: Harness project (skill improvement, automation)

ROADMAP (1 agent, on-demand):
└── Agent 5: /d-decide + /d-groom for next initiative
```

### Coordination
- **Code agents:** Conductor worktrees (branch isolation). Sequential PR merge. d-groom warns on file conflicts.
- **Ops agents:** Work on content/ and ops-related code. Low conflict with code agents.
- **Harness agents:** Work on .claude/ and decisions/. 1 at a time.
- **Roadmap agents:** Read-only analysis. No file conflicts.

No Agent Mail. No beads. Worktrees handle isolation. Git-as-handoff between sessions.

---

## What Changes in Root CLAUDE.md

After V2 ships:
1. **"Two Workflows" → "Three Domains"** (code, ops, harness)
2. **Initiative → Project hierarchy** documented
3. **Skill routing table** updated for V2 skill names
4. **Remove:** Beads section, Agent Mail section, d-tasks/d-code methodology bridge
5. **Add:** "After every /ship, run /d-sync" rule
6. **Universal Reference Files** → point to domain/synced/ paths
7. **Session types:** roadmap vs implementation
8. **d-code follows TDD** (tests first, always)

---

## Implementation Plan (Build Before Delete)

### Phase 1: Build New Skills (additive, no deletions)
1. Build d-decide (replaces writing pipeline)
2. Rewrite d-code (TDD + completion + wiring audit)
3. Build d-groom (initiative → projects)
4. Build d-content (strategy → content with adversarial review)
5. Build d-sync (KB engine with lint mode + INDEX.md)
6. Smoke test each skill on a real task

### Phase 2: Knowledge Base Restructure
1. Create decisions/code/source/, decisions/code/synced/
2. Create decisions/ops/source/, decisions/ops/synced/
3. Create decisions/harness/source/, decisions/harness/synced/
4. Move existing strategy docs into appropriate domain/source/
5. Move existing reference files into appropriate domain/synced/
6. Move existing company.md → ops/synced/company.md, voice.md → ops/synced/voice.md
7. Run d-sync to verify all synced files are current
8. Generate INDEX.md
9. Update all CLAUDE.md references to new paths

### Phase 3: Clean House (delete after replacements work)
1. Delete deprecated skills (15+ skills)
2. Run knip, fix all dead exports and orphaned code
3. Update root CLAUDE.md for V2 (remove beads, Agent Mail, old skill routing)

### Phase 4: Harness Improvements
1. Add knip/dead-code check to d-review mechanical phase
2. Add wiring verification to Stop hook (warn-only)
3. Wire d-sync to run automatically after /ship
4. Set up /d-sync lint as weekly scheduled agent

### Phase 5: First Full Cycle
1. Run /d-decide for one initiative per domain
2. Run /d-groom to generate projects
3. Run 5 concurrent workspaces (2 code + 1 ops + 1 harness + 1 roadmap)
4. After all projects ship, verify d-sync updated synced files
5. Learn. Adjust. Repeat.

### Rollback Strategy
Each phase is a separate PR. Revert any phase independently.
- Phase 1: additive only (zero risk)
- Phase 2: folder moves (revert = move back)
- Phase 3: deletions (revert = restore from git)

---

## What Stays the Same

Validated V1 patterns, unchanged:
- **Three-layer context architecture** (folder CLAUDE.md → synced files → source docs)
- **Folder CLAUDE.md pattern** (auto-loaded per directory, auto-updated footers)
- **Build Order** (CLAUDE.md → schema → errors → env → tests → code → pages)
- **Seven Files** (env, errors, schema, routes, responses, permissions, analytics)
- **TypeScript hooks on Bun** (no bash/jq)
- **Batch at Stop** (not per-edit)
- **Error feedback loop** (d-harness)
- **Review chain** (d-autoreview with d-review as flagship)
- **Skills-as-product** (methodology steps = Claude skills = BD product)
- **gstack tools** (office-hours, plan reviews, ship, qa, browse)

---

## Execution Workflow Summary

```
STRATEGY SESSION (1 workspace per initiative)
├── Founder context + /d-decide → raw.md + document.md
├── /d-groom → 1-5 project folders with roadmaps
├── /ship → PR + merge (docs only)
└── /d-sync → update synced files

EXECUTION SESSION (1 workspace per project)
├── Read project/roadmap.md
├── /plan-ceo-review on roadmap → refine, lock scope
├── Implementation (d-code / d-content / direct coding)
├── /d-review
├── /ship → PR + merge to master
└── /d-sync → update synced files
```

Both session types finish with PR + merge. Both trigger d-sync. The cycle is: STRATEGY → EXECUTION → LEARN (d-sync) → NEW STRATEGY.

Every new session must declare itself: STRATEGY or EXECUTION. The CLAUDE.md routing table tells the agent which one based on context.

---

## Known Risks

1. **gstack dependency:** Planning workflow depends on external framework. Mitigation: installed locally, actively maintained, forkable. Accepted risk.
2. **d-sync output quality:** LLM-generated sync may drift. Mitigation: >50% change = WARN, human reviews PRs, all in git.
3. **Merge conflicts at scale:** 4+ agents → occasional platform file conflicts. Mitigation: sequential PR merge, d-groom warns, resolution is ~5 min.
4. **Folder restructure churn:** Moving to ops/code/harness breaks all references. Mitigation: Phase 2 is dedicated PR, systematic find/replace.
5. **Cost:** 5-11 concurrent agents is real money. Start with 5, scale when justified by throughput.

---

## Migration Mapping: Existing Folders → Domains

### → decisions/ops/source/

| Old Path | New Path | Rationale |
|---|---|---|
| 00-general/ | ops/source/general-strategy/ | Company-level roadmap and 5-year vision. General business strategy = ops. Keep roadmap-phase*.md as historical reference. |
| 01-business-model/ | ops/source/business-model/ | Business model, pricing, distribution = ops. |
| 02-manifesto/ | ops/source/manifesto/ | Brand manifesto, positioning = ops. |
| 07-social-media-setup/ | ops/source/social-media-setup/ | Social channels = ops. |
| 08-short-video-viral-strategy/ | ops/source/short-video-strategy/ | Content distribution pipeline = ops. |
| 09-knowledge-base-strategy/ | ops/source/knowledge-base-strategy/ | Knowledge base design = ops (it's about how we publish, not what we build). |
| 11-website-seo/ | ops/source/website-seo/ | SEO/GEO strategy = ops. |

### → decisions/code/source/

| Old Path | New Path | Rationale |
|---|---|---|
| 11-email-auth-payments/ | code/source/email-auth-payments/ | Production infrastructure (auth, payments, email) = code. |
| 12-courses-ux-upgrade/ | code/source/courses-ux-upgrade/ | Product UX = code. |
| lifedecisions/ | code/source/lifedecisions/ | B2C product strategy and PRDs = code. Subfolder structure (03-methodology, 04-course-outline, etc.) becomes nested initiatives. |
| businessdecisions/ | code/source/businessdecisions/ | B2B product strategy and PRDs = code. |

### → decisions/harness/source/

| Old Path | New Path | Rationale |
|---|---|---|
| 10-engineering-automation/ | harness/source/engineering-automation/ | CI/CD, automation, scheduled agents = harness. |
| 14-harness/ | harness/source/harness-v2/ | This document. |

### File Cleanup During Migration

- **meta.md, input.md:** Delete from all folders. V2 only uses raw.md + document.md. These files were intermediate artifacts from the d-meta/d-input pipeline that no longer exists.
- **CLAUDE.md in subfolders:** Keep. They're auto-updated by the Stop hook. Update paths in their content.
- **001-architecture.md at decisions/ root:** Move to code/synced/architecture-deep.md (it's a derived reference file, deeper than the compact architecture.md).
- **Number prefixes (00-, 01-, 07-, etc.):** Drop them. New folder names are descriptive, not numbered. Order comes from the INDEX.md, not from filesystem sorting.

### Universal Reference Files → Synced

| Current Location | New Location |
|---|---|
| decisions/architecture.md | decisions/code/synced/architecture.md |
| decisions/coding.md | decisions/code/synced/coding.md |
| decisions/design.md | decisions/code/synced/design.md |
| decisions/lifedecisions.md | decisions/code/synced/lifedecisions.md |
| decisions/businessdecisions.md | decisions/code/synced/businessdecisions.md |
| decisions/company.md | decisions/ops/synced/company.md |
| decisions/voice.md | decisions/ops/synced/voice.md |
| decisions/deploy.md | decisions/ops/synced/deploy.md |
| decisions/roadmap.md | Split: code/synced/roadmap.md + ops/synced/roadmap.md + harness/synced/roadmap.md |
| decisions/harness.md | decisions/harness/synced/harness.md |
| decisions/hardening.md | decisions/harness/synced/hardening.md |
| decisions/001-architecture.md | decisions/code/synced/architecture-deep.md |

---

## Open Questions

1. **Content as build artifact:** Should content/ be generated from decisions/ source docs? (d-content generates, content/ becomes output). Needs experimentation.
2. **d-code multi-agent:** Can Phase 2 (implementation) spawn sub-agents for independent deliverables? Deferred until d-code v1 proves the pattern.
3. **Workspace awareness:** Conductor workspaces can't see each other. Git-as-handoff works but isn't aware. Unsolved at tool level.

---

## Success Criteria

V2 is done when:
1. `/d-groom` generates 1-5 projects from an initiative strategy
2. Each project runs in its own workspace and finishes with PR + merge
3. `/d-code` follows TDD (tests first) AND verifies completion AND checks wiring
4. Knip reports zero dead exports after a coding session
5. `/d-sync` auto-updates synced files after every project merge
6. decisions/ is organized into ops/code/harness with source/synced
7. Root CLAUDE.md reflects the three-domain model
8. First full STRATEGY → EXECUTION → LEARN cycle completed across all domains

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 2 | CLEAR | Run 1: SELECTIVE EXPANSION, 6 proposals, 5 accepted. Run 2: HOLD SCOPE, 0 critical gaps. |
| Outside Voice | subagent | Independent 2nd opinion | 3 | ISSUES (resolved) | Run 1-2: plan scope, d-sync risk. Run 3 (eng): 10 findings, 5 tensions resolved by founder. |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 13 issues found, 0 critical gaps, 0 unresolved. Major scope changes: d-sync dropped, d-decide dropped, domain renamed product/ops/harness. |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | -- | -- |

- **CROSS-MODEL:** Outside voice (eng run) raised 10 findings. 5 substantive tensions presented to founder: roadmap discovery (dismissed — agents work per-domain), company.md bloat (kept unified, better subheadlines), beads replacement (ephemeral checklist sufficient), d-content feedback loop (auto-fix max 2 cycles), migration plan (not needed, solo dev). All resolved.
- **UNRESOLVED:** 0
- **VERDICT:** CEO + ENG CLEARED. Plan significantly revised during eng review (d-sync dropped, d-decide dropped, domain renamed, humantasks.md added, vision.md/market.md per domain added). See implementation plan file for final spec.
