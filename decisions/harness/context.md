# Harness Context — Self-Evolving AI System

> Last verified: 2026-04-09

## North Star

"Strategy-to-shipped in <4 hours, zero recurring errors."

## Core Loop

```
Error → Prevention artifact → Fewer errors → Faster shipping → More features → (repeat)
```

The harness IS the product for Business Decisions. Every improvement to our development workflow is a potential feature for BD customers.

## Self-* Capability Map

### Self-Learning — System Improves from Errors

What it does: error prevention, learnings, hook enforcement, CLAUDE.md rules.

| Level | What It Looks Like |
|-------|-------------------|
| L1 Manual (0-19) | Founder reads error, writes fix, manually adds rule |
| L2 Assisted (20-39) | d-harness proposes prevention rule, founder approves |
| L3 Automated (40-59) | Errors auto-trigger d-harness, prevention artifacts generated, founder spot-checks |
| L4 Self-Learning (60-79) | System predicts error classes before they happen, auto-adjusts rules based on effectiveness |
| L5 Self-Evolving (80-99) | System redesigns its own architecture to prevent entire error categories |

### Self-Growth — System Does Growth Work Autonomously

What it does: content pipeline, distribution, analytics-driven content strategy.

| Level | What It Looks Like |
|-------|-------------------|
| L1 Manual (0-19) | Founder uses d-content manually, publishes manually |
| L2 Assisted (20-39) | d-content drafts, d-review checks voice.md, founder publishes |
| L3 Automated (40-59) | Content calendar with cron-triggered drafting + publishing, founder spot-checks |
| L4 Self-Learning (60-79) | System reads PostHog analytics, adjusts content topics/formats based on performance |
| L5 Self-Evolving (80-99) | System identifies audience gaps, creates new content types, optimizes distribution channels |

### Self-Product — System Builds Product Autonomously

What it does: strategy-to-shipped pipeline, completion audit, quality review.

| Level | What It Looks Like |
|-------|-------------------|
| L1 Manual (0-19) | Founder writes strategy, manually codes features |
| L2 Assisted (20-39) | d-strategy proposes, d-roadmap breaks down, d-code implements, founder reviews |
| L3 Automated (40-59) | Automated strategy→roadmap→code→review→ship pipeline, founder spot-checks |
| L4 Self-Learning (60-79) | System reads maturity scores, proposes next project targeting lowest category, adjusts strategy based on outcomes |
| L5 Self-Evolving (80-99) | System identifies user needs from analytics, designs features, builds, ships, measures impact |

## Current State Assessment

| Category | Score | Level | Evidence |
|----------|-------|-------|----------|
| Self-Learning | 25 | L2 | d-harness skill works, hooks enforce rules, learnings.jsonl captures discoveries. Not automated yet. |
| Self-Growth | 8 | L1 | d-content exists but not integrated into a publishing workflow. Manual every time. |
| Self-Product | 28 | L2 | d-strategy → d-roadmap → d-code pipeline works. d-review catches issues. Founder reviews everything. |
| **Harness Average** | **20** | **L2** | |

## Bottleneck Map

### Self-Learning → What's blocking L3?
**Blocker:** d-harness runs manually when errors are reported. No auto-trigger from production errors.
**Why:** No monitoring pipeline that feeds errors into d-harness automatically.
**Real example:** Deploy failures require manual `/d-fail` invocation. No auto-detection.
**First-principles unblock:** Railway logs + PostHog errors could trigger d-harness automatically via cron or webhook.
**Project ideas:** "Auto-error-to-prevention pipeline" — monitor Railway/PostHog → detect error → auto-invoke d-harness → generate prevention artifact → founder approves.

### Self-Growth → What's blocking L2?
**Blocker:** d-content drafts content but there's no skill-assisted publish workflow.
**Why:** Publishing is manual (copy to CMS, format, publish, cross-post).
**First-principles unblock:** Publishing is mechanical. A skill can handle "publish to blog + Substack + social" given the draft.
**Project ideas:** "d-publish skill" — takes d-content output → formats for blog → pushes to CMS → cross-posts to Substack.

