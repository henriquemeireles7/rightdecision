# META-DOC: Short-Video Viral Strategy

## Purpose
Define the automated pipeline that turns podcast recordings into short-form video content distributed across 13 accounts, plus the AI-generated content system for brand accounts, dark channels, and the human-to-AI transition for personal accounts. This document makes the "all 13 accounts simultaneously" promise from doc #7 operationally feasible.

## Scope
**This document IS:** The complete content production + distribution automation pipeline. OpusClip integration, AI-generated content, dark channels, folder-based architecture, auto-posting, metadata generation, compliance, cost model, and monitoring.
**This document is NOT:** The social media setup (doc #7 — accounts, bios, content playbook). Not the knowledge base (doc #9). Not paid traffic (doc #21). Not content automation hardening (doc #41 — that comes after 8 weeks of operational data).
**Scope boundary with doc #41:** This document designs the full pipeline. Doc #41 (Weeks 8-12) hardens it: replaces paid tools with custom code, optimizes costs, improves quality based on real data.

## Primary reader
Henry (builds the automation), AI agents (operate within the pipeline).

## Input documents
- `decisions/07-social-media-setup/document.md` — 13 accounts, posting templates, cross-posting rules, content playbook
- `decisions/09-knowledge-base-strategy/document.md` — folder structure, transcript taxonomy, naming conventions
- `decisions/02-manifesto/document.md` — seven angles, eight sins, hooks by awareness level
- `decisions/01-business-model/document.md` — unit economics ($191 net/customer, $35/month infra, target 97% margin)
- `DESIGN.md` — visual identity for branded content

## Expert council
1. **Pieter Levels** — automation-first indie building, minimal viable automation
2. **Alex Hormozi** ($100M Leads) — content volume strategy, "more > better" for organic reach
3. **OpusClip documentation** — AI clip extraction, API capabilities, best practices
4. **n8n / Make.com patterns** — folder-watch automation, multi-step workflows
5. **Platform policy teams** — TikTok Creator ToS, Meta AI content policies, FTC endorsement guides

## Research summary
**Layer 1:** Short-form video is the dominant organic discovery mechanism in 2026. OpusClip and similar tools can extract 10-15 clips from a 30-60 min video with AI-scored virality potential. Auto-posting APIs exist for most platforms (Buffer, Publer, Later, Hootsuite) but TikTok automation remains restricted.

**Layer 2:** AI-generated content (voice clones, AI characters, faceless channels) is a growing trend. Tools like ElevenLabs (voice), HeyGen (video), and Synthesia (avatars) enable production at scale. However, platform enforcement against synthetic content is increasing — Meta requires AI content labels, TikTok has disclosure requirements, the FTC has updated endorsement guidelines.

**Layer 3:** The folder-based automation pattern (input/ → processing/ → output/) works at low volume but needs a queue/state system at high volume (>100 files/day). For a 2-person team, existing tools (n8n, Make.com, Zapier) are preferable to custom code until the pipeline is validated.

## Document-level failure modes
1. **Over-engineers before validating.** The pipeline assumes 2 podcasts/day produces good clips. This hasn't been tested. Must include an MVP pipeline that validates each step manually first.
2. **Platform bans kill the strategy.** 13 accounts posting AI content from the same IP/device triggers coordinated behavior detection. No ban recovery plan = total failure.
3. **Legal exposure from voice clones.** FTC and state laws require AI content disclosure. Running AI voice clones without disclosure on commercial accounts is a liability.
4. **Cost creep eats margins.** Multiple SaaS tools ($500-800/month) erode the 97% margin target. Must have a budget ceiling.
5. **Pipeline stalls with no degraded mode.** If OpusClip goes down, the entire content supply chain breaks. No fallback = content drought.

## Sections

### SECTION 1: Automation Philosophy + Principles
**Answers:** Why automation, not human labor. The volume thesis. Existing tools first, custom code last. The MVP pipeline concept.
**Done when:** A reader understands: we prioritize speed and volume over perfection, we use paid tools before building custom, and we validate each pipeline step manually before automating.
**Failure modes:**
- Philosophy without constraints (when DOES custom code make sense?)
- No MVP pipeline: jumps straight to full automation without validating inputs
**Max length:** 1-2 pages
**Confidence:** 🟢 validated (founder explicitly chose "existing tools first")

### SECTION 2: Folder-Based Pipeline Architecture
**Answers:** The complete folder structure: input/ → processing/ → output/ organized by account and platform. File flow diagram. Scaling limits and transition triggers to a queue system.
**Done when:** An engineer can implement the folder structure and file-watching triggers from this section alone.
**Failure modes:**
- Folder structure works at 20 files/day but collapses at 150 files/day
- No manifest/state file to track which inputs have been processed
- No cleanup policy for processed files (output/ grows forever)
**Max length:** 2-3 pages (includes diagram)
**Confidence:** 🟡 hypothesis

### SECTION 3: Content Production Pipelines
**Answers:** Two subsections — (A) Podcast-derived clips via OpusClip and (B) AI-originated content via voice/face cloning. For each: input, processing, output, quality gates, fallback if primary tool fails.
**Done when:** For any podcast recording or AI content request, the pipeline can produce platform-ready clips without manual intervention (after MVP validation).
**Failure modes:**
- OpusClip is a single point of failure with no tested fallback
- Voice clone quality degrades at volume — no kill rate target
- Podcast-derived and AI-originated content aren't distinguishable in the output folders
**Max length:** 3-4 pages (biggest section)
**Confidence:** 🔴 guess (neither pipeline has been tested)

### SECTION 4: Dark Channel Concept
**Answers:** Separate niche channel(s) with 100% AI-generated faceless content. No connection to personal brands. Niche selection criteria. Content strategy. Brand firewall. Monetization path.
**Done when:** The dark channel has a defined niche, content type, posting cadence, and zero traceable connection to Henry/Indy personal brands.
**Failure modes:**
- Dark channel discovered and linked to main brand (reputational risk)
- Niche selection is wrong — channel gets no traction
- AI content quality is too low for the niche audience
**Max length:** 1-2 pages
**Confidence:** 🔴 guess (pure experiment)

### SECTION 5: Distribution Pipeline — Metadata, Scheduling, Posting
**Answers:** After clips are produced, how metadata (descriptions, hashtags, CTAs) is generated per platform, how posting is scheduled (time slots, frequency caps), and the actual posting mechanism (which APIs, which tools).
**Done when:** A clip in the output/ folder automatically gets platform-appropriate metadata and is posted (or queued for posting) without manual work.
**Failure modes:**
- Same metadata across platforms (violates doc #7 cross-posting rules)
- Auto-posting API unavailable for TikTok (requires semi-manual workaround)
- Rate limits exceeded, triggering platform flags
- Content deduplication failure: same clip appears on multiple accounts on the same platform
**Max length:** 2-3 pages
**Confidence:** 🔴 guess (API availability not fully validated)

### SECTION 6: Human-to-AI Transition Protocol
**Answers:** How personal accounts (Indy, Henry) transition from human-recorded to AI-first content. Voice clone training, quality validation gates, transition triggers, audience communication, and disclosure requirements.
**Done when:** The transition has a checklist: "when these conditions are met, personal accounts switch to AI-first content with these disclosures."
**Failure modes:**
- Voice clone is uncanny valley — erodes trust instead of building it
- No disclosure: violates FTC guidelines and platform policies
- Transition happens before voice quality is validated
- Audience backlash when they discover the switch
**Max length:** 1-2 pages
**Confidence:** 🔴 guess (voice cloning quality untested)

### SECTION 7: Legal Compliance + Platform Policy
**Answers:** FTC endorsement guidelines for AI-generated content. Platform-specific AI content policies (Meta, TikTok, X, YouTube). Voice cloning consent documentation. Coordinated behavior mitigation (IP separation, posting pattern variation). Content rights and licensing. Ban detection and recovery protocol.
**Done when:** Every piece of AI-generated content has a compliant disclosure path, and the team knows what to do when an account gets flagged.
**Failure modes:**
- Ignores FTC guidelines — legal liability for undisclosed AI endorsements
- Coordinated behavior detection bans 3+ accounts simultaneously
- Voice cloning service retains rights to the trained model
- No ban recovery plan — a banned account is gone forever
**Max length:** 2-3 pages
**Confidence:** 🔴 guess (legal advice not yet obtained)

### SECTION 8: Tools + Services Registry + Cost Model
**Answers:** Every tool in the pipeline: name, purpose, cost, API availability, alternatives. Monthly burn rate at scale. Budget ceiling. Per-clip economics. Comparison against doc #1's margin targets.
**Done when:** Total monthly automation cost is calculated and sits within the 97% margin target. Every tool has a named alternative.
**Failure modes:**
- Monthly costs exceed $800 without being noticed (margin erosion)
- Tool lock-in: no data portability from primary tools
- Cost projections are per-tool but not aggregated
**Max length:** 2 pages (tables)
**Confidence:** 🔴 guess (pricing not fully researched)

### SECTION 9: Monitoring, QC + Failure Recovery
**Answers:** Pipeline health monitoring (not account-level metrics — those are in doc #7). Processing failure detection. Content quality gates. Degraded mode operations (what happens when a tool goes down). Queue depth alerts. Failed post recovery.
**Done when:** For every pipeline failure scenario, there is a detection mechanism and a recovery action.
**Failure modes:**
- Monitoring is account-level (overlaps doc #7) instead of pipeline-level
- No degraded mode: pipeline stalls and nobody notices for 48 hours
- QC is manual review of every clip (doesn't scale)
**Max length:** 1-2 pages
**Confidence:** 🟡 hypothesis

## Quality checklist
- [ ] No section assumes human content creation labor (this is about automation)
- [ ] Folder structure is fully defined with every path documented
- [ ] Every tool is named (no "we'll find a tool for this")
- [ ] OpusClip workflow is step-by-step with a tested fallback
- [ ] Dark channel has brand firewall and niche criteria
- [ ] Auto-posting covers all 13 accounts from doc #7
- [ ] Monthly cost estimate is aggregated and compared to margin targets
- [ ] Pipeline can run without founder involvement after MVP validation
- [ ] MVP pipeline defined: manual walk-through of each step before automating
- [ ] FTC/platform AI content disclosure rules are addressed
- [ ] Voice cloning consent and quality gates are specified
- [ ] Content deduplication rules prevent same clip on multiple accounts per platform
- [ ] Ban recovery protocol exists
- [ ] Degraded mode operations are defined for each pipeline stage

## Assumptions registry
| Assumption | Confidence | Signal that proves it wrong |
|---|---|---|
| OpusClip produces usable clips from Henry+Indy's recording setup | 🔴 guess | First batch of clips are unusable (bad cuts, wrong moments) |
| Platform APIs allow automated posting at this volume | 🔴 guess | TikTok or Instagram revokes API access |
| Voice cloning quality is sufficient for personal brand content | 🔴 guess | Test audience can't tell clone from real OR clone is uncanny valley |
| 13 accounts from same IP won't trigger coordinated behavior detection | 🔴 guess | Accounts get shadow-banned within first month |
| Total automation cost stays under $500/month | 🔴 guess | Costs exceed $800/month at full scale |
| AI-generated brand content gets comparable engagement to human content | 🔴 guess | Brand account engagement is <10% of personal accounts |
| Dark channel content generates meaningful reach | 🔴 guess | Channel gets zero traction after 30 days |
| Folder-based pipeline handles the volume without a queue system | 🟡 hypothesis | Pipeline breaks above 100 files/day |

## Adversarial review summary
Adversarial review (Claude subagent) flagged 6 HIGH, 7 MEDIUM, 4 LOW findings. Key resolutions:
- **Legal compliance section added** (HIGH — FTC, platform ToS, voice cloning consent)
- **Human-to-AI transition section added** (HIGH — disclosure, quality gates, audience communication)
- **MVP pipeline concept added** to Section 1 (HIGH — validate before automating)
- **Content deduplication rules** added to distribution section (MEDIUM)
- **Cost model elevated** from simple registry to budget ceiling analysis (MEDIUM)
- **Degraded mode operations** added to monitoring section (MEDIUM)
- **Scope boundary with doc #41 defined** in document scope (MEDIUM)
- **OpusClip + AI pipeline merged** into single production section (LOW — architectural clarity)
- **Metadata + auto-posting merged** into single distribution section (LOW — natural workflow)
- **Ban recovery protocol** added to compliance section (HIGH)

## Reader journey
**After this document:** The pipeline is designed. Next: build the MVP pipeline (manually process one podcast through every step), then automate. In parallel: build the landing page (doc #5 spec).
**Last section should bridge to:** "Pipeline designed. MVP validated. Landing page built. Product launched. Doc #41 (Content Automation Hardening) picks up after 8 weeks of operational data."

## Decision log
| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-06 | 9 sections (after merging overlaps, adding legal/transition/MVP) | Adversarial review: legal is the highest risk, MVP prevents over-engineering | If 9 is too dense, split production pipelines into two sections |
| 2026-04-06 | MVP pipeline before full automation | No podcast has been recorded yet. Can't automate what hasn't been validated. | If MVP validates clean on first try, accelerate automation |
| 2026-04-06 | Legal compliance as dedicated section | FTC, voice cloning, platform ToS are real legal risks, not nice-to-haves | If legal counsel says risk is minimal, reduce to a subsection |
| 2026-04-06 | Doc #8 designs pipeline, Doc #41 hardens it | Separation of "make it work" from "make it efficient" | If doc #41 scope is empty after doc #8, merge them |
