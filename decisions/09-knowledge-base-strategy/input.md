# Input — Knowledge Base Strategy (Doc #9)
**Date:** 2026-04-06
**Source:** Henry (founder), plan context, existing system patterns
**Raw:** decisions/09-knowledge-base-strategy/raw.md

---

## Core concept

The decisions/ folder is already a knowledge base. It just doesn't know it yet. The strategy is to formalize what exists and add a compounding mechanism so that more raw data (podcasts, conversations) makes all downstream documents and content better over time.

## Three mutation tiers (established)

| Tier | Files | Rule | Enforcement |
|---|---|---|---|
| **Living** | `general.md` (root), CLAUDE.md files per folder | Updated as new material arrives. AI reads first for full context. | TBD — harness workflow being designed |
| **Static** | `*/document.md`, `*/meta.md` | Frozen once written. Only changed if Henry explicitly asks. | Existing CLAUDE.md instructions |
| **Immutable** | `*/input.md`, `*/raw.md`, podcast transcripts | Never edited. New files added, existing files untouched. | Convention + future enforcement |

## Folder structure (established)

```
decisions/
├── general.md                    ← THE living summary (root-level context)
├── 001-architecture.md           ← Legacy (pre-folder format)
├── human.md                      ← Writing rules (universal reference)
├── 01-business-model/
│   ├── meta.md                   ← Structure template
│   ├── input.md                  ← Founder's raw thinking
│   ├── document.md               ← Final strategy doc (static)
│   └── CLAUDE.md                 ← Per-folder AI context (future)
├── 02-manifesto/
│   ├── meta.md, input.md, document.md, raw.md
│   └── ...
├── ... (03-09)
├── podcasts/                     ← NEW: raw podcast transcripts
│   ├── general/                  ← Open conversations
│   ├── vsl/                      ← VSL-rehearsal episodes
│   ├── the3acts/                 ← Course structure practice
│   └── course/                   ← Direct class rehearsal
└── CLAUDE.md                     ← Per-folder AI context (future, decisions/-level)
```

## Open questions (being resolved in harness workflow conversation)

1. **How does the AI self-learning loop actually trigger?** File-watcher? Git hook? Manual Claude Code command? Harness workflow step? → Being designed in parallel conversation.
2. **How does general.md stay useful at scale?** Max length? Split into child summaries? CLAUDE.md files per folder as the distributed alternative? → Split strategy: CLAUDE.md per folder for local context, general.md for global context. Exact split mechanism TBD.
3. **Who approves AI updates to general.md?** Start manual. Future: automated via harness workflow after trust is established.
4. **How do agents search the knowledge base?** Read general.md first. Then grep/read specific docs. Formal retrieval architecture TBD with harness.

## What IS decided (firm)

1. Podcast transcripts go in `decisions/podcasts/{type}/` with 4 type subfolders
2. general.md is the living summary at the root of decisions/
3. document.md files are static once written
4. Raw material (input.md, raw.md, transcripts) is immutable
5. The compounding loop exists conceptually: podcast → transcript → insights → better docs → better podcasts
6. The automation of the loop is TBD (harness workflow concern)
7. CLAUDE.md files inside folders will provide per-folder AI context (same DSA pattern as code)
