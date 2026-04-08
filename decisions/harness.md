# Harness — AI Development System

> Last verified: 2026-04-08

## Dual Purpose
The harness serves two roles:
1. **Internal:** Runs our company — hooks, skills, CLAUDE.md, methodology for AI-assisted development
2. **B2B Template:** Templates the Business Decisions product — our harness patterns become the skills and workflows we sell to non-tech entrepreneurs

This means harness quality directly affects product quality. Every improvement to our development workflow is a potential feature for Business Decisions customers.

## Three-Layer Context Architecture

```
Layer 1: Folder CLAUDE.md (auto-loaded per directory)
  ├── Purpose — WHAT + WHY (1-2 sentences)
  ├── Critical Rules — domain-specific NEVER/ALWAYS directives
  ├── Imports — canonical import lines for consumers of this module
  ├── Recipe — skeleton for the most common operation in this module
  ├── Verify — exact command to run after changes
  └── Auto-generated footer — files, exports, deps (refreshed by Stop hook)

Layer 2: Universal Reference Files (decisions/*.md)
  ├── 9 files: company, roadmap, voice, coding, design, deploy, harness, lifedecisions, businessdecisions
  ├── Each <100 lines, authoritative, points to Layer 3 for depth
  └── Root CLAUDE.md routing table says WHEN to read each

Layer 3: Strategy Documents (decisions/NN-name/document.md)
  └── Full manifesto, business model, methodology, etc.
  └── Static once written. Read when Layer 2 isn't enough.
```

## Skills-as-Product Architecture

Our Claude skills follow a pattern that becomes the product delivery mechanism:

**For us (development):**
- `d-meta` → defines document structure
- `d-input` → captures founder thinking
- `d-plan` → writes the document
- `d-tasks` → extracts executable tasks

**For Life Decisions customers (personal exercises):**
- One skill per methodology step (state mapping, constraint ID, decision, etc.)
- Same meta → input → document pattern
- Output saved to user's personal folder on their computer
- No API needed — skills are self-contained

**For Business Decisions customers (business exercises + automation):**
- Same exercise skills as Life Decisions (applied to business)
- PLUS automation skills that call our APIs (posting, content pipeline, analytics)
- Skills compose APIs — users interact via Claude, not web dashboards

### Skill Design Principles
- One file per skill, self-contained
- Clear trigger patterns (like gstack skills)
- Skills ask deep questions, save raw input, generate structured output
- Skills are atomic — no dependencies on other skills
- Skills use the meta → input → document pattern

## d-tasks / d-code Methodology Bridge (Beads)

The gap between strategy docs and executable code, powered by beads (`br` CLI):
```
document.md → d-tasks → beads issues (with deps) → d-code → agent implements from bd ready
```

**d-tasks** transforms a document into beads:
- Creates an epic with all tasks as children
- 3-5 passes: extract → fill gaps → dependency audit → adversarial review → enrichment
- Each bead is self-describing: new agent can code it cold from `bd show <id>` alone
- Beads include: file paths, imports, recipes, test cases, acceptance criteria

**d-code** implements beads:
- Loop: `bd ready → pick → implement (TDD) → verify (tests + tsc + biome) → bd close → repeat`
- Fix loop: if any check fails, fix and re-run ALL checks before closing
- Creates sub-beads if implementation reveals missing tasks
- Final quality gate when all beads closed → suggests `/review` before `/ship`

**Key principle:** Harness patterns are defined BEFORE AI codes, not extracted after. The harness IS the patterns.

## Hooks (all TypeScript on Bun, no bash/jq)
| Hook | Event | What |
|------|-------|------|
| block-dangerous.ts | PreToolUse (Bash) | Blocks rm -rf, force-push, DROP TABLE |
| protect-files.ts | PreToolUse (Edit/Write) | Blocks .env, bun.lock, .pem, .key |
| protect-config.ts | PreToolUse (Edit/Write) | Blocks biome.json, tsconfig.json — fix code, not config |
| warn-console-log.ts | PostToolUse (Edit/Write) | Warns on console.log in production code |
| stop-quality-gate.ts | Stop | Batch biome + tsc on changed files |
| update-context-files.ts | Stop | Auto-update folder CLAUDE.md footers |
| notify-done.ts | Stop | macOS notification |
| reinject-context.ts | SessionStart (compact) | Re-inject stack rules after compaction |

## Philosophy
- Batch at Stop, not per-edit (faster editing)
- TypeScript on Bun (no bash/jq dependency)
- Protect configs (fix code to match config, not the reverse)
- Auto-update what can be auto-updated (file lists), preserve what's human-authored
- Reference files are manually maintained (not auto-generated)
- Harness patterns defined BEFORE AI codes — never extracted after

## Contradiction Resolution Protocol
If contradictions exist between universal files, folder CLAUDE.md, or strategy docs:
1. STOP — don't proceed with contradictory info
2. Point out the contradiction and where each version lives
3. Ask user which is correct
4. Update the wrong file immediately

