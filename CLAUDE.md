# Right Decision — Agent Instructions

## What is this
Decisions is an infobusiness + software company. Solo developer + AI agents.
Stack: Bun, Hono, Preact, Drizzle, Zod, PostgreSQL (Railway), Better Auth, Stripe, Tailwind.
Architecture: Domain-Spec Architecture (DSA). Every folder with code has a nested CLAUDE.md.

## Product Context
The Right Decision: $197/year platform teaching the one decision that matters + AI to decompose it.
ICP: Women 30-50 who have "done the work" but are stuck. Anti-self-help positioning.
For full context read decisions/company.md. For brand voice read decisions/voice.md.

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

## Commands
- bun run check — lint + typecheck + test (run before every commit)
- bun run dev — start dev server (hot reload)
- bun test — run tests
- bun run lint — fix lint + format issues

## CLI & Tooling Best Practices
- Use rg (ripgrep) instead of grep — faster, fewer tokens, Rust-based.
- Use fd instead of find — faster file discovery.
- Use bat instead of cat — syntax highlighting for file inspection.
- Use delta/difft for git diffs — difft understands TypeScript AST, delta gives side-by-side.
- Use tokei for codebase stats — quick line counts by language.
- Use dust for directory sizes — find bloat that wastes search time.
- Use Bun for everything — never npm/yarn/npx. Always bunx, bun test, bun run.
- Use Biome for everything — never ESLint/Prettier. Single tool for format+lint+imports.
- Never run bun run dev inside Claude Code sessions — use a separate terminal/tmux pane.
- Hooks run as TypeScript on Bun (no bash/jq dependency).

## Hooks System (auto-enforced)
Hooks are defined in .claude/settings.json and run automatically:
- **PreToolUse:** block dangerous commands, protect .env/bun.lock/secrets, protect config files (biome.json, tsconfig.json — fix code, don't weaken config).
- **PostToolUse:** warn on console.log in production code after edits.
- **Stop:** batch Biome format+lint + TypeScript typecheck on all changed files (runs once at end, not per-edit). Auto-updates nested CLAUDE.md footers for changed directories. macOS notification when done.
- **SessionStart (compact):** re-inject stack rules after context compaction.

## Commit & Push Discipline
When work is done and the user confirms, run `bun run check` (lint + typecheck + test), then commit and push. Do not commit after every edit — commit at logical completion points.

## Universal Reference Files (decisions/*.md)
Read the files that match your task. Read as many as needed:
- Customer-facing content, ICP → decisions/company.md
- Roadmap, priorities, "what's next" → decisions/roadmap.md
- Content for end users (copy, courses, emails) → decisions/voice.md
- Coding (features, platform, providers) → decisions/coding.md
- Visual/UI/CSS/components → decisions/design.md
- Deploy, CI/CD, infrastructure → decisions/deploy.md
- Life Decisions product (B2C) → decisions/lifedecisions.md
- Business Decisions product (B2B) → decisions/businessdecisions.md
- Improving the AI harness → decisions/harness.md

Each folder's CLAUDE.md has Critical Rules, Import Maps, and Recipes specific to that module.

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

## Decisions Folder (Strategy Documents)
All strategy documents live in decisions/. See decisions/roadmap.md for current priorities.
Full document index: decisions/00-general/document.md
Document pipeline: d-meta (design template) → d-input (capture thinking) → d-plan (write document).
Methodology: Meta → Draft → Document. Each phase catches problems before the next.

## Deployment
Railway. Dockerfile deploy. PostgreSQL on Railway.
GitHub: henriquemeireles7. Email: hsameireles@gmail.com.

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
- Strategy document template → invoke d-meta
- Brain dump, capture thinking → invoke d-input
- Write strategy document → invoke d-plan
- Full document pipeline → invoke d-auto
