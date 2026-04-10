# Harness — AI Development System

> Last verified: 2026-04-09

## Dual Purpose
The harness serves two roles:
1. **Internal:** Runs our company — hooks, skills, CLAUDE.md, methodology for AI-assisted development
2. **B2B Template:** Templates the Business Decisions product — our harness patterns become the skills and workflows we sell to non-tech entrepreneurs

Harness quality directly affects product quality. Every improvement to our development workflow is a potential feature for Business Decisions customers.

## Three-Layer Context Architecture

```
Layer 1: Folder CLAUDE.md (auto-loaded per directory)
  ├── Purpose, Critical Rules, Imports, Recipe, Verify
  └── Auto-generated footer (files, exports, deps — refreshed by Stop hook)

Layer 2: Universal Reference Files (decisions/*.md)
  ├── maturity, company, voice, code, architecture, design, deploy, harness, health, humantasks
  └── Each <100 lines, authoritative. Root CLAUDE.md routing table says WHEN to read each.

Layer 3: Strategy Documents (decisions/{domain}/NN-name/)
  ├── Three domains: product/, growth/, harness/
  ├── Each domain has: context.md, 00-legacy/, NN-initiative/
  └── Initiatives contain document.md + project subfolders with roadmap.md
```

## Skills (8 total)

### Strategy Skills
| Skill | Purpose |
|-------|---------|
| d-strategy | Interactive founder Q&A → initiative document + project suggestions |
| d-roadmap | Extract project roadmaps from reviewed initiative (mechanical) |

### Execution Skills
| Skill | Purpose |
|-------|---------|
| d-code | TDD implementation from project roadmaps (5 phases) |
| d-content | Strategy → content with type routing (blog/handbook/methodology/social/clips) |

### Quality Skills
| Skill | Purpose |
|-------|---------|
| d-review | Pre-commit review: scripts + 7 AI phases |
| d-harness | Error → prevention feedback loop |
| d-health | Codebase audit (10 sessions, report-only) |
| d-fail | Deploy failure recovery |

## Strategy → Execution Workflow

```
STRATEGY SESSION (1 workspace per initiative):
d-strategy → gstack reviews (CEO/eng/design) → d-roadmap → /ship

EXECUTION SESSION (1 workspace per project):
Read project/roadmap.md → gstack reviews → d-code or d-content → d-review → /ship
```

## Hooks (all TypeScript on Bun)
| Hook | Event | What |
|------|-------|------|
| block-dangerous.ts | PreToolUse (Bash) | Blocks rm -rf, force-push, DROP TABLE |
| protect-files.ts | PreToolUse (Edit/Write) | Blocks .env, bun.lock, .pem, .key |
| protect-config.ts | PreToolUse (Edit/Write) | Blocks biome.json, tsconfig.json |
| warn-console-log.ts | PostToolUse (Edit/Write) | Warns on console.log in production code |
| stop-quality-gate.ts | Stop | Batch biome + tsc on changed files |
| update-context-files.ts | Stop | Auto-update folder CLAUDE.md footers |
| notify-done.ts | Stop | macOS notification |
| reinject-context.ts | SessionStart (compact) | Re-inject stack rules after compaction |

## Philosophy
- Batch at Stop, not per-edit (faster editing)
- TypeScript on Bun (no bash/jq dependency)
- Protect configs (fix code to match config, not the reverse)
- Reference files are manually maintained (not auto-generated)
- Harness patterns defined BEFORE AI codes — never extracted after
- Zero recurring errors: every error produces a prevention artifact

## Error Feedback Loop

```
Error occurs → d-harness analyzes → creates prevention artifact → error class eliminated
```

Prevention artifacts (in order of preference):
1. **Hook** — blocks the error pattern before it reaches code
2. **Script** — mechanical check that runs during review
3. **CLAUDE.md rule** — NEVER/ALWAYS directive
4. **Config** — biome.json rule, tsconfig strictness, Dockerfile change

## Update Triggers
| File | Update when |
|------|------------|
| company.md | Business model, products, or positioning changes |
| voice.md | Brand voice evolves |
| code.md | New patterns, utilities, or conventions adopted |
| design.md | Design system changes |
| deploy.md | Infrastructure or CI changes |
| harness.md | Hooks, skills, or context architecture changes |
| health.md | Maturity scores change, audit findings |
| humantasks.md | AI discovers human-required action |
| maturity.md | Principles, level definitions, or categories change |
| {domain}/context.md | Domain strategy, references, or bottlenecks change |

## Key Decisions History
| Date | Decision | Why |
|------|----------|-----|
| 2026-04-04 | CLAUDE.md over SPEC.md | Claude Code natively reads nested CLAUDE.md |
| 2026-04-04 | TypeScript hooks on Bun | No bash/jq dependency, testable, typed |
| 2026-04-04 | Batch format+lint at Stop | Per-edit was too slow |
| 2026-04-06 | Three-layer context architecture | Quick reference (Layer 2) between folder context (1) and deep docs (3) |
| 2026-04-06 | Harness is dual-purpose | Internal tool AND B2B product template |
| 2026-04-06 | Harness patterns before code | Define methodology BEFORE AI codes, not after |
| 2026-04-07 | TDD Methodology | Red/Green/Refactor, tests from acceptance criteria |
| 2026-04-08 | Scripts in skills | Mechanical checks as TypeScript scripts in skills/*/scripts/ |
| 2026-04-08 | Error feedback loop | d-harness skill analyzes errors and creates prevention rules |
| 2026-04-09 | Harness V2 consolidation | 27 skills → 8, three-domain structure, beads removed |
| 2026-04-09 | Maturity System | 12 principles, 5 universal levels, 10 categories, maturity.md as core file |
| 2026-04-09 | ops → growth rename | Three domains: Product (generate value), Growth (capture value), Harness (self-evolving AI) |
| 2026-04-09 | context.md replaces market+vision | Single file per domain with references, vision, bottlenecks, anti-killability |

## Skill Data Flow

| Skill | Reads | Writes |
|-------|-------|--------|
| d-strategy | maturity.md, health.md, company.md, {domain}/context.md | decisions/{domain}/NN-initiative/document.md |
| d-roadmap | NN-initiative/document.md | NN-initiative/NN-project/roadmap.md |
| d-code | project/roadmap.md, code.md, folder CLAUDE.md | Source code, tests |
| d-content | voice.md, company.md, strategy doc | content/{type}/post.md |
| d-review | code.md, Seven Files, git diff | Fix suggestions, humantasks.md |
| d-harness | harness.md, code.md, deploy.md, health.md | Hooks, CLAUDE.md rules, scripts |
| d-health | health.md, code.md, architecture.md, design.md | decisions/health.md (scores) |
| d-fail | Railway logs | Code fixes, d-harness invocation |

## Failure Recovery

| Scenario | Response |
|----------|----------|
| Hook blocks legitimate command | Check hook logic. If correct, the command is wrong. If wrong, fix hook, not bypass. |
| Stop hook fails (format/lint/typecheck) | Fix the issues it found. Never disable the hook. |
| Skill produces bad output | Run d-review on the output. If pattern, file d-harness to add prevention. |
| Context file stale | Update the file. Stop hook auto-updates CLAUDE.md footers. Reference files need manual update. |
| Agent loops on same error | Stop. Read the error. Check if a learning exists. If not, d-harness it. |
