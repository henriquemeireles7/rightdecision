# Raw Input — Knowledge Base Strategy (Doc #9)
**Captured:** 2026-04-06
**Source:** Henry (founder interview during d-input phase)

---

## Q1: Where should podcast transcripts live?
**Answer:** decisions/podcasts/ — a new top-level subfolder inside decisions/ with subfolders per type (general/, vsl/, the3acts/, course/).

## Q2: AI self-learning loop — auto-update or manual approval?
**Answer (Henry's exact words):** "We are defining our main workflow in another harness conversation. So for now lets start with manual but reference it that we need to come up with a harness workflow for this."

**Key insight:** The harness workflow (Claude Code agent orchestration) is being designed in a parallel conversation. The KB strategy should define the information architecture but leave the automation mechanism as an open question that references the harness workflow.

## Q3: Max size of general.md / pruning strategy?
**Answer (Henry's exact words):** "We will do a kind of split strategy. I feel like the 'knowledge base' should be a harness concern so I am talking in another conversation how all info and context will be writen and for now we will have claude.md files inside folders and universal files inside the decisions root, so for now the knowledge base will have open questions."

**Key insights:**
- The knowledge base architecture is being co-designed with the harness/agent workflow
- Current approach: CLAUDE.md files inside folders (per-folder context) + universal files in decisions/ root
- The KB strategy doc should define the information model but leave implementation details as open questions
- This doc should be comfortable with ambiguity — it's a living strategy that will evolve as the harness workflow matures

## Prior context from plan phase:
- general.md is THE living summary file (established, founder-approved)
- document.md files are static once written (founder-approved)
- Raw material is immutable (founder-approved)
- Three mutation tiers are firm. The automation of those tiers is TBD.
