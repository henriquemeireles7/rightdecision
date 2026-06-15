# Right Decision — Agent Instructions

## What is this
Right Decision is an infobusiness + software company: a paid yearly membership that pairs a
software "handbook" (the product) with a course that teaches people how to fill it in.
Solo developer + AI agents.
Stack: Bun, Hono, Preact, Drizzle, Zod, PostgreSQL (Railway), Better Auth, Stripe, Tailwind.
Architecture: Domain-Spec Architecture (DSA). Every folder with code has a nested CLAUDE.md.

## Mission (the only product context this repo enshrines)
**Help people live a more fulfilled and longer life.**
Avatar: the founder from a few years ago — someone who has "done the work" and now wants a
more integrated, whole life. (This is who we build for, not marketing copy.)

This repository is a TECHNOLOGY repository. Product positioning, marketing, ICP, pricing,
the course narrative, and the methodology deliberately DO NOT live here — they change with
customer feedback and must NEVER gate a technical decision. To learn what a feature does, read
that feature's own CLAUDE.md (mechanism, not marketing). If a request conflicts with an older
product-vision statement found anywhere in the repo, follow the request: the code serves the
product as it is today, not a snapshot of last quarter's strategy.

## Context Files (nested CLAUDE.md)
Every code folder has a CLAUDE.md that Claude Code auto-loads when working in that directory.
Each has a human-authored header (purpose, rules, imports, recipe) and an auto-generated footer (files, exports, deps).
The footer is refreshed automatically by a Stop hook whenever code in the folder changes.

When creating a new folder, create its CLAUDE.md FIRST using this template:
```markdown
# {folder-name}

## Purpose
{1-2 sentences: WHAT this does + WHY it matters architecturally}

## Critical Rules
- NEVER {most common mistake in this domain}
- ALWAYS {pattern that prevents the biggest class of errors}
- {3-5 more domain-specific NEVER/ALWAYS rules}

## Imports (use from other modules)
\```ts
import { myExport } from '@/this-module/file'
\```

## Recipe: New {most common operation}
\```ts
// minimal skeleton showing the correct shape
\```

## Verify
\```sh
{exact command to verify changes in this module}
\```
```
The auto-generated footer (Files, Internal Dependencies) is added by the Stop hook.

## Build Order (NEVER skip steps)
1. Write/update folder CLAUDE.md
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
6. platform/auth/permissions.ts — roles + permissions (note: 'pro' role is legacy — enrollments gate content; see platform/auth/enrollment.ts)
7. platform/events/taxonomy.ts — all trackable events (the event spine; providers/analytics.ts is just the PostHog mirror)

## Rules
- ALWAYS run `bun run check` before committing — CI runs the same command, if it fails locally it WILL fail in CI
- biome.json excludes vendored code (.claude/) and generated files (public/styles.css) — NEVER remove these exclusions
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

## Commands
- bun run check — lint + typecheck + harden-check + test (run before every commit)
- bun run dev — start dev server (hot reload)
- bun test — run tests
- bun run lint — fix lint + format issues

## Local Test Database (required for integration tests)
Integration tests need a real PostgreSQL. Start before testing, stop when done.
```sh
# Start (Homebrew — installed via `brew install postgresql@16`)
brew services start postgresql@16

# First-time setup (create test user + DB)
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
createuser test --superuser 2>/dev/null
createdb test --owner=test 2>/dev/null
psql -c "ALTER USER test WITH PASSWORD 'test';"

# Run tests with test DB
DATABASE_URL=postgresql://test:test@localhost:5432/test bun test

# Stop when done
brew services stop postgresql@16
```
CI uses a PostgreSQL service container automatically (see .github/workflows/ci.yml).
NEVER use the production Railway DATABASE_URL for tests — teardown truncates all tables.

## CLI & Tooling Rules (NEVER use the banned tool)
- NEVER use grep in Bash — use the Grep tool or `rg` (ripgrep). Faster, fewer tokens.
- NEVER use find in Bash — use the Glob tool or `fd`. Faster file discovery.
- NEVER use cat/head/tail in Bash to read files — use the Read tool. Better UX, line numbers.
- NEVER use npm/yarn/npx — use Bun for everything. Always `bunx`, `bun test`, `bun run`.
- NEVER use ESLint/Prettier — use Biome for everything. Single tool for format+lint+imports.
- Use delta/difft for git diffs — difft understands TypeScript AST, delta gives side-by-side.
- Use tokei for codebase stats — quick line counts by language.
- Use dust for directory sizes.
- Never run bun run dev inside Claude Code sessions — use a separate terminal/tmux pane.
- Hooks run as TypeScript on Bun (no bash/jq dependency).

