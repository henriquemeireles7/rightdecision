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
- beads CLI installed (`bd` command available)
- `.beads/` initialized in project root (`brinit`)
- A completed document at `decisions/NN-name/document.md`

## Steps

### Step 1: Read the Document + Context
- Read the target `document.md` fully
- Read root CLAUDE.md (for build order, rules, seven key files)
- Read `decisions/coding.md` (for patterns, TDD methodology)
- Read all relevant folder CLAUDE.md files (for import maps, recipes)
- List existing beads: `brlist --json` (avoid duplicating work)

### Step 2: Create the Epic
```sh
brcreate "Epic: [Document Title]" -t epic -p 1 --description="[1-2 sentence summary]"
```
This is the parent — all tasks hang off this epic.

### Step 3: First Pass — Extract All Tasks
For each section of the document, identify discrete implementation tasks.
Each task MUST include:
- **Title:** Action verb + what (e.g., "Create purchases table schema")
- **Description** with ALL of these:
  - What to build (the deliverable)
  - WHY it matters (from the document context)
  - Which files to create/modify (specific paths)
  - Which Build Order step this falls in (1-8)
  - Which CLAUDE.md recipes/imports to use
  - Acceptance criteria (how to verify it works)
  - Dependencies (which beads must be done first)
- **Priority:** 1 (critical) to 5 (nice-to-have)
- **Labels:** One of: schema, feature, platform, provider, test, page, config

Create each task:
```sh
brcreate "Task title" -t task -p <priority> \
  --depends-on <parent-epic-id> \
  --label <label> \
  --description="<full description>"
```

Link dependencies between tasks:
```sh
brdep add <blocking-task-id> <blocked-task-id>
```

### Step 4: Second Pass — Fill Gaps
- Run `brdep tree <epic-id>` to visualize the full graph
- Ask: "Can an agent complete task X without any other context?"
- If no → either split the task or enrich the description
- Ask: "Are there missing intermediate tasks?" (e.g., schema before routes)
- Check Build Order compliance: schema tasks before feature tasks, tests before code

### Step 5: Third Pass — Dependency Audit
- Run `brready --json` — does the first batch of ready tasks make sense?
- Walk the dependency chain: if I complete all ready tasks and close them, does the next `brready` batch make sense?
- Fix any circular dependencies or missing links
- Ensure test tasks depend on their corresponding implementation tasks

### Step 6: Adversarial Review
Run codex adversarial review on beads vs plan:
- "Read document.md. Read `brlist --json`. Report: (1) tasks in the document not captured as beads, (2) beads that don't map to anything in the document, (3) beads with insufficient context for cold implementation, (4) dependency ordering issues"
- Create additional beads for any gaps found
- Run another round of beads creation if codex found gaps

### Step 7: Enrichment Pass — Make Beads Self-Describing
For EACH bead, run `brshow <id>` and verify the description answers:
1. What files to create/modify? (exact paths)
2. What imports to use? (from CLAUDE.md import maps)
3. What recipe to follow? (from CLAUDE.md recipes)
4. What tests to write? (specific test cases)
5. What does "done" look like? (acceptance criteria)

Update beads that need more context:
```sh
brupdate <id> --description="<enriched description>"
```

A bead is self-describing when a new agent can read ONLY the bead + the folder's CLAUDE.md and implement it without asking questions.

### Step 8: Final Verification
- `brlist --json` — review total task count
- `brready --json` — first batch makes sense
- `brdep tree <epic-id>` — no orphans, clean hierarchy
- Report to user: "Created X beads from [document]. Y are ready to start. Run /d-code to begin implementation."

## Rules
- NEVER create beads that require reading the original document to understand — beads are self-describing
- NEVER create implementation code — beads are plans, not code
- ALWAYS include file paths, imports, and recipes in bead descriptions
- ALWAYS respect Build Order: CLAUDE.md → schema → errors → env → tests → code → pages
- Each bead should be completable in ONE agent session
- Use `--json` flag for machine-readable output when parsing
- Run minimum 3 passes, maximum 5 — more passes = better beads
- If codex review finds gaps, create beads for them immediately
- Beads include all necessary context but are NOT full implementations — they tell the coder WHAT to build, WHERE, and HOW to verify, but don't write the code
