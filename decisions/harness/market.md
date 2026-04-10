# Harness Market Context

> Last verified: 2026-04-09

## AI Development Tools Landscape

| Tool | What It Does | Our Relationship |
|------|-------------|-----------------|
| Claude Code | AI coding agent | Our primary agent runtime |
| Cursor | AI-powered IDE | Alternative agent (via Codex skill) |
| Codex (OpenAI) | CLI coding agent | Second opinion via /codex skill |
| gstack | Browser automation + reviews | Integrated for QA, design, deployment |
| Conductor | Multi-agent workspace manager | How we run parallel agents |

## Methodology Influences

| Source | What We Took | How We Adapted |
|--------|-------------|----------------|
| Andrej Karpathy ("vibe coding") | AI writes, human reviews | Added TDD + completion audit |
| TDD (Beck) | Red-green-refactor | Tests from acceptance criteria, not implementation |
| Domain-Driven Design | Bounded contexts | Domain-Spec Architecture (folder CLAUDE.md) |
| Shape Up (Basecamp) | Projects over tasks | Initiatives → projects → deliverables |

## What Makes Our Harness Different

1. **Skills as product.** Our development skills become BD customer skills.
2. **Three-layer context.** Folder → reference → strategy. Agents always have the right context.
3. **Error feedback loop.** Every error produces a prevention artifact. Zero recurring errors.
4. **Strategy before code.** d-strategy → d-roadmap → d-code. Never code without a plan.
5. **Adversarial review.** d-review has 7 phases including fresh eyes and adversarial thinking.

## Current Skill Inventory

| Skill | Purpose |
|-------|---------|
| d-strategy | Interactive founder Q&A → initiative document |
| d-roadmap | Extract project roadmaps from initiative |
| d-code | TDD implementation from roadmaps |
| d-content | Strategy → content (blog, handbook, social, clips) |
| d-review | Pre-commit review (scripts + AI phases) |
| d-harness | Error → prevention feedback loop |
| d-health | Codebase audit (10 sessions, report-only) |
| d-fail | Deploy failure recovery |
