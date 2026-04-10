# Harness Vision

> Last verified: 2026-04-09

## What the Harness Is

The AI development methodology that runs this company. Hooks, skills, CLAUDE.md, and workflows that make AI agents productive and safe.

## Dual Purpose

1. **Internal:** Runs our company — every feature, document, and content piece flows through the harness
2. **B2B Template:** Templates the Business Decisions product — our harness patterns become the skills and workflows we sell to non-tech entrepreneurs

Harness quality directly affects product quality. Every improvement to our development workflow is a potential feature for Business Decisions customers.

## Three-Layer Context Architecture

```
Layer 1: Folder CLAUDE.md (auto-loaded per directory)
  └── Purpose, Critical Rules, Imports, Recipe, Verify, Auto-generated footer

Layer 2: Universal Reference Files (decisions/*.md)
  └── Compact summaries, <100 lines each, authoritative

Layer 3: Strategy Documents (decisions/{domain}/NN-name/)
  └── Deep strategy docs, static once written
```

## Strategy → Execution Workflow

```
STRATEGY SESSION (1 workspace per initiative):
d-strategy → gstack reviews (CEO/eng/design) → d-roadmap → /ship

EXECUTION SESSION (1 workspace per project):
Read project/roadmap.md → gstack reviews → d-code or d-content → d-review → /ship
```

## Philosophy

- Harness patterns defined BEFORE AI codes — never extracted after
- Batch at Stop, not per-edit (faster editing)
- TypeScript on Bun (no bash/jq dependency)
- Protect configs (fix code to match config, not the reverse)
- Reference files are manually maintained (not auto-generated)
- Zero recurring errors: every production error produces a prevention artifact
