# Jobs-to-be-Done — Business Decisions Platform
**Version:** 1.0
**Date:** 2026-04-07
**Status:** Draft
**Author:** Henry + Claude
**Input:** decisions/businessdecisions/07-jtbd/input.md
**Pipeline:** d-jtbd (here) → d-prd → d-tasks → d-code
**Reference input:** decisions/08-short-video-viral-strategy/document.md (content pipeline = BD MVP)

## Document scope
**This document IS:** A JTBD analysis mapping the exact jobs Business Decisions customers are hiring a solution for — functional, emotional, and social. Every feature in the BD PRD must trace back to a job or underserved outcome documented here.
**This document is NOT:** A PRD (that's doc 08). Not the BD methodology (that's doc 03). Not the content pipeline spec (that's shared doc 08). Not marketing copy.
**Primary framework:** Moesta (qualitative/switch-driven) as primary lens. Ulwick (outcome statements, job map) as supplementary structure.
**Scope boundary:** Business Decisions B2B product ($1,997/year → $4,997 future). The platform side, not the course side.
**Research status:** ALL findings are hypotheses. Pre-revenue, no external customer data. Henry is the first customer (dogfooding). Confidence tags on every section.
**Primary reader:** Henry (build decisions), AI agents (implement features)
**Depends on:** Business Model (doc #1), Short-Video Viral Strategy (doc #8), Business Decisions reference (businessdecisions.md)
**Feeds into:** BD PRD (doc #8 in businessdecisions/) — every PRD feature must trace to a finding here

---

## 1. Overview — Research Context

### The One-Person Unicorn Thesis

The original "Drowning Builder" persona (doc #1) described a non-tech entrepreneur who drowns in planning. That persona is real but incomplete. The deeper job — revealed through founder experience — is the **one-person unicorn**: a solo operator who wants to build a company that generates massive revenue with zero team, powered entirely by AI agents and automation.

This is not a hypothetical future customer. Henry IS this customer. He can't keep doing manual work. He needs to automate everything. The Business Decisions platform exists because he needs it to exist.

**Critical framing shift:** The BD product is not "a course with APIs." It is an **automation platform for one-person businesses** that happens to include a course teaching the methodology behind it. Software-first, course-second.

**How to read this document:**
- Every section ends with "PRD implications" — the product decisions this finding demands
- Confidence tags: 🟢 validated | 🟡 hypothesis | 🔴 guess
- The content pipeline (doc #8) is treated as the MVP reference throughout
- Platform phases (1-4) map to the job chain in Section 6

**How findings feed into the PRD:**
- Underserved outcomes (Section 7) → feature requirements
- Emotional/social jobs (Section 3) → UX principles (agent-first, no dashboards)
- Forces of progress (Section 4) → onboarding and conversion design
- Hiring/firing criteria (Section 5) → success metrics and churn prevention
- "Don't build" list (Section 9) → explicit scope boundaries
- Platform phases (Section 6) → development roadmap sequencing

**Confidence:** 🟢 validated (this section is structural, not a finding)

---

## 2. Customer Segments by Struggling Moment

JTBD segments by the situation that creates demand, not by demographics. The original business model defined one persona ("The Drowning Builder"). The founder interview reveals two distinct segments — same platform, different entry points.

### The Universal Trigger: Manual Work Hitting a Wall

Every BD customer hits the same wall: the gap between what they KNOW they should be doing and what they can ACTUALLY execute alone. The trigger is not a single event. It's the accumulation of manual labor that doesn't scale. They've been posting manually, emailing manually, managing manually. They look at what AI-native builders are shipping and realize their manual workflow is a death sentence.

The threshold crosses when the cost of staying manual exceeds the cost of learning a new system.

### Segment 1: "The Manual Operator"
**Struggling moment:** Already has a business or revenue stream. Already creates content. Already has an audience (small or medium). But everything is manual. They post by hand. They edit by hand. They manage by hand. The business works but it's eating their life. They just realized: "I can't scale myself. I need systems, not more hours."

**What progress looks like:** The business runs while they sleep. Content goes out automatically. Leads come in automatically. They make decisions and the system executes. The gap between "having a business" and "having a business that runs itself" closes.

**Current workarounds:** VAs and freelancers ($1,000-5,000/month), no-code tools (Zapier/Make), manual AI chat sessions (ChatGPT/Claude without persistence), buffer/hootsuite for posting.

**Why workarounds fail:** VAs require management (you traded one manual task for another). No-code tools break at scale and can't customize. AI chat has no memory — every session starts from scratch. None of these compose into a coherent system. The operator is duct-taping tools together instead of building infrastructure.

**Confidence:** 🟡 hypothesis — based on Henry's direct experience as this exact segment

### Segment 2: "The Stuck Starter"
**Struggling moment:** Has domain expertise (fitness, coaching, consulting, creative work). Has an idea for a content business. Has maybe even started creating. But the gap between "having content in Google Docs" and "having a distribution system that reaches people" is paralyzing. They've spent $2K-10K on business courses that taught theory. They still can't ship.

**What progress looks like:** A working system — not just knowledge about systems. Content goes from creation to distribution without them figuring out each platform, each tool, each API. They want someone to give them the exact playbook AND the tools to run it.

**Current workarounds:** Business courses ($997-4,997), YouTube tutorials, "building in public" without shipping, Notion templates, free trials of 15 different tools.

**Why workarounds fail:** Courses teach frameworks without infrastructure. The student finishes the course and still has to figure out the tech. YouTube gives fragments, not systems. "Building in public" becomes performance art for an audience of peers, not customers. The gap between knowledge and execution persists because knowledge was never the bottleneck — infrastructure was.

**Confidence:** 🔴 guess — persona defined in business model but not validated. Henry relates to this from his past self but is not currently this segment.

### PRD implications
- **Two onboarding paths, one platform.** Operators need: "connect your existing content → automate distribution → add analytics." Starters need: "here's the playbook → follow the pipeline → your first automated post." Same features, different guided entry.
- **The content pipeline (doc #8) is the universal entry point.** Both segments need content distributed. That's where the platform starts.
- **Phase 3 timing is critical.** Don't sell to Segment 2 until the platform has proof (Henry's own results). Segment 2's anxiety ("does this work?") is only resolved by seeing Segment 1 results.

---

## 3. Main Job Statements + Job Hierarchy

### Main Job Statement

**"When I'm running a business solo and manual work is the bottleneck — I've already tried hiring, tools, and courses — I want an automation platform that turns my decisions into running systems, so I can scale revenue without scaling my time."**

This is the core functional job. It is:
- **Solution-agnostic:** No mention of AI agents, Claude, skills, or our product
- **Situation-specific:** "Running solo" + "manual work is the bottleneck" + "already tried" = our ICP
- **Stable:** This job existed before AI and will exist after — the tools change, the job doesn't

### Three Dimensions

**Functional:** Systematize my business so it runs without me doing everything manually. Automate content distribution, lead capture, sales, and customer support. Turn one input (a podcast, a piece of thinking) into many outputs (clips, posts, emails, leads) across many channels — automatically.

**Emotional:** Feel like I'm playing, not working. Feel like I "done it" — like I won the game of money. Not the grind of "building a business." The lightness of watching a system you built produce results while you do something else. The specific joy of automation: you set it up once and it keeps working.

**Social:** Be perceived as someone who lives the life they designed — freedom, autonomy, impact, without the typical founder sacrifice. Not "hustler." Not "grinder." Not even "entrepreneur." Someone who figured out how to build a machine that runs itself. The indie founder archetype. The one-person unicorn.

**Confidence:** 🟡 hypothesis — emotional and social jobs come directly from founder, not yet validated with external customers

### Job Hierarchy: Big Hire vs Little Hire

**Big Hire (drives acquisition):**
"Build a profitable AI-native infobusiness that runs itself."

This is the transformation promise. It's why someone pays $1,997 (eventually $4,997). The Big Hire is about BUILDING A MACHINE — not learning, not understanding, not planning. Building something that generates revenue autonomously.

**Little Hire (drives retention):**
"The automation keeps running and improving — I'd lose my distribution if I left."

The Little Hire is infrastructure lock-in, but the good kind. The content pipeline is posting every day. The AI agents are handling leads. The analytics are tracking what works. Leaving means rebuilding all of this from scratch. The platform becomes load-bearing infrastructure for their business.

Three mechanisms serve the Little Hire:
1. **Running automations:** The pipeline doesn't stop when you stop paying attention. Leaving = your content stops, your leads dry up, your agents go dark.
2. **Evolving platform:** New automations, new integrations, new AI capabilities ship continuously. The platform gets better while you sleep.
3. **AI credit system (Phase 3):** APIs routed through the platform mean one bill, one dashboard (agent-native, not SaaS-native), one integration point. Switching means re-wiring every API.
4. **Transaction layer (Phase 4):** When your customers pay through the platform (Stripe Connect), leaving means migrating your entire payment infrastructure.

**Confidence:** 🟡 hypothesis — Big Hire is strong. Little Hire mechanisms are designed but untested.

### PRD implications
- **The Big Hire determines the landing page promise** — "Build a business that runs itself with AI." Not "learn to build a business." BUILD one.
- **The Little Hire determines the moat** — each phase adds switching cost. Phase 1 (pipeline) is low switching cost. Phase 3 (AI credits) is medium. Phase 4 (payments) is high. The moat deepens over time.
- **Emotional job drives UX:** Every interaction must feel like play, not work. Agent-first means no dashboards, no clicking through menus. You talk to Claude, things happen. The system should feel like having superpowers, not like operating software.
- **Social job is the marketing** — case studies of one-person businesses running on the platform. "Built by one person. Runs itself."

---

## 4. Forces of Progress + Switching Timeline

### Push: Pain with Current Situation

| Push factor | Strength | Evidence |
|---|---|---|
| Manual work doesn't scale: posting, editing, managing by hand | **Critical** | Founder: "I can't keep doing manual stuff anymore. I need to automate EVERYTHING." |
| Hired help is expensive and still requires management | High | VAs cost $1K-5K/month and need supervision — you traded one bottleneck for another |
| No-code tools break at customization boundary | High | Zapier/Make work for simple flows but can't handle complex, multi-step AI pipelines |
| AI chat has no persistence — rebuilds from scratch every session | High | ChatGPT/Claude are powerful but stateless. No pipeline, no memory, no automation. |
| Business courses taught theory, gave no infrastructure | Medium | $2K-10K spent on courses that ended with "now go figure out the tech yourself" |
| Competitors using AI are shipping 10x faster | Medium | FOMO on the AI wave — the gap between AI-native and manual operators is widening daily |

### Pull: Attraction of New Solution

| Pull factor | Strength | Evidence |
|---|---|---|
| "The exact system that works — proven by the founders themselves" | **Critical** | Henry IS the first customer. The system is built for himself first. Dogfooding = proof. |
| Agent-first: no new UI to learn — you already use Claude | High | The platform runs inside Claude Code/Cowork. No new tool to adopt. |
| One input → many outputs: podcast → clips → posts → leads automatically | High | Doc #8 pipeline turns one recording into 150+ output files across platforms |
| Complete playbook + working infrastructure (not just knowledge) | High | Differentiator vs every course: you get the system, not just the theory |
| The one-person unicorn vision: "build a machine that runs itself" | Medium-High | Aspirational pull — the dream of a solo business that generates revenue while you sleep |
| Price-to-value: $1,997/year for infrastructure that would cost $10K+ to build | Medium | At scale, the platform replaces $5K+/month in VAs, tools, and manual labor |

### Anxiety: Fear of New Solution

| Anxiety factor | Strength | Evidence |
|---|---|---|
| "I haven't seen this work for anyone else yet" — no social proof | **Critical** | Founder identified this as the #1 barrier. New product, new category, zero testimonials. |
| "$1,997 is a lot for something unproven" | High | High ticket + no proof = high purchase anxiety. Amplified by graveyard of past course purchases. |
| "What if I can't use Claude Code? I'm not technical enough" | High | Agent-first means typing commands, not clicking buttons. Non-tech users may freeze. |
| "What if the automation breaks and I can't fix it?" | Medium | Infrastructure dependency: if the pipeline breaks at 2am, who fixes it? |
| "What if AI changes so fast this is obsolete in 6 months?" | Medium | Moving-target anxiety — the AI landscape shifts weekly. Will this platform keep up? |
| "What if this creates dependency on another platform?" | Low-Medium | Same anti-dependency thesis as Life Decisions — but here the platform IS infrastructure |

### Habit: Comfort with Current Coping

| Habit factor | Strength | Evidence |
|---|---|---|
| "I can do it manually, it just takes time" | High | Manual workflows are painful but familiar. Switching requires learning a new system. |
| Sunk cost in existing tools: "I already set up Zapier/Make/Buffer" | Medium | Existing automations, even bad ones, represent invested effort |
| "I'll hire someone to do it" — the VA/freelancer escape hatch | Medium | Hiring feels like solving the problem without changing your own behavior |
| "I'll figure it out myself with AI" — the DIY Claude/GPT approach | Medium | "I don't need a platform, I can just prompt Claude" — until you realize you're rebuilding the pipeline every time |
| Course addiction: "maybe the NEXT course will be the one" | Low-Medium | Less relevant for Segment 1 (operators), more for Segment 2 (starters) |

### Net Assessment

**Push + Pull > Anxiety + Habit** is NOT guaranteed. The critical barrier is anxiety ("no social proof"), amplified by the high price point ($1,997). This is why the founder decided to only sell in Phase 3 — after building proof with his own results.

**Strategic implication for the product:**
1. **Build first, sell second.** Phases 1-2 are internal dogfooding. Phase 3 is when external sales begin. The social proof problem is solved by BEING the proof.
2. **The "it works for me" case study is the #1 conversion asset.** Henry's own business running on the platform, with numbers, is worth more than any marketing copy.
3. **Technical anxiety requires a "Vibe Coding" bridge.** The bonus course ("Vibe Coding for Non-Tech Creators") exists specifically to reduce the "I can't use Claude Code" anxiety. It's not a nice-to-have — it's an anxiety reducer.
4. **Free trial or money-back guarantee is essential** at this price point with zero proof.

### Hiring Triggers (what causes them to buy)

1. **Seeing the founder's results:** "Henry runs his entire content operation with this. Here are the numbers." The proof-by-dogfooding moment.
2. **A manual workflow breaking point:** Posted 50 times manually this month. Edited 30 clips by hand. Answered 200 DMs. The body says "enough."
3. **Watching a demo of the pipeline:** Seeing one podcast become 150 distributed posts in 2 hours — that's the "I need this" moment.
4. **Peer adoption:** When other solo founders in their network adopt the platform. "If they're using it, I should be too."

### Firing Triggers (what would cause them to leave)

1. **"The automation keeps breaking and nobody fixes it."** If the pipeline requires constant babysitting, it's worse than manual — it's manual PLUS debugging.
2. **"I'm paying $1,997 but I'm only using the content pipeline."** If later phases (AI agents, credits, payments) don't ship, the price-to-value ratio deteriorates.
3. **"AI moved and the platform didn't."** If Claude ships a major update and the platform takes months to adapt, the cutting edge becomes the trailing edge.
4. **"I outgrew it."** If the platform can't handle their scale (10x content, 10x customers), they'll build custom.

**Confidence:** 🟡 hypothesis — forces identified from founder experience and market pattern analysis

### PRD implications
- **Phase 3 launch requires Henry's case study as launch content** — revenue numbers, pipeline stats, time saved. Non-negotiable.
- **"Vibe Coding" bonus course ships WITH the platform, not after** — it's an anxiety reducer, not an upsell
- **Pipeline reliability is the #1 retention metric** — if the content pipeline has >5% failure rate, churn follows
- **Feature roadmap must be visible** — customers need to see that Phases 2-4 are coming. Reduces "am I paying $1,997 for just a content pipeline?" anxiety.
- **7-day money-back guarantee** — same as Life Decisions. At $1,997, the anxiety is 10x. The guarantee must be prominent.

---

## 5. Hiring/Firing Criteria

### What makes them choose us vs alternatives

| Criteria | Us (Business Decisions) | Business courses ($997-4,997) | Hiring VAs/freelancers | DIY with AI (ChatGPT/Claude) | No-code tools (Zapier/Make) |
|---|---|---|---|---|---|
| Working infrastructure | Yes — the pipeline runs | No — "now go build it" | Partially — they do the work, you manage | No — stateless, rebuilds every session | Partially — simple automations only |
| Agent-first (no new UI) | Yes — runs in Claude | N/A | N/A | Yes — but no persistence | No — new UI to learn |
| Proven by founders | Yes — dogfooding | Maybe — but their business isn't yours | N/A | N/A | N/A |
| Scales without humans | Yes — AI agents | No | No — more revenue = more VAs | Partially | Partially — breaks at complexity |
| Complete methodology | Yes — decisions + automation | Theory only | No methodology | No methodology | No methodology |
| Cost at scale | $1,997/year flat | $997-4,997 one-time + tools | $12K-60K/year + management time | $240/year (Claude Pro) + your time | $600-2,400/year + your time |

### The switching moment

The customer switches to BD when they realize: **"I don't need more knowledge. I don't need more help. I need a SYSTEM."**

Every alternative gives them a piece:
- Courses give knowledge without tools
- VAs give labor without systems
- AI chat gives intelligence without persistence
- No-code gives automation without customization

BD gives the system: methodology (what to decide) + automation (how to execute) + infrastructure (what runs it).

**Confidence:** 🟡 hypothesis

### PRD implications
- **The demo must show the SYSTEM running, not explain features.** "Watch this podcast become 150 posts" is the conversion event.
- **Comparison page on landing site** — explicitly compare to courses, VAs, DIY, no-code. Name the gap each one has. Show how BD fills all of them.
- **Position on cost:** "$1,997/year replaces $12K-60K/year in VAs and saves 20+ hours/week of manual work."

---

## 6. Job Chain — The Platform Phases

The customer journey maps directly to the four platform phases identified by the founder. Each phase has its own jobs, failure modes, and product implications.

### Phase 1: Making First Money (Content Pipeline + Analytics)

**Job:** "Turn my content into a distribution machine. I create once, the system posts everywhere."

**What they do:**
- Record a podcast or create content
- The pipeline (doc #8) clips, generates metadata, and distributes across 13 accounts
- Analytics show what's working — which clips, which platforms, which times

**What could go wrong:**
- Pipeline setup is too complex → they give up before first automated post
- Clip quality from OpusClip is poor → garbage distributed at scale is worse than no distribution
- Analytics are overwhelming → too many numbers, no clear "do this next" signal

**Product implication:** Phase 1 must be usable within 1 hour of setup. First automated post = first win. Analytics must surface ONE actionable insight, not a dashboard.

**Confidence:** 🟡 hypothesis

### Phase 2: Scaling the Operation (Multi-Channel AI Agents)

**Job:** "Handle everything that isn't content creation — leads, sales, support — so I only do the creative work."

**What they do:**
- AI agents handle DMs (Instagram, WhatsApp, Telegram)
- AI agents handle website live chat (sales + support)
- Lead capture and email nurturing run automatically
- Maybe: paid traffic automation (Facebook/Instagram ads managed by AI)

**What could go wrong:**
- AI agents say something wrong to a customer → trust destroyed, brand damaged
- Lead nurturing feels spammy → turns prospects off instead of warming them up
- Too many channels, not enough signal → agent sprawl without clear ROI per channel

**Product implication:** AI agents need guardrails (approved response patterns, escalation to human for edge cases). Channel expansion must be data-driven: add the next channel only when the current ones are performing.

**Confidence:** 🔴 guess — Phase 2 is designed but unbuilt. Agent quality and customer reception are unknown.

### Phase 3: New Clients (AI Credits + Course + Methodology)

**Job:** "Now that it works for me, package it so others can use it too. And make the platform handle the complexity of multiple users."

**What they do:**
- The BD course is created (teaches the methodology behind the platform)
- AI credit system abstracts away multiple API keys — one bill, one integration
- First external customers onboard
- The platform handles multi-tenancy (each client has their own decisions/ folder, their own pipeline)

**What could go wrong:**
- Non-tech customers can't use Claude Code → the "vibe coding" bridge isn't enough
- AI credit pricing is wrong → either too expensive (customers leave) or too cheap (we lose money)
- Course creation delays the platform → the course is important but the platform is the product

**Product implication:** AI credit system is the second moat after the pipeline. Get the unit economics right. The course ships AFTER the platform proves itself with Henry's results.

**Confidence:** 🔴 guess — Phase 3 is the expansion hypothesis. Zero data on whether external customers can use the platform.

### Phase 4: B2B Maturity (Payments + Multi-Team)

**Job:** "My customers transact through the platform. The platform becomes the operating system for my business AND theirs."

**What they do:**
- Stripe Connect enables client transactions through the platform
- BD takes a revenue cut (platform fee on client transactions)
- Multi-team features let clients have their own team members
- The flywheel: BD clients build their own funnels using the platform, their success = BD's proof

**What could go wrong:**
- Stripe Connect compliance and fraud handling → payments are complex and regulated
- Revenue share model is rejected by clients → "why should you take a cut?"
- Multi-team adds massive complexity → auth, permissions, isolation, billing per team

**Product implication:** Phase 4 is the endgame but should not be designed yet. The transaction layer is where the real business model lives — but it requires 50+ active clients to justify building. Defer all Phase 4 architecture until Phase 3 validates.

**Confidence:** 🔴 guess — Phase 4 is speculative. Market reception, regulatory requirements, and technical complexity are all unknown.

### PRD implications
- **Phase 1 is the ONLY phase that matters for V1.** Content pipeline + analytics. Everything else is future.
- **Phase 2 is the "second product" inside BD.** AI agents are a major feature set that should get its own JTBD when the time comes.
- **Phase 3 is the monetization gate.** Don't sell until you can show results. The course is the packaging, not the product.
- **Phase 4 is the moat.** Design for it conceptually but build nothing until Phase 3 proves the market.
- **Each phase is a natural upsell moment.** Phase 1 at $1,997. Phase 2 features could justify $2,997. Phase 3-4 features justify $4,997.

---

## 7. Outcome Statements + Opportunity Scoring

Outcome statements use Ulwick's format: "Minimize the [time/likelihood/effort] of [undesired outcome] when [circumstance]."

**Opportunity = Importance + max(Importance - Satisfaction, 0)**
- High opportunity (>15) = massively underserved = build now
- Medium opportunity (10-15) = underserved = build soon
- Low opportunity (<10) = adequately served or low importance = defer

### Phase 1 Outcomes (Content Pipeline)

| # | Outcome statement | Imp | Sat | Opp | Current solution |
|---|---|---|---|---|---|
| 1 | Minimize the time it takes to go from raw recording to distributed content across all platforms | 10 | 2 | 18 | Manual: 4-8 hours per episode. No solution automates end-to-end. |
| 2 | Minimize the likelihood of posting the same content on two accounts on the same platform | 8 | 3 | 13 | Manual tracking in spreadsheets. Error-prone at volume. |
| 3 | Minimize the effort of generating platform-specific metadata (descriptions, hashtags, CTAs) per clip | 9 | 2 | 16 | Manual writing per platform. Some tools (Buffer) help but don't customize per platform rules. |
| 4 | Minimize the time to identify which content performs best across platforms | 9 | 3 | 15 | Manual checking each platform's analytics. No unified view. |
| 5 | Minimize the likelihood of a posting failure going unnoticed for >24 hours | 7 | 2 | 12 | No monitoring. Failures discovered manually when someone checks. |
| 6 | Minimize the effort of recovering from a failed post or pipeline step | 7 | 1 | 13 | Manual diagnosis. Rebuild from scratch. No retry mechanism. |
| 7 | Minimize the time between recording and first post going live | 8 | 3 | 13 | Same-day is rare with manual process. Usually 2-3 day delay. |

### Phase 2 Outcomes (AI Agents + Lead Nurturing)

| # | Outcome statement | Imp | Sat | Opp | Current solution |
|---|---|---|---|---|---|
| 8 | Minimize the time spent responding to DMs and messages across platforms | 9 | 1 | 17 | Manual. Every DM answered by hand. Or ignored (lost leads). |
| 9 | Minimize the likelihood of a warm lead going cold because nobody responded in time | 9 | 2 | 16 | VAs help but are expensive and not 24/7. AI chat is stateless. |
| 10 | Minimize the effort of nurturing leads from first contact to purchase | 8 | 2 | 14 | Email sequences (Mailchimp/ConvertKit) exist but don't integrate with social + chat. |
| 11 | Minimize the likelihood of an AI agent saying something that damages the brand | 8 | 1 | 15 | No solution exists. AI agents without guardrails are a reputation risk. |

### Phase 3 Outcomes (Multi-Client)

| # | Outcome statement | Imp | Sat | Opp | Current solution |
|---|---|---|---|---|---|
| 12 | Minimize the effort of managing multiple API keys and billing for AI services | 7 | 1 | 13 | Manual. Each API has its own key, billing, and dashboard. |
| 13 | Minimize the time to onboard a new client onto the platform | 8 | 1 | 15 | No solution. Currently requires custom setup per client. |
| 14 | Minimize the likelihood of one client's actions affecting another client's data | 9 | 1 | 17 | No multi-tenancy. Isolation is manual. |

### Top Opportunities (sorted by score)

| Rank | # | Outcome | Opp | Phase |
|---|---|---|---|---|
| 1 | 1 | Raw recording → distributed content time | 18 | 1 |
| 2 | 8 | Time responding to DMs/messages | 17 | 2 |
| 3 | 14 | Client data isolation | 17 | 3 |
| 4 | 3 | Platform-specific metadata generation effort | 16 | 1 |
| 5 | 9 | Warm lead going cold | 16 | 2 |
| 6 | 4 | Identifying best-performing content | 15 | 1 |
| 7 | 11 | AI agent brand damage prevention | 15 | 2 |
| 8 | 13 | New client onboarding time | 15 | 3 |

**Key insight:** The top Phase 1 opportunity (score 18) validates that the content pipeline is the right MVP. The top Phase 2 opportunities (scores 17, 16) validate that AI agents for lead handling is the right second move.

**Confidence:** 🟡 hypothesis — importance scores are founder estimates, satisfaction scores are based on known alternatives

### PRD implications
- **Outcome #1 is the MVP success metric:** "Time from raw recording to all posts distributed." Target: <2 hours (from current 4-8 hours manual).
- **Outcome #3 is the second-most-important Phase 1 feature:** Automated metadata generation per platform. Not optional — it's the difference between "pipeline that posts" and "pipeline that posts WELL."
- **Outcome #4 (analytics) is Phase 1, not Phase 2.** You need to know what works before you can scale. Analytics ships with the pipeline, not after.
- **Phase 2 outcomes confirm AI agents are the right next step** — but Outcome #11 (brand damage prevention) means agents need guardrails from day one.

---

## 8. Success Metrics + Validation Plan

### Phase 1 Success Metrics

| Metric | Target | Why |
|---|---|---|
| Time: recording → all posts distributed | <2 hours | Currently 4-8 hours manual. 75% reduction = meaningful |
| Pipeline success rate | >95% of scheduled posts published | Doc #8 target. Below 85% = pipeline is unreliable |
| Content output | 30 clips/day distributed across accounts | Doc #8 scaling target (2 episodes × 15 clips) |
| Analytics insight delivery | 1 actionable insight per day | Not "here are numbers" but "double down on X, stop Y" |
| Time to first automated post | <1 hour from platform setup | Onboarding speed. If it takes a day, operators won't finish setup. |

### Validation Plan

| # | Hypothesis | Cheapest test | Timeline | Success signal |
|---|---|---|---|---|
| 1 | Content pipeline reduces distribution time by 75% | Run doc #8 MVP manually with one podcast episode | Phase 1, Week 1 | <2 hours from recording to all posts live |
| 2 | Automated metadata is as good as manual | A/B test: manual descriptions vs AI-generated on same clips | Phase 1, Week 2-4 | Engagement within 80% of manual posts |
| 3 | Analytics surface actionable insights | Use the pipeline for 4 weeks, review what analytics tell you | Phase 1, Month 1 | At least 2 decisions changed based on analytics data |
| 4 | The platform is usable by non-Henry humans | Have Indy run the pipeline end-to-end without Henry's help | Phase 1, Month 2 | Indy completes the full cycle solo |
| 5 | AI agents can handle DMs without brand damage | Run agent on Henry's least-important account for 2 weeks | Phase 2, Month 1 | Zero brand-damaging responses in 100+ interactions |
| 6 | External customers can onboard and use the platform | Onboard 3 beta users (friends/network) at reduced price | Phase 3, Month 1 | 2/3 achieve first automated post within 1 hour |

**Confidence:** 🟡 hypothesis — metrics are targets, not validated benchmarks

### PRD implications
- **Validation #1 is the gate to building automation.** If the manual pipeline doesn't work, don't automate it.
- **Validation #4 (Indy test) is the gate to selling.** If Indy can't use it, non-tech customers can't either.
- **Validation #6 is the gate to Phase 3 pricing.** If beta users struggle, the course needs to ship before external sales.

---

## 9. Don't Build List

Features that CONTRADICT the jobs identified. Building these would actively harm the product.

| # | Don't build | Why it contradicts the job | JTBD reference |
|---|---|---|---|
| 1 | **A traditional SaaS dashboard** | The emotional job is "playing, not working." Dashboards are work. The agent-first architecture means you TALK to the system, not CLICK through it. A dashboard kills the thesis. | Emotional job: "feel like I'm playing" |
| 2 | **Done-for-you services** | The social job is "someone who lives the life they designed." DFY creates dependency — the same anti-dependency thesis as Life Decisions. They want to OWN the machine, not rent your labor. | Social job: freedom + autonomy |
| 3 | **A generic "start any business" course** | The functional job is "systematize MY business." Generic business courses are what they already bought and failed with. BD teaches the specific playbook for content-to-revenue with AI automation. | Segment 2: "courses taught theory without infrastructure" |
| 4 | **A community/forum** | The ICP is a solo operator who values autonomy. They don't want to network or share learnings in a forum. If social features exist, they should be about results (like Life Decisions' Wins Board), not discussion. | Social job: independence, not community |
| 5 | **Manual content creation tools** (video editors, graphic designers, writing assistants) | BD automates distribution, not creation. The operator creates the content (podcast, writing). The platform handles everything AFTER creation. Building creation tools dilutes focus and competes with tools that are already excellent (CapCut, Canva, Claude). | Functional job: "I create once, the system distributes" |
| 6 | **Real-time collaboration features** | One-person unicorn = one person. Multi-user collaboration is a Phase 4 concern at earliest. Building it now adds complexity that contradicts the solo-operator thesis. | Main job: "running a business solo" |
| 7 | **Gamification or engagement mechanics** | This is infrastructure, not a consumer app. The "engagement" is your business making money. You don't need streaks or badges to use something that generates revenue. | Emotional job: play, not work (gamification is work disguised as play) |

**Confidence:** 🟢 validated — these directly contradict stated jobs and were explicitly confirmed by the founder

### PRD implications
- **The PRD must include this list as explicit scope boundaries.** Every feature proposal gets checked against it.
- **"No dashboard" is the hardest constraint to maintain.** There will be pressure to build one when analytics and multi-client management arrive. The answer is always: "How would you do this by talking to Claude?"
- **"No DFY" defines the support model.** Support is "here's how to fix it yourself" not "we'll fix it for you."

---

## 10. Override Warnings

This JTBD introduces concepts that update or contradict earlier documents:

1. **Persona 3 ("The Drowning Builder") is incomplete.** The real ICP is broader: the "One-Person Unicorn" — solo operators who want full automation, not just non-tech entrepreneurs who need help starting. The business model doc should be updated to reflect the two sub-segments (Operators + Starters).

2. **"Software-first, course-second" is now explicit.** The business model doc treats course + skills + APIs as equal components. This JTBD clarifies: the platform (automation) is the product. The course is the packaging. The course doesn't ship until Phase 3.

3. **Four platform phases are now defined.** The business model doc has no phasing. The roadmap now includes these phases. The BD PRD should be structured around Phase 1 only, with Phase 2-4 as future scope.

4. **Pricing trajectory: $1,997 → $4,997.** The business model doc says $1,997 → $2,997 → $4,997 based on customer count. The founder now thinks $5K is the natural endpoint based on platform value, not customer count.

5. **AI credit system is a new concept.** Not in any previous doc. It's the Phase 3 moat — routing all APIs through the platform so customers have one bill, one integration point. Needs its own design doc when Phase 3 approaches.

6. **Stripe Connect / transaction layer is the endgame business model.** Not just subscription revenue — taking a cut of client transactions. This fundamentally changes the revenue model from the business model doc's "annual subscription only" framing.

**Files that need updating:**
- `decisions/01-business-model/document.md` — Persona 3 expansion, platform phases, pricing trajectory, transaction layer
- `decisions/businessdecisions.md` — reflect software-first framing, four phases, one-person unicorn thesis
- `decisions/roadmap.md` — already updated (2026-04-07) with software-first BD track

---

## Assumptions Registry

| # | Assumption | Confidence | Signal that proves it wrong |
|---|---|---|---|
| 1 | The one-person unicorn is a viable ICP beyond Henry | 🔴 guess | Zero interest from solo operators when the platform is shown |
| 2 | Content pipeline is the right MVP (highest-value first feature) | 🟡 hypothesis | Henry builds the pipeline and it doesn't meaningfully reduce his workload |
| 3 | Agent-first (no dashboard) works for non-Henry users | 🔴 guess | Indy can't complete the pipeline workflow without a visual interface |
| 4 | AI agents can handle customer interactions without brand damage | 🔴 guess | First 100 AI agent interactions include a brand-damaging response |
| 5 | $1,997/year is the right starting price | 🔴 guess | Beta users reject the price or churn within 3 months |
| 6 | AI credit system creates meaningful switching cost | 🔴 guess | Customers prefer managing their own API keys for transparency |
| 7 | Stripe Connect transaction fees are accepted by clients | 🔴 guess | Clients refuse to transact through the platform ("why should you take a cut?") |
| 8 | The platform can be built and maintained by one developer (Henry) | 🟡 hypothesis | Technical complexity of 4 phases exceeds solo developer capacity |
| 9 | Non-tech "starters" can use Claude Code with the Vibe Coding course | 🔴 guess | >30% of Segment 2 users fail to complete first automated post |
| 10 | Building for yourself first (dogfooding) produces a product others want | 🟡 hypothesis | Henry's needs are too specific/technical for the broader market |

---

## Decision Log

| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-07 | ICP expanded from "Drowning Builder" to "One-Person Unicorn" with two sub-segments | Henry's own experience as first customer revealed the deeper job | If neither segment converts, the ICP needs more research |
| 2026-04-07 | Software-first, course-second | The platform IS the product. The course teaches the platform. Building the course before the platform is backwards. | If customers demand the course before using the platform, reconsider |
| 2026-04-07 | Four platform phases defined (pipeline → agents → multi-client → payments) | Natural progression from dogfooding → selling → scaling. Each phase adds switching cost. | If Phase 1 takes >3 months, simplify the phase model |
| 2026-04-07 | Don't sell until Phase 3 | No social proof = no conversion at $1,997. Build the proof first. | If opportunities arise to sell earlier (warm leads), take them as beta |
| 2026-04-07 | Content pipeline (doc #8) is the BD MVP | Highest opportunity score (18). Serves both BD product and LD distribution. | If the pipeline doesn't reduce manual work by 75%, reassess |
| 2026-04-07 | No dashboard — agent-first is non-negotiable | Contradicts the emotional job ("playing, not working") and the one-person unicorn thesis | If Indy can't use the agent-first interface, add a thin UI layer (not a dashboard) |
| 2026-04-07 | AI credit system is the Phase 3 moat | One bill, one integration = high switching cost. Solves the "too many API keys" problem. | If customers prefer managing their own APIs, drop this feature |

---

**Next step:** Run `/d-prd` to define the Business Decisions Platform MVP (Phase 1 only: content pipeline + analytics). Use this JTBD as the primary input — every feature must trace to an outcome statement above.
