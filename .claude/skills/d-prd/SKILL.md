---
name: d-prd
description: "Product Requirements Document from JTBD findings. Maps jobs to features, prioritizes, runs /autoplan review. Triggers: 'd-prd', 'PRD', 'product requirements', 'feature spec', 'what to build'."
---

# d-prd — Product Requirements Document

## What this does
Takes a JTBD document + founder priorities and produces an implementation-ready PRD.
Every P0 feature traces to a specific JTBD finding. Runs the /autoplan review pipeline
(CEO + Design + Eng) as a quality gate.

## Pipeline
d-jtbd → **d-prd** → d-tasks → d-code → d-review → /ship

## Prerequisites
- JTBD document exists for the product area
- Founder has reviewed and approved the JTBD

## Context Loading
1. Read the JTBD document fully
2. Read `decisions/company.md` — positioning, ICP
3. Read `decisions/coding.md` — technical feasibility, architecture constraints
4. Read `decisions/design.md` — design system, aesthetic direction
5. Audit existing codebase — what already exists? (same audit as d-tasks Step 0)
6. Read any prior PRDs for this product area

## Process

### Step 1: Map JTBD → Features
For each underserved outcome (high opportunity score from JTBD):
- Define a feature that addresses it
- Trace it: "Feature X addresses Job Y, Outcome Z (opportunity score: N)"
- If a feature doesn't trace to a JTBD finding, question whether it should exist

### Step 2: Prioritize
- **P0 (must ship):** Directly addresses a top underserved outcome or is architecturally required
- **P1 (should ship):** High-value for minimum-delightful product, can cut if timeline tight
- **P2 (nice to have):** Polish. Cut first under pressure.

### Step 3: Define User Flows
For each entry point (how users arrive at the product):
- Map the step-by-step flow
- Define data created at each step
- Define error cases
- Spec critical UI screens (not full design, but layout + key elements)

### Step 4: Specify Data Model
- Entity-relationship diagram
- Table schemas with column types
- Entity justifications (why does this entity exist? JTBD trace)
- Migration plan from existing schema

### Step 5: Define Non-Functional Requirements
- Performance targets (FCP, TTI, API response times)
- Security requirements (auth, CSRF, XSS, rate limiting, privacy)
- Accessibility basics
- Mobile responsiveness strategy

### Step 6: Define Success Metrics + Kill Criteria
- Primary metrics with 90-day targets
- Churn warning signals mapped to JTBD firing triggers
- Assumption validation plan (hypothesis → how to validate → success/pivot signal)
- Kill criteria (signals that cause fundamental rethink)

### Step 7: Create "Don't Build" List
Inherit from JTBD + add PRD-specific decisions:
- Feature, why NOT, JTBD reasoning
- Deferred items with promotion criteria (when to reconsider)

### Step 8: Run /autoplan Review Pipeline
Invoke the /autoplan skill which runs:
1. CEO Review — scope, strategy, ambition
2. Design Review — UI/UX gaps, screen specs
3. Eng Review — architecture, schema, edge cases

Apply the 6 decision principles. Surface taste decisions for founder approval.

### Step 9: Build Sequence
- Dependency graph (what blocks what)
- Week-by-week build sequence for solo developer + AI
- Content QA checkpoints
- P1 features as buffer (cut under pressure)

## Output Format
Produce `decisions/<product>/NN-prd/document.md` with:
1. Product overview + JTBD traceability
2. User personas + entry points
3. Post-purchase user flows
4. Feature requirements (P0/P1/P2 with JTBD trace)
5. Data model
6. Integration specs (AI skills, third-party)
7. Platform requirements (content model, navigation)
8. Non-functional requirements (security, performance, privacy)
9. Success metrics + validation plan
10. MVP scope + deferred items with promotion criteria
11. Decision audit trail (from /autoplan)

## Rules
- NEVER create a P0 feature without a JTBD trace — if it can't trace, it's not P0
- NEVER skip the /autoplan review — it catches 20+ issues every time
- ALWAYS include a "don't build" list inherited from JTBD
- ALWAYS include kill criteria — know when to stop
- ALWAYS specify architectural prerequisites before the build sequence
- Use d-meta → d-input → d-docs pipeline internally for document structure
- Every section references specific JTBD sections (not vague "per JTBD")