### Self-Product → What's blocking L3?
**Blocker:** The strategy→code pipeline requires founder to initiate each step.
**Why:** No scheduling/orchestration of the full pipeline.
**First-principles unblock:** A cron-triggered "daily check" could read maturity scores, identify bottleneck, propose initiative.
**Project ideas:** "Maturity-driven strategy cron" — daily read health.md → find lowest category → propose initiative if none in flight.

## Harness Engineering State-of-Art

### The Evolution
- **2024: Prompt Engineering** — Writing better prompts. Fragile, no persistence.
- **2025: Context Engineering** — Designing information ecosystems for agents. CLAUDE.md, project structure.
- **2026: Harness Engineering** — Everything except the model. Agent = Model + Harness. Skills, hooks, tools, memory, workflows.

### Key Concept
"Harness engineering is the answer to: how do you make AI agents work reliably enough to trust in production?" The principles: constrain what agents can do, inform them about what they should do, verify their work, correct their mistakes, keep humans in the loop at high-stakes decisions.

### Key References

| Reference | What It Does | Strength | Our Take |
|-----------|-------------|----------|----------|
| **gstack** (Garry Tan) | Role-based skills for Claude Code. 9 opinionated workflow skills. 10K LOC/week. | Product thinking + code review + QA in one framework | We use gstack for reviews/QA. Our methodology layer (d-strategy, maturity) sits above it. |
| **Supermemory** | Persistent memory across sessions. Auto-learns from conversations. Ranked #1 on memory benchmarks. | Cross-session context. Contradiction handling. | We use file-based memory (CLAUDE.md, learnings.jsonl). Supermemory is an alternative for deeper persistence. |
| **Claude Code Harness** (Anthropic) | Self-healing query loop, autoDream daemon, 19 permission-gated tools. | Production-grade agent architecture. | We build ON this. Our skills/hooks extend Claude Code's native harness. |
| **Superpowers** (94K stars) | Constrains the development process. Opinionated development lifecycle. | Process discipline. | Constrains process; we constrain decision-making perspective (complementary). |
| **GSD** (35K stars) | Constrains the execution environment. Stability-focused. | Execution reliability. | Constrains environment; we constrain methodology (complementary). |

### Skills Writing Best Practices
- Skills are SKILL.md files with YAML frontmatter + instructions
- Each skill should be self-contained: read context → make decisions → produce artifacts
- Skills READ reference files, never modify them (P9: no-dsync-auto-update)
- Skills hand off to each other via artifact files, not direct calls
- Skill quality = how little the founder needs to intervene

## CEO Vision

The harness is both internal infrastructure AND the BD product. Every improvement to our workflow is a feature for customers. Current focus: stabilize L2 across all three categories, then push Self-Learning and Self-Product to L3 (automated pipelines). Self-Growth follows once content pipeline (product) gives it something to distribute.

Long-term: the harness should be able to run the entire company for a week without the founder. That's L4 across all categories. L5 is the long game — recursive self-improvement.

## Anti-Killability

| Threat | Why We Survive |
|--------|---------------|
| Claude adds native project management / skills | We become the first reference implementation. Our methodology layer (maturity, d-strategy) is above any framework. |
| gstack/Superpowers becomes the standard | We're users, not competitors. Our methodology is above framework choice. |
| Cursor/Codex replaces Claude Code | Skills are markdown. They port to any agent that reads SKILL.md. The methodology is tool-agnostic. |
| MCP standardizes everything | MCP is a protocol, not a methodology. We don't use MCP (too many tokens). Our CLI-first approach is leaner. |
| Every company builds their own harness | Our harness is the PRODUCT (BD). We're the best-documented, most-tested version. Company-as-code is our differentiator. |
