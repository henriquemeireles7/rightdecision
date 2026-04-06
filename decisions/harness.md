# Harness — AI Development System

> Last verified: 2026-04-06

## Three-Layer Context Architecture

```
Layer 1: Folder CLAUDE.md (auto-loaded per directory)
  ├── Purpose, rules, files, exports, deps (auto-generated footer)
  ├── Must-Read Context — which universal files to read BEFORE working here
  └── Additional Context — optional deeper reads

Layer 2: Universal Reference Files (decisions/*.md)
  ├── 8 files: company, roadmap, voice, coding, design, deploy, ops, harness
  ├── Each <100 lines, authoritative, points to Layer 3 for depth
  └── Root CLAUDE.md routing table says WHEN to read each

Layer 3: Strategy Documents (decisions/NN-name/document.md)
  └── Full manifesto, business model, methodology, etc.
  └── Static once written. Read when Layer 2 isn't enough.
```

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

## Contradiction Resolution Protocol
If contradictions exist between universal files, folder CLAUDE.md, or strategy docs:
1. STOP — don't proceed with contradictory info
2. Point out the contradiction and where each version lives
3. Ask user which is correct
4. Update the wrong file immediately

## Update Triggers
| File | Update when |
|------|------------|
| company.md | Business model or manifesto changes |
| roadmap.md | Document pipeline advances, priorities shift, human tasks change |
| voice.md | Brand voice evolves |
| coding.md | New patterns, utilities, or conventions adopted |
| design.md | Design system changes |
| deploy.md | Infrastructure or CI changes |
| ops.md | Internal tooling strategy evolves |
| harness.md | Hooks, skills, or context architecture changes |

## Key Decisions History
| Date | Decision | Why |
|------|----------|-----|
| 2026-04-04 | CLAUDE.md over SPEC.md | Claude Code natively reads nested CLAUDE.md |
| 2026-04-04 | TypeScript hooks on Bun | No bash/jq dependency, testable, typed |
| 2026-04-04 | Batch format+lint at Stop | Per-edit was too slow |
| 2026-04-06 | Three-layer context architecture | Quick reference (Layer 2) between folder context (1) and deep docs (3) |
| 2026-04-06 | Must-Read Context in folder CLAUDE.md | Folders declare which universal files agents should read |