## Update Triggers
| File | Update when |
|------|------------|
| company.md | Business model, products, or positioning changes |
| roadmap.md | Document pipeline advances, priorities shift, human tasks change |
| voice.md | Brand voice evolves |
| coding.md | New patterns, utilities, or conventions adopted |
| design.md | Design system changes |
| deploy.md | Infrastructure or CI changes |
| harness.md | Hooks, skills, or context architecture changes |
| lifedecisions.md | Life Decisions product scope or architecture changes |
| businessdecisions.md | Business Decisions product scope or architecture changes |

## Key Decisions History
| Date | Decision | Why |
|------|----------|-----|
| 2026-04-04 | CLAUDE.md over SPEC.md | Claude Code natively reads nested CLAUDE.md |
| 2026-04-04 | TypeScript hooks on Bun | No bash/jq dependency, testable, typed |
| 2026-04-04 | Batch format+lint at Stop | Per-edit was too slow |
| 2026-04-06 | Three-layer context architecture | Quick reference (Layer 2) between folder context (1) and deep docs (3) |
| 2026-04-06 | Import Maps + Recipes in folder CLAUDE.md | Each CLAUDE.md shows canonical imports and skeleton for common operations |
| 2026-04-06 | Harness is dual-purpose | Internal tool AND B2B product template |
| 2026-04-06 | Skills-as-product architecture | Each methodology step = one Claude skill, same meta → input → doc pattern |
| 2026-04-06 | Harness patterns before code | Define methodology BEFORE AI codes, not after |
| 2026-04-06 | d-tasks bridge | Gap between strategy docs and executable coding tasks |
| 2026-04-07 | Beads for task tracking | Queryable dependency graph replaces markdown tasks — agents use bd ready |
| 2026-04-07 | d-code skill | Implements beads with TDD + fix loop + quality gate → review → ship |
| 2026-04-07 | TDD Methodology in coding.md | Red/Green/Refactor cycle documented with test structure template |
| 2026-04-08 | d-autoreview 6-step chain | d-harden → /review → /simplify → d-review → /qa → /ship |
| 2026-04-08 | Scripts in skills | Mechanical checks as TypeScript scripts in skills/*/scripts/ folders |
| 2026-04-08 | Error feedback loop | d-harness skill analyzes errors and creates prevention rules |

## Error Feedback Loop

The d-harness skill closes the loop between production errors and prevention:

```
Error occurs → d-harness analyzes → creates prevention artifact → error class eliminated
```

Prevention artifacts (in order of preference):
1. **Hook** — blocks the error pattern before it reaches code (PreToolUse/PostToolUse)
2. **Script** — mechanical check that runs during review chain (skills/*/scripts/)
3. **CLAUDE.md rule** — NEVER/ALWAYS directive in the relevant folder's CLAUDE.md
4. **Config** — biome.json rule, tsconfig strictness, Dockerfile change

The goal is zero recurring errors. Every error that reaches production should produce a prevention artifact that makes the same class of error impossible.

## Review Chain

The d-autoreview skill chains all quality checks into a single pre-ship pipeline:

```
d-harden → /review → /simplify → d-review → /qa → /ship
```

| Step | Skill | What it catches |
|------|-------|-----------------|
| 1 | d-harden | Security holes, performance issues, Dockerfile gaps |
| 2 | /review | SQL safety, trust boundaries, conditional side effects |
| 3 | /simplify | DRY violations, missed reuse, schema duplication |
| 4 | d-review | Bugs via fresh eyes, missing tests, architecture violations |
| 5 | /qa | Runtime bugs that static analysis misses |
| 6 | /ship | Version bump, changelog, PR creation |

Order rationale:
- d-harden is first because security/performance issues are foundational — fix before reviewing style
- d-review is late because it creates beads for deferred fixes — do quick fixes in steps 2-3 first
- /qa is before /ship to catch runtime bugs before creating the PR

## Scripts in Skills

Skills can include a `scripts/` folder for mechanical checks that augment the skill's AI-driven analysis. These scripts:
- Are TypeScript files runnable with `bun`
- Accept CLI args (typically `--base <branch>`)
- Output JSON for machine consumption
- Use `spawnSync` for git/rg commands
- Use `resolve(import.meta.dir)` for repo-relative paths

Current scripts:
| Skill | Script | What it checks |
|-------|--------|---------------|
| d-review | dep-check.ts | Dependency direction violations (features/ cross-imports) |
| d-review | coverage-check.ts | Missing .test.ts files for changed .ts files |
| d-code | build-order-check.ts | Build Order compliance (schema before features, etc.) |
| d-code | lockfile-check.ts | package.json changed but bun.lock not committed |
| d-harden | dockerfile-check.ts | Dockerfile runtime stage missing files needed by railway.toml |
| d-autoreview | chain-verify.ts | All 6 review chain steps produced output |
