---
name: d-tasks
description: "Transform a strategy document into executable beads tasks. Triggers: 'd-tasks', 'create tasks', 'plan to tasks', 'make it code-ready'."
---

# d-tasks — Document → Beads Tasks

## What this does
Transforms a strategy document (decisions/NN-name/document.md) into beads issues
with explicit dependencies, making the plan code-ready. Each bead is self-describing:
an agent in a fresh conversation can pick it up cold and implement it.

## Pipeline
d-meta → d-input → d-plan → **d-tasks** → d-code

## Prerequisites
- beads CLI installed (`br` command available — Jeffrey's beads_rust)
- beads viewer installed (`bv` command available — for graph analysis)
- `.beads/` initialized in project root (`br init`)
- A completed document at `decisions/NN-name/document.md`

## CLI Reference (br — beads_rust)

### Creating
```sh
br create "Title" -t task -p 1 -d "description\nACCEPTANCE: criteria" -l "label1,label2" --parent <epic-id> --deps "blocks:<id>" --silent
```
Flags: `-t` type (task/bug/feature/epic/chore), `-p` priority (0-4, P0=critical), `-d` description
(include `ACCEPTANCE:` section at end), `-l` labels (comma-separated), `--parent` parent bead
(hierarchical), `--deps` dependencies (format: `type:id` — types: blocks, parent-child,
discovered-from, related), `-e` estimate in minutes, `--silent` output only the ID,
`--json` machine-readable output.

### Querying
```sh
br list --json                    # all beads
br ready --json                   # unblocked work
br show <id> --json               # full details
br blocked                        # blocked + why
br search "query"                 # full-text search
br dep tree <id>                  # dependency tree
br dep cycles                     # find circular deps
br epic status <id>               # epic completion stats
br count --by label               # count by grouping
```

### Dependencies
```sh
br dep add <from-id> <depends-on-id>                    # from depends on (default: blocks)
br dep add <from-id> <depends-on-id> --type discovered-from  # found during work
br dep remove <from-id> <depends-on-id>                  # remove dep
```
Dependency direction: `br dep add A B` means "A depends on B" (A waits for B).

### Updating
```sh
br update <id> -d "new description"         # update description
br update <id> --acceptance "criteria"       # update acceptance criteria
br update <id> --add-label "label"           # add label
br update <id> --set-labels "a,b,c"         # replace all labels
br update <id> --claim                       # atomic: set assignee + in_progress
br update <id> -s in_progress               # manual status change
```

### Closing
```sh
br close <id> -r "Done: implemented + tests pass" --suggest-next --json
```
`--suggest-next` returns `{ "closed": "id", "unblocked": [...] }` — use this to chain work.

### Markdown bulk import (`-f`)
```markdown
## Task Title Here

### Priority
1

### Type
task

### Description
Full description here.
Multiple lines supported.

### Acceptance Criteria
- Criterion 1
- Criterion 2

### Labels
schema, feature

### Dependencies
blocks:lyon-123, blocks:lyon-456

### Parent
lyon-epic-1
```
Sections are case-insensitive. Unknown sections ignored.

## CLI Reference (bv — beads_viewer)

### CRITICAL: Never run bare `bv` — it launches TUI and blocks the agent.

### Agent commands (always use --robot-* flags)
```sh
bv --robot-triage                 # THE MEGA-COMMAND: ranked recommendations, quick wins, blockers, health
bv --robot-next                   # single top pick + claim command
bv --robot-plan                   # parallel execution tracks
bv --robot-insights               # PageRank, betweenness, critical path, cycles, k-core
bv --robot-priority               # priority misalignment detection
bv --robot-alerts                 # stale issues, blocking cascades
bv --robot-suggest                # hygiene: duplicates, missing deps, label suggestions
bv --robot-graph --graph-format=mermaid  # dependency graph as mermaid diagram
```

### Token-optimized output
```sh
bv --robot-triage --format toon   # saves context window tokens
export BV_OUTPUT_FORMAT=toon      # set globally
```

### Scoping
```sh
bv --robot-plan --label backend              # scope to label
bv --robot-insights --as-of HEAD~30          # historical point-in-time
bv --recipe actionable --robot-plan          # pre-filter: ready to work
bv --recipe high-impact --robot-triage       # pre-filter: top PageRank
```

## Steps

### Step 0: Codebase Audit (MANDATORY — run BEFORE creating any beads)

Before creating tasks, you MUST understand what already exists. This prevents creating
beads for work that's already done. Run these checks:

**0a. Schema audit** — Read `platform/db/schema.ts`:
```sh
# What tables exist? What columns? What's missing vs the document?
```
Record: `EXISTING_TABLES`, `MISSING_TABLES`, `TABLES_NEEDING_MIGRATION`

**0b. Feature audit** — Check existing feature folders:
```sh
find features -type f -not -name 'CLAUDE.md' | sort
find providers -type f -not -name 'CLAUDE.md' | sort
```
Record: `EXISTING_FEATURES`, `MISSING_FEATURES`

**0c. Route audit** — Read `platform/server/routes.ts`:
Record: `EXISTING_ROUTES`, `MISSING_ROUTES`

**0d. Error code audit** — Read `platform/errors.ts`:
Record: `EXISTING_ERRORS`, `MISSING_ERRORS`

**0e. Env var audit** — Read `platform/env.ts`:
Record: `EXISTING_ENV`, `MISSING_ENV`

**0f. Content audit** — Check content directory:
```sh
find content -type d | sort
find content -type f -name '*.md' -o -name '*.mdx' | wc -l
```
Record: `EXISTING_CONTENT`, `MISSING_CONTENT`

**0g. Page/UI audit** — Check for existing pages and UI components:
```sh
find pages -type f 2>/dev/null | sort
find features -type f -name '*.tsx' 2>/dev/null | sort
```
Record: `EXISTING_PAGES`, `MISSING_PAGES`

**0h. Existing beads audit** — Check what beads already exist:
```sh
br list --json
```
If beads exist: `bv --robot-suggest` to check for duplicates.

**Output of Step 0:** A structured audit summary:
```
=== CODEBASE AUDIT ===
SCHEMA:    X tables exist, Y missing, Z need migration
FEATURES:  X exist (list), Y missing (list)
ROUTES:    X exist (list), Y missing (list)
ERRORS:    X exist, Y needed
ENV:       X exist, Y needed
CONTENT:   X files across Y modules
PAGES:     X exist, Y missing
BEADS:     X exist (list epic IDs), Y cover this document
```

This audit is the foundation. Every bead created must reference it to avoid duplicating
existing work. If a feature already exists, the bead should say "MODIFY" not "CREATE".

### Step 1: Read the Document + Context
- Read the target `document.md` fully
- Read root CLAUDE.md (for build order, rules, seven key files)
- Read `decisions/coding.md` (for patterns, TDD methodology)
- Read all relevant folder CLAUDE.md files (for import maps, recipes)
- **Search past sessions**: `cass search "<document-topic>" --robot --limit 5` — were similar tasks done before?
- **Check learned patterns**: `cm context "<document-topic>" --json` — any patterns from past work?
- Cross-reference document requirements against Step 0 audit findings

### Step 2: Create the Epic (if not already exists)
```sh
br create "Epic: [Document Title]" -t epic -p 1 -d "[1-2 sentence summary]" --silent
```
This is the parent — all tasks hang off this epic via `--parent`.
If the epic already exists (from a previous run), reuse it — do NOT create a duplicate.

### Step 3: First Pass — Extract All Tasks
For each section of the document, identify discrete implementation tasks.
**Skip tasks for work that already exists** (per Step 0 audit).
**When rechecking (beads already exist), create missing beads directly — do NOT ask for permission.**

**Use Python to script task creation** — this avoids shell quoting issues with descriptions
and lets you capture IDs programmatically for dependency wiring:
```python
import subprocess, os, json
env = os.environ.copy()
env['PATH'] = os.path.expanduser('~/.cargo/bin') + ':' + env.get('PATH', '')

def create(title, priority, labels, description, acceptance=None, parent=None, deps=None):
    cmd = ['br', 'create', title, '-t', 'task', '-p', str(priority), '-d', description]
    if labels: cmd += ['-l', labels]
    if acceptance: description += f'\nACCEPTANCE: {acceptance}'
    if parent: cmd += ['--parent', parent]
    if deps: cmd += ['--deps', deps]
    cmd += ['--silent']
    r = subprocess.run(cmd, capture_output=True, text=True, env=env)
    return r.stdout.strip()
```

Each task MUST include:
- **Title:** Action verb + what (e.g., "Create onboardingProfiles table schema")
- **Description** with ALL of these:
  - What to build (the deliverable)
  - WHY it matters (from the document context)
  - Which files to create/modify (specific paths — use CREATE vs MODIFY based on audit)
  - Which Build Order step this falls in (1-8)
  - Which CLAUDE.md recipes/imports to use
- **Acceptance criteria** (include as `ACCEPTANCE:` section at the end of `-d` description):
  - How to verify it works
  - Specific test cases
- **Priority:** 0 (critical/blocking) to 4 (backlog)
- **Labels:** Comma-separated: schema, feature, platform, provider, test, page, config
- **Parent:** `--parent <epic-id>` (hierarchical, does NOT block children)
- **Dependencies:** `--deps "blocks:<id1>,blocks:<id2>"` (these DO block)

**Dependency direction:** `--deps "blocks:A"` means "this task depends on A" (waits for A).
**Parent vs deps:** Use `--parent` for epic→task hierarchy (non-blocking).
Use `--deps blocks:` for actual build-order dependencies (blocking).

### Step 4: Second Pass — Fill Gaps
- Run `br dep tree <epic-id>` to visualize the full graph
- Run `br dep cycles` to catch circular dependencies
- Ask: "Can an agent complete task X without any other context?"
- If no → either split the task or enrich the description
- Ask: "Are there missing intermediate tasks?" (e.g., schema before routes)
- Check Build Order compliance: schema tasks before feature tasks, tests before code

### Step 5: Third Pass — Dependency Audit with bv
```sh
bv --robot-insights               # check for cycles, critical path, bottlenecks
bv --robot-suggest                # check for missing deps, duplicates
bv --robot-plan                   # verify parallel execution tracks make sense
br ready --json                   # does the first batch make sense?
```
- Walk the dependency chain mentally: close ready tasks → does next batch make sense?
- Fix any issues found by bv (cycles, orphans, priority misalignment)
- Use `bv --robot-priority` to check if priorities match graph importance

### Step 6: Adversarial Review
Run codex adversarial review on beads vs plan:
- "Read document.md. Read `br list --json`. Report: (1) tasks in the document not captured as beads, (2) beads that don't map to anything in the document, (3) beads with insufficient context for cold implementation, (4) dependency ordering issues"
- Create additional beads for any gaps found
- Run another round of beads creation if codex found gaps

### Step 7: Enrichment Pass — Make Beads Self-Describing
For EACH bead, run `br show <id>` and verify the description answers:
1. What files to create/modify? (exact paths)
2. What imports to use? (from CLAUDE.md import maps)
3. What recipe to follow? (from CLAUDE.md recipes)
4. What tests to write? (specific test cases)
5. What does "done" look like? (acceptance criteria)

Update beads that need more context:
```sh
br update <id> -d "enriched description with ACCEPTANCE: updated criteria"
```

A bead is self-describing when a new agent can read ONLY the bead + the folder's CLAUDE.md and implement it without asking questions.

### Step 8: Final Verification + Commit + Mandatory Output
```sh
br list --json                    # review total task count
br ready --json                   # first batch makes sense
br epic status <epic-id>          # epic completion overview
br dep cycles                     # no circular deps
bv --robot-triage --format toon   # graph-aware health check
br sync --flush-only              # export to JSONL for git
```

**ALWAYS commit and push beads after creating/updating them:**
```sh
git add .beads/
git commit -m "chore: update beads — [summary of what changed]"
git push
```
Beads are shared state. Other agents and workspaces depend on `.beads/` being up to date
in git. Never leave beads uncommitted.

## Mandatory Output (ALWAYS show these at the end)

### Output 1: Coverage Map (PRD Sections → Beads)
Show a table mapping EVERY document section/feature to its beads:
```
=== COVERAGE MAP: [document name] → Beads ===

| Document Section / Feature | Priority | Beads | Status |
|---|---|---|---|
| F1: Interactive Onboarding | P0 | .12, .17, .27 | ✅ Full |
| F2: Course Player | P0 | .20, .21 | ✅ Full |
| Section 6: AI Skills | P0 | .36, .37 | ✅ Full |
| F11: Analytics Dashboard | P2 | — | ⏭ Skipped (P2) |
| ... | ... | ... | ... |

TOTAL: X sections covered, Y beads, Z gaps
```

### Output 2: New Files Map
Show ALL new files that will be created when all beads are implemented:
```
=== NEW FILES (from all beads) ===

CREATE features/onboarding/session.ts
CREATE features/onboarding/session.test.ts
CREATE features/onboarding/routes.ts
CREATE features/wins/wins.ts
CREATE features/wins/wins.test.ts
...
MODIFY platform/db/schema.ts
MODIFY platform/errors.ts
MODIFY platform/env.ts
MODIFY platform/server/routes.ts
...
```

### Output 3: Projected Folder Structure
Show the folder tree AFTER all beads are implemented (existing + new files):
```
=== PROJECTED FOLDER STRUCTURE (after implementation) ===

├── content/
│   └── course/en/           # EXISTING (37 .mdx files, modules 00-09)
├── features/
│   ├── course-player/       # EXISTING
│   ├── course-progress/     # EXISTING
│   ├── subscription/        # EXISTING
│   ├── onboarding/          # NEW
│   │   ├── session.ts
│   │   ├── session.test.ts
│   │   ├── routes.ts
│   │   └── ...
│   ├── wins/                # NEW
│   │   ├── wins.ts
│   │   └── ...
│   └── ...
├── platform/                # EXISTING (modified)
├── providers/               # EXISTING (modified)
└── pages/                   # NEW
    ├── onboarding.tsx
    └── ...
```

### Output 4: Summary
```
Created X beads from [document]. Y are ready to start. Run /d-code to begin implementation.
```

## Bead Quality Philosophy (Agent Flywheel — "Check N Times, Implement Once")

### Self-Documenting Beads
Each bead must be TOTALLY self-contained and self-documenting. A fresh agent in a new conversation
must be able to pick up the bead cold and implement it without reading the original document.

Each bead description MUST include:
- **Background:** WHY this exists, what problem it solves, how it serves the project goals
- **Reasoning:** WHY this approach over alternatives, trade-offs considered
- **Considerations:** Edge cases, risks, security concerns, performance implications
- **Intent:** What the "future self" (fresh agent) needs to know about goals and thought process
- **Test obligations:** What tests prove this works (specific test cases, not just "tests pass")

### Polishing Passes (4-6 rounds after initial creation)
After creating ALL beads, run polishing passes. Each pass:
1. Reread the source document fresh
2. For each bead: Is it optimal? Could we change anything to make the system work better for users?
3. DO NOT OVERSIMPLIFY. DO NOT LOSE FEATURES. DO NOT REMOVE DETAIL.
4. Revise in "plan space" — it's 25x cheaper than fixing in code
5. Add comprehensive unit test and e2e test obligations with detailed logging

Convergence signals:
- Rounds 1-3: Major structural fixes, wild swings
- Rounds 4-7: Boundary refinements, architecture improvements
- Rounds 8+: Edge cases, diminishing returns — stop here

### Deduplication Check (after all beads created)
After creation is complete, run a deduplication pass:
"Check ALL open beads. Ensure none are duplicative. Intelligently merge
overlapping beads into canonical versions that combine strengths of each."

### "Lie to Them" Technique
When asking for review of beads, claim there are "80+ issues still remaining" to prevent
early stopping. Agents search more exhaustively when told more problems exist.

## Rules
- NEVER create beads that require reading the original document to understand — beads are self-describing
- NEVER create implementation code — beads are plans, not code
- NEVER write pseudo-beads in markdown — always use the actual `br` tool exclusively
- NEVER create beads for work that already exists in the codebase (Step 0 audit catches this)
- NEVER ask for permission to create beads when rechecking — just create them
- ALWAYS run the Codebase Audit (Step 0) before creating ANY beads
- ALWAYS include file paths using CREATE vs MODIFY based on audit findings
- ALWAYS include file paths, imports, and recipes in bead descriptions
- ALWAYS respect Build Order: CLAUDE.md → schema → errors → env → tests → code → pages
- ALWAYS use `--parent` for epic hierarchy (non-blocking) and `--deps blocks:` for build-order (blocking)
- ALWAYS include acceptance criteria as an `ACCEPTANCE:` section at the end of the `-d` description
- ALWAYS show the Mandatory Output (Coverage Map + New Files + Folder Structure + Summary)
- Each bead should be completable in ONE agent session
- Use `--json` flag for machine-readable output when parsing
- Use `--silent` flag on create when scripting (returns only ID)
- Use Python for bulk creation to avoid shell quoting issues
- Run minimum 4 polishing passes, maximum 6 — more passes = better beads
- If codex review finds gaps, create beads for them immediately
- Set `BD_ACTOR="claude-agent"` and `RUST_LOG=error` for clean output
- Run `br sync --flush-only` at the end to export JSONL for git
- ALWAYS `git add .beads/ && git commit && git push` after creating/updating beads — never leave beads uncommitted