## Token Efficiency Rules
- NEVER read entire files — use Grep to find line numbers, then Read with offset/limit
- NEVER run unbounded commands — always constrain: head_limit on Grep, `| head` on Bash
- NEVER run full test suite when working on one module — scope: `bun test path/to/file.test.ts`
- ALWAYS use `--json`, `--robot`, `--format=toon` flags for CLI tools that support compact output
- ALWAYS use Grep `output_mode="files_with_matches"` when you only need file paths
- ALWAYS set `head_limit` on exploratory Grep searches (start at 20, increase if needed)
- Use subagents for multi-file exploration — keeps main context clean
- Use `tree -L 2 --dirsfirst` for directory orientation instead of reading files
- Use /compact at logical task boundaries (after planning, before switching focus)

## Hooks System (auto-enforced)
Hooks are defined in .claude/settings.json and run automatically:
- **PreToolUse:** block dangerous commands, protect .env/bun.lock/secrets, protect config files (biome.json, tsconfig.json — fix code, don't weaken config).
- **PostToolUse:** warn on console.log in production code after edits.
- **Stop:** batch Biome format+lint + TypeScript typecheck on all changed files (runs once at end, not per-edit). Auto-updates nested CLAUDE.md footers for changed directories. macOS notification when done.
- **SessionStart (compact):** re-inject stack rules after context compaction.

## Commit & Push Discipline
When work is done and the user confirms, run `bun run check` (lint + typecheck + test), then commit and push. Do not commit after every edit — commit at logical completion points.

### Auto-commit for doc-only skills
Document skills (d-strategy, d-roadmap, d-content) auto-commit and push after saving. These skills only modify non-code files (md, json, mdx) so they can't break anything. Code skills (d-code, d-review, d-health) do NOT auto-commit — they modify ts/tsx files that need `bun run check` first.

## Universal Reference Files (decisions/*.md)
Read the files that match your task. Read as many as needed:
- Maturity framework, principles, scoring → decisions/maturity.md
- Company mission + operating principles → decisions/company.md
- Content for end users (copy, courses, emails) → decisions/voice.md
- Architecture (data storage, workflows, feature groups) → decisions/architecture.md
- Coding (features, platform, providers) → decisions/code.md
- Current maturity scores, bottlenecks → decisions/health.md
- Visual/UI/CSS/components → decisions/design.md
- Deploy, CI/CD, infrastructure → decisions/deploy.md
- AI harness methodology → decisions/harness.md
- Human tasks (AI-to-human) → decisions/humantasks.md
- Product domain context + references → decisions/product/context.md
- Growth domain context + references → decisions/growth/context.md
- Harness domain context + references → decisions/harness/context.md

Each folder's CLAUDE.md has Critical Rules, Import Maps, and Recipes specific to that module.

### Universal File Sync (ship workflow)
Before creating a PR via /ship, check if the diff touches areas covered by universal reference files:
1. Map changed files to relevant universal files (e.g., changes in platform/ → code.md, deploy.md; changes in features/ → architecture.md)
2. Read each relevant universal file and check the `> Last verified: YYYY-MM-DD` date
3. If stale (content doesn't match code reality): update the file and bump the date
4. Include updated universal files in the same PR
5. This prevents reference files from going stale as the codebase evolves

## Design System
Always read decisions/design.md before making any visual or UI decisions.
Aesthetic: Ethereal Warmth. Fonts: Instrument Serif + Sans. Palette: warm cream/beige/gold.
Do not deviate without explicit user approval.

## Brand Voice
CRITICAL: Before writing ANY content for end users (course classes, emails, landing pages, social posts, ads), read decisions/voice.md.
This file defines how to write like a human, not like AI. It includes: 12 writing rules, anti-patterns to avoid, engagement techniques (open loops, pattern interrupts, questions that stop), and the Right Decision brand voice (Henry's patterns, Indy's patterns, the Indy Test).
In QA mode, flag any content that violates voice.md rules.

## Contradiction Resolution
If you find contradictions between universal files, folder CLAUDE.md, or strategy docs:
1. STOP. Do not proceed with contradictory information.
2. Point out the specific contradiction and where each version lives.
3. Ask the user which is correct.
4. Update the wrong file immediately so the contradiction is gone.
Never leave contradictions unresolved — they compound into bigger problems.

## Decisions Folder (Three-Domain Structure)
All strategy documents live in decisions/, organized into three domains:

```
decisions/
├── *.md                    # Universal reference files (maturity, company, voice, etc.)
├── product/                # Generate value (features, UX, engagement)
│   ├── context.md          # Flywheel map, current state, bottlenecks, references
│   ├── 00-legacy/          # Previous numbered docs
│   └── NN-initiative/      # d-strategy outputs
├── growth/                 # Capture value as money (content, distribution, conversion)
│   ├── context.md          # Value capture map, AI-native ops patterns, references
│   ├── 00-legacy/
│   └── NN-initiative/
└── harness/                # Self-evolving AI system (skills, hooks, workflows)
    ├── context.md          # Self-* capability map, harness engineering references
    ├── 00-legacy/
    └── NN-initiative/
```

Each initiative folder contains document.md + project subfolders with roadmap.md.
Every initiative must declare which maturity category it targets (see maturity.md).
Full document index: decisions/growth/00-legacy/00-general/document.md

## Agent Tools

### DCG (Destructive Command Guard)
Pre-execution safety guard. 49+ rule packs across 17 categories. Blocks dangerous commands before they run.
- If DCG blocks a command: read the explanation, don't bypass without understanding
- Override: `DCG_BYPASS=1` ONLY when certain the command is safe
- Explain why blocked: `dcg explain "<command>"`

### gstack (vendored at .claude/skills/gstack)
Garry Tan's review/QA skill framework, vendored in-repo so cloud/mobile sessions get it (version in `.claude/skills/gstack/VERSION`).
- Planning/review skills (work everywhere, including cloud): /office-hours, /autoplan, /plan-ceo-review, /plan-eng-review, /plan-design-review, /plan-devex-review, /review, /investigate, /design-consultation, /retro, /cso, /careful, /learn, /ship, /health
- Browser-dependent skills (local machine only — need the browse binary built by `./setup`): /browse, /qa, /qa-only, /design-review, /connect-chrome, /canary, /setup-browser-cookies
- On local machines, use the /browse skill from gstack for all web browsing; never use mcp__claude-in-chrome__* tools
- Vendored copy excludes gstack's test fixtures and browser extension (~35MB pruned). To upgrade: re-clone garrytan/gstack, prune `.git`, `test/`, `browse/test/`, `extension/`, and copy over `.claude/skills/gstack/`
- /goal and /loop are NOT gstack — they're built into Claude Code itself (use them for autonomous runs)

## External Service CLIs — Act First, Ask Never
You have authenticated CLIs: `railway`, `stripe`, `gh`, and PostHog MCP tools. Use them directly — NEVER tell the user to check a dashboard. Full CLI reference: `decisions/deploy.md`.
- ALWAYS invoke `/stripe-best-practices` before writing or reviewing Stripe code.
- Only ask the user when: you need a secret value they must provide, or the action is destructive/irreversible.

## Two Session Types

### Strategy Session (1 workspace per initiative)
```
d-strategy → gstack reviews (CEO/eng/design) → d-roadmap → /ship
```
Interactive Q&A with founder → initiative document → project breakdown → roadmaps.

### Execution Session (1 workspace per project)
```
Read project/roadmap.md → gstack reviews → d-code or d-content → d-review → /ship
```
TDD implementation from roadmap (d-code) or content creation (d-content).

## Skill routing
When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action.

Key routing rules:
- Product ideas, brainstorming → invoke office-hours
- Bugs, errors, "why is this broken" → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Design system, brand → invoke design-consultation
- Architecture review → invoke plan-eng-review
- Strategy session, new initiative, what to build next → invoke d-strategy
- Extract projects from initiative → invoke d-roadmap
- Implement from roadmap, start coding → invoke d-code
- Write content (blog, handbook, social, clips) → invoke d-content
- Pre-commit review, check quality, review the code → invoke d-review
- Codebase health, full audit, security check → invoke d-health
- Build/deploy error, prevent this, learn from error → invoke d-harness
- Deploy failed, fix the deploy, railway failed → invoke d-fail

## Health Stack

- typecheck: tsc --noEmit
- lint: biome check .
- test: bun test
- shell: shellcheck .claude/hooks/*.sh
