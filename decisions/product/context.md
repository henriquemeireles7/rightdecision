# Product Context — Generate Value

> Last verified: 2026-06-15

## Mission

Help people live a more fulfilled and longer life. (Canonical source: decisions/company.md.)

## The product, structurally

The software IS the handbook. The course teaches people how to fill it in. The handbook is
organized as four pillars, each delivered as one or more code features. This map is intentionally
STRUCTURAL — what the surfaces are, not how to market them. The authoritative description of any
feature is that feature's own `CLAUDE.md`.

| Pillar | What it does for the member | Code surface |
|--------|-----------------------------|--------------|
| 1. Aspirational | Get clear on what they want — dream home, relationships, experiences, places — with images and links. No dates; this stays aspirational. | `features/(life)/aspirations` (Dream Board) |
| 2. Plan | Turn what they want into a real plan: a horizon broken into a few dated decisions, reviewed weekly. | `features/(life)/plan` |
| 3. Routine | Build the plan into a fulfilled, intentional routine — habits across health, training, mind, relationships — tracked day to day. | `features/(life)/routine` + `features/(life)/journal` |
| 4. Course / advanced | Teach how to use the handbook and go deeper into the transformation. | `features/(life)/course*`, `content/courses/` |

The handbook engine that pillars 1–4 build on already exists: `features/(life)/playbook`
(`documents` + `document_templates` = fill-in documents whose every answer is a structured row).

## Important

Product strategy, positioning, and roadmap are maintained OUTSIDE this repository so they can
evolve with customer feedback without churning the codebase. Anything in `00-legacy/` describes a
previous direction and is NOT authoritative. Never block a technical decision on a product-vision
statement found in the repo — read the root `CLAUDE.md` decoupling rule.
