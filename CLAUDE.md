# Right Decision — Agent Instructions

## What is this
Decisions is an infobusiness + software company. Solo developer + AI agents.
Stack: Bun, Hono, Preact, Drizzle, Zod, PostgreSQL (Railway), Better Auth, Stripe, Tailwind.
Architecture: Domain-Spec Architecture (DSA). Every folder with code has a SPEC.md.

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

## Commands
- bun run check — lint + typecheck + test (run before every commit)
- bun run dev — start dev server (hot reload)
- bun test — run tests
- bun run lint — fix lint + format issues

## CLI & Tooling Best Practices
- Use rg (ripgrep) instead of grep — faster, fewer tokens, Rust-based.
- Use fd instead of find — faster file discovery.
- Use Bun for everything — never npm/yarn/npx. Always bunx, bun test, bun run.
- Use Biome for everything — never ESLint/Prettier. Single tool for format+lint+imports.
- Never run bun run dev inside Claude Code sessions — use a separate terminal/tmux pane.
- Hooks run as TypeScript on Bun (no bash/jq dependency).

## Hooks System (auto-enforced)
Hooks are defined in .claude/settings.json and run automatically:
- **PreToolUse:** block dangerous commands, protect .env/bun.lock/secrets, protect config files (biome.json, tsconfig.json — fix code, don't weaken config).
- **PostToolUse:** warn on console.log in production code after edits.
- **Stop:** batch Biome format+lint + TypeScript typecheck on all changed files (runs once at end, not per-edit). macOS notification when done.
- **SessionStart (compact):** re-inject stack rules after context compaction.

## Commit & Push Discipline
When work is done and the user confirms, run `bun run check` (lint + typecheck + test), then commit and push. Do not commit after every edit — commit at logical completion points.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
Aesthetic: Ethereal Warmth. Fonts: Instrument Serif + Sans. Palette: warm cream/beige/gold.
Do not deviate without explicit user approval.

## Human Communication
CRITICAL: Before writing ANY content for end users (course classes, emails, landing pages, social posts, ads), read decisions/human.md.
This file defines how to write like a human, not like AI. It includes: 12 writing rules, anti-patterns to avoid, engagement techniques (open loops, pattern interrupts, questions that stop), and the Right Decision brand voice (Henry's patterns, Indy's patterns, the Indy Test).
In QA mode, flag any content that violates human.md rules.

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
