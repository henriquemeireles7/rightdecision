# profiles

## Purpose
Persona-aware content intelligence layer. Each profile is a structured source-of-truth that pipeline skills read before generating content. Profiles evolve via a learning workflow that feeds analytics back into the profile.

## Critical Rules
- NEVER hardcode profile names or paths — the system works with 1 or 20 profiles
- NEVER mix learning and content workflows — content reads profiles, learning updates them
- NEVER modify profile.md or social.md without a corresponding changelog entry
- ALWAYS validate profiles after changes: `bun run validate-profiles`
- ALWAYS use YYYY-MM-DD date format in all files
- NEVER use emoji in profile files
- Changes to `_template/` do NOT retroactively update existing profiles — each profile is independent after creation

## Directory Structure
```
content/profiles/
  _template/              # Shared starting templates (fork, don't link)
  _insights/              # Cross-profile insights (from /profile-learn step 7)
  {profile-slug}/
    CLAUDE.md             # Auto-generated module docs
    profile.md            # General source-of-truth (identity, ICP, plays, voice)
    social.md             # Platform-specific intelligence (accounts, strategies)
    learning/             # Analysis rounds (one file per learning session)
    changelog/            # Version history with metrics snapshots
```

## Output Style Guide
- `##` for sections, `###` for subsections
- Bold metric labels: **Views:** 1,234
- Dates: YYYY-MM-DD (never relative)
- No emoji in profiles
- Learning files end with `## Conclusion`
- Changelog files use structured format: `## What Changed`, `## Why`, `## Metrics Snapshot`
- Tables: keep under 80 characters wide

## Health Score Rubric (0-10)

### Completeness (0-5, 1 point each)
- Identity section present and filled
- ICP section present and filled
- Core Messaging Framework (Big Idea + Problem + Outcome + Mechanism)
- Plays section with at least 1 play
- Voice & Tone section present and filled

### Depth (0-3)
- 2+ plays defined (1 point)
- 3+ hooks per play (1 point)
- Platform-specific strategies in social.md (1 point)

### Maturity (0-3)
- Any learning rounds completed (1 point)
- 3+ learning rounds completed (1 point)
- Metric improvement documented in changelog (1 point)

## Required Sections

### profile.md
- `## Identity`
- `## ICP`
- `## Core Messaging Framework` (with `### Big Idea`, `### Problem Core + Agitation`, `### Desired Outcome`, `### Unique Mechanism`)
- `## Plays`
- `## Voice & Tone`

### social.md
- `## Platform Accounts`
- `## Active Platforms`
- `## Platform-Specific Strategies`

## Play Selection Logic
Each profile has 2-6 plays targeting different audience awareness states:
- **1 = Problem-aware:** Knows the problem, not the solution
- **2 = Solution-aware:** Knows solutions exist, hasn't picked one
- **3 = Product-aware:** Knows about us, hasn't committed
- **4 = Most-aware:** Ready to act, needs final push

Pipeline infers state from clip transcript, matches to play. Fallback: no match or ambiguous -> lowest-numbered play (broadest audience).

## BD Whitelabel
This system is designed for whitelabel. BD clients fork the repo and create their own profiles using `_template/`. No code changes needed — just add profile directories with the required sections.
