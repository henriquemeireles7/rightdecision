# Short-Video Viral Strategy — The Right Decision
**Version:** 1.0
**Date:** 2026-04-06
**Status:** Draft
**Author:** Henry + Indy + Claude
**Meta-doc:** decisions/08-short-video-viral-strategy/meta.md
**Input:** decisions/08-short-video-viral-strategy/input.md + raw.md
**Pipeline:** d-meta → d-input → d-plan (here) → d-tasks

## Document scope
**This document IS:** The complete content production + distribution automation pipeline. From podcast recording to posted clip, fully automated.
**This document is NOT:** The social media setup (doc #7 — accounts, bios, templates). Not the knowledge base (doc #9). Not paid traffic (doc #21). Not content automation hardening (doc #41 — optimizes this pipeline after 8 weeks of data).
**Scope boundary with doc #41:** This doc designs the pipeline. Doc #41 hardens it: performance tuning, cost optimization, replacing tools with custom code where ROI justifies it.
**Primary reader:** Henry (builds the pipeline), AI agents (operate within it).
**Depends on:** Doc #7 (accounts, templates, cross-posting rules), Doc #9 (folder structure, transcript taxonomy)
**Feeds into:** Doc #41 (Content Automation Hardening), Doc #21 (Paid Traffic — repurpose organic content as ads)

---

## 1. Automation Philosophy + Principles

### The thesis

Volume beats perfection. 100 mediocre clips distributed across 13 accounts will outperform 5 perfect clips on 1 account. The algorithm rewards consistency and volume. The audience rewards authenticity and frequency. The business rewards reach and conversion.

### Principles

1. **Existing tools first, custom code for orchestration.** Use OpusClip for clips, ElevenLabs for voice, Buffer for posting. Build the GLUE in Bun/TypeScript. Don't rebuild what others have already optimized.

2. **Custom pipeline, not workflow tools.** No n8n, no Make.com, no Zapier. The pipeline is Bun/TypeScript code that Henry owns and controls. It lives in the codebase, follows DSA architecture, and is version-controlled. Vendor dependency is in the tools (OpusClip, ElevenLabs), not in the orchestration layer.

3. **Folder-based triggers.** Files appearing in folders trigger processing. This is the simplest reliable pattern: drop a file, things happen. File watchers (chokidar or Bun's built-in fs.watch) trigger the pipeline.

4. **Validate before automating.** The MVP pipeline runs every step manually with one podcast episode. Only after the manual run validates every step does automation begin.

### MVP Pipeline (do this first)

Before building any automation:

1. Record one 30-min podcast
2. Manually upload to OpusClip → get 5-10 clips
3. Manually write descriptions for each clip per platform (using doc #7 templates)
4. Manually post to 2-3 accounts (one per platform)
5. Manually transcribe the episode → file in `decisions/podcasts/general/`
6. Check: are the clips good? Do the templates work? Does anything break?

If the MVP works, automate step by step. If it doesn't, fix the input quality before automating garbage.

---

## 2. Folder-Based Pipeline Architecture

### The pipeline

```
content-pipeline/
├── input/                              ← Drop raw podcast video here
│   └── 2026-04-06-01-general.mp4       ← Triggers processing
│
├── processing/                         ← In-flight (files being processed)
│   ├── clips/                          ← OpusClip output staging
│   ├── ai-generated/                   ← AI-originated content staging
│   └── metadata/                       ← Description/hashtag generation staging
│
├── output/                             ← Ready to post, organized by platform
│   ├── tiktok/
│   │   ├── therightdecision/
│   │   ├── indykaz/
│   │   └── henrykaz/
│   ├── instagram/
│   │   ├── therightdecision/
│   │   ├── indykaz/
│   │   └── henrykaz/
│   ├── facebook/
│   │   ├── therightdecision/
│   │   ├── indykaz/
│   │   └── henrykaz/
│   ├── x/
│   │   ├── therightdecision/
│   │   ├── indykaz/
│   │   └── henrykaz/
│   └── youtube/
│       └── therightdecision/
│           ├── shorts/
│           └── full/
│
├── posted/                             ← Archive of posted content
│   └── 2026-04-06/                     ← Organized by date
│
├── failed/                             ← Failed processing or posting
│   └── 2026-04-06/
│
└── manifest.json                       ← State tracking: what's processed, what's pending
```

### File flow

```
input/ → [file watcher triggers] → processing/clips/ (OpusClip)
                                 → processing/ai-generated/ (if AI content triggered)

processing/clips/ → [clip scored + approved] → processing/metadata/ (description generation)
processing/ai-generated/ → [quality check] → processing/metadata/

processing/metadata/ → [metadata attached] → output/{platform}/{account}/
                                           → [deduplication check: no same clip on same platform twice]

output/{platform}/{account}/ → [auto-poster] → posted/{date}/
                             → [if posting fails] → failed/{date}/
```

### Organization: platform first, then account

The output/ folder is organized **platform → account** (not account → platform) because:
- Each platform has different format requirements (output files for TikTok are different from YouTube)
- Auto-posting tools typically work per-platform (one API per platform)
- Cross-posting rules from doc #7 apply at the platform level

### State tracking

`manifest.json` tracks:
```json
{
  "2026-04-06-01-general.mp4": {
    "status": "completed",
    "input_time": "2026-04-06T09:00:00Z",
    "clips_generated": 12,
    "clips_approved": 10,
    "clips_posted": 10,
    "clips_failed": 0,
    "platforms_posted": ["tiktok", "instagram", "youtube"],
    "transcript_filed": "decisions/podcasts/general/2026-04-06-01-general.md"
  }
}
```

### Scaling limits

The folder-based pipeline works up to ~150 files/day in output/. Beyond that, consider:
- Moving to a SQLite database for state tracking (still local, no external dependency)
- Adding a queue system (BullMQ with Redis) if parallel processing becomes a bottleneck
- For now: folder + manifest.json is sufficient for 2 episodes/day × 15 clips = 30 clips → ~150 output files across platforms

### Cleanup policy

- `input/` files move to `posted/` after all derived content is posted (or `failed/` if something broke)
- `processing/` is always ephemeral — files here are in-flight and should be cleared within 24h
- `posted/` archives by date. Cleanup: delete archives older than 90 days (they exist on the platforms already)
- `failed/` requires manual review — files here need human attention

---

## 3. Content Production Pipelines

### Pipeline A: Podcast-Derived Clips (OpusClip)

**Input:** Raw podcast video (30-60 min, MP4)
**Tool:** OpusClip
**Output:** 10-15 short clips (15-60 seconds each)

**Step-by-step:**
1. Drop video file in `input/`
2. File watcher detects new file
3. Upload to OpusClip API (or manual upload if API not available)
4. OpusClip analyzes and produces clips with virality scores
5. Download clips with scores > threshold (start with 60/100, adjust based on results)
6. Clips land in `processing/clips/` with metadata: source video, timestamp range, virality score
7. Quality gate: auto-approve clips above score threshold, flag borderline clips for manual review

**OpusClip settings:**
- Target clip length: 30-60 seconds (optimal for TikTok/Reels)
- Include: key moments, emotional peaks, strong hooks
- Exclude: silence, filler, technical issues
- Captions: enable (OpusClip generates captions; remove for platforms where native captions are preferred)

**Fallback if OpusClip fails:**
- **Primary fallback:** Descript — import transcript, select highlights, export clips
- **Emergency fallback:** Manual clip selection using video editor (CapCut is free)
- Test the fallback with one episode so it's ready when needed

### Pipeline B: AI-Generated Content (brand accounts)

**Input:** Methodology content (angles, sins, course concepts from doc #2)
**Tools:** ElevenLabs (voice clone), HeyGen or similar (video generation), Canva/Figma (graphics)
**Output:** Original short-form videos and graphics

**Content types:**
| Type | Description | Tools | Example |
|---|---|---|---|
| **Talking head (AI)** | Henry or Indy's face + voice clone delivering a concept | HeyGen + ElevenLabs | "The most expensive thing in your life is the decision you haven't made." |
| **Faceless voiceover** | Voice clone over stock/generated visuals + text | ElevenLabs + stock video + CapCut | Warm-toned b-roll with Indy's voice explaining the dominant constraint |
| **Text-on-screen** | Bold text with Ethereal Warmth design, no voice | Canva/Figma templates | Instagram carousel: "8 Sins of Indecision" |
| **Podcast highlight reel** | Curated best moments with intro/outro overlay | CapCut + brand templates | "Best of this week" compilation |

**AI content generation workflow:**
1. Select concept (from manifesto angles/sins/hooks)
2. Generate script (AI writes, following human.md voice rules)
3. Generate audio (ElevenLabs voice clone of Henry or Indy)
4. Generate video (HeyGen for talking head, or assemble voiceover + visuals)
5. Add branding overlay (Ethereal Warmth lower third, CTA end card)
6. Files land in `processing/ai-generated/`
7. Quality gate: review first 10 AI videos closely. After quality is validated, move to spot-check (review 1 in 5)

**Voice clone training (one-time setup):**
1. Record 30+ minutes of clean speech per person (Henry and Indy separately)
2. Upload to ElevenLabs Professional Voice Cloning
3. Test clone against 10 sample scripts
4. Quality benchmark: blind test with 5 people — if 3/5 can't tell it's AI, clone is ready
5. Store model IDs securely (these are sensitive assets)

---

## 4. Dark Channel Concept

### What it is

A separate social media channel (or channels) that produces 100% AI-generated faceless content. No Henry, no Indy, no "The Right Decision" branding. A standalone niche content operation using the same pipeline infrastructure.

### Purpose

1. **Test virality mechanics** without risking the main brand
2. **Revenue diversification** (if the channel grows, it becomes its own asset)
3. **Pipeline stress test** (validates the AI content pipeline at higher volume)

### Niche selection criteria (niche TBD)

Pick a niche that:
- [x] Has high search volume for short-form content (TikTok/YouTube Shorts)
- [x] Is adjacent to the decision-making framework (so methodology knowledge applies)
- [x] Has proven faceless channel success stories (look for channels with 100K+ followers, no face)
- [x] Can be produced with text-on-screen + voiceover (no custom footage needed)
- [x] Doesn't require personal expertise beyond what Henry/Indy already have
- [x] Has monetization potential (sponsorships, affiliate, or funnel to a product)

**Candidate niches (evaluate later):**
- Stoic/discipline content for men (huge on TikTok, adjacent to decision-making)
- Business decisions / "how to make money" (Henry's future expansion)
- Relationship advice through the decision lens
- Productivity / "get unstuck" (directly overlaps with RD methodology)

### Brand firewall

- Separate accounts, separate email, no cross-linking to personal or brand accounts
- Different visual identity (NOT Ethereal Warmth — that's exclusively Right Decision)
- Different voice (if using voice clone, use a stock AI voice, not Henry/Indy)
- No mention of The Right Decision in content or bios
- If discovered and linked, the response is: "We run multiple content channels" (no denial, just neutral acknowledgment)

### Launch criteria

Don't launch until:
1. The main pipeline (Pipeline A + B) is running smoothly for 2+ weeks
2. A niche is selected based on the criteria above
3. A content plan exists: 30 videos worth of scripts pre-generated
4. The total tool cost stays within the $500/month ceiling

---

## 5. Distribution Pipeline — Metadata, Scheduling, Posting

### Metadata generation

After a clip lands in `processing/metadata/`, the system generates platform-specific metadata:

**Per platform:**
| Platform | Description length | Hashtag count | CTA | Special |
|---|---|---|---|---|
| TikTok | 1-2 sentences | 3-5 | "Follow for more" or "Link in bio" | Trending audio tag if applicable |
| Instagram | 1 paragraph + question | 5-10 | "Save this" or "Link in bio" | Alt text for accessibility |
| Facebook | 2-3 sentences + question | 0-3 | "Visit rightdecision.io" | No hashtag spam on FB |
| X/Twitter | 1-2 sentences, punchy | 0-2 | Link in reply tweet | Thread format for longer content |
| YouTube Shorts | 1-2 sentences | 3-5 | Subscribe CTA | Tags in video settings |

**Generation approach:**
- Use AI (Claude/GPT via API) to generate descriptions from the clip's transcript segment + doc #7's posting templates
- Each platform gets a unique description (doc #7 cross-posting rule: never copy-paste captions)
- Include UTM-tagged link where platform allows: `rightdecision.io?utm_source={platform}_{account}`

### Content deduplication

**Hard rule:** The same clip CANNOT appear on two accounts on the same platform.

**Allocation logic:**
1. OpusClip produces 10-15 clips per episode
2. Clips are scored by virality
3. Top 3 clips → brand accounts (highest-quality for the brand)
4. Next 3 clips → Indy personal accounts (clips featuring her voice/face prominently)
5. Next 2 clips → Henry personal accounts (clips featuring his perspective)
6. Remaining clips → rotated across accounts on different days (no same-day duplicate)

Across platforms, the same clip CAN appear on different platforms (TikTok clip ≠ Instagram Reel in the algorithm's eyes). But it must be adapted per doc #7's cross-posting rules (different caption, native upload, no watermarks).

### Scheduling

**Posting windows (per platform, in account's audience timezone):**
| Platform | Best times | Max posts/day/account |
|---|---|---|
| TikTok | 7-9am, 12-1pm, 7-9pm | 3 |
| Instagram | 8-9am, 12-1pm, 5-7pm | 2 (Reels) + 1 (Story) |
| Facebook | 9-11am, 1-3pm | 2 |
| X/Twitter | 8-10am, 12-1pm, 5-6pm | 5 (tweets) + 1 (video) |
| YouTube Shorts | 2-4pm | 1-2 |

**Scheduling logic:**
- Clips in `output/{platform}/{account}/` are scheduled based on the posting windows
- Stagger across accounts: don't post to @therightdecision and @indykaz on TikTok at the same time (reduces coordinated behavior signals)
- Minimum 2-hour gap between posts from different accounts on the same platform

### Auto-posting tools

| Platform | Auto-posting method | API status | Fallback |
|---|---|---|---|
| TikTok | TikTok Content Posting API (requires approved app) | Restricted — requires application | Publer ($28/month) or manual via scheduled reminders |
| Instagram | Meta Graph API (requires business account + app review) | Available but requires setup | Buffer ($15/month) or Later ($25/month) |
| Facebook | Meta Graph API (Pages only) | Available | Buffer |
| X/Twitter | Twitter API v2 (media upload + create tweet) | Available (Free tier: 1500 tweets/month) | Manual or Typefully ($12/month) |
| YouTube | YouTube Data API v3 (upload) | Available | Manual upload |
| Apple/Spotify | Podcast host auto-distributes via RSS | Automatic | N/A |

**Custom Bun/TypeScript approach:**
- Build posting scripts that call each platform's API directly
- Wrap in a CLI: `bun run post --platform tiktok --account therightdecision --file output/tiktok/therightdecision/clip-01.mp4`
- File watcher on `output/` triggers posting at scheduled times
- Log every post to `manifest.json` with timestamp, platform, account, status

---

## 6. Human-to-AI Transition Protocol

### The transition

Personal accounts (Indy, Henry) start with human-recorded content (podcast clips, manual posts). Over time, they transition to AI-first: voice clones, AI-generated talking head videos, and eventually AI characters.

### Phase 1: Human (now → comfort level reached)
- Post podcast clips (real recordings)
- Write manual posts when inspired
- Record voice training data for ElevenLabs (30+ min clean speech per person)

### Phase 2: Hybrid (after voice clone is ready)
- Podcast clips remain real (always)
- AI generates additional content: voiceover videos, quote graphics, response videos
- Mix: ~60% real clips, ~40% AI-generated
- Each AI post is labeled (see disclosure below)

### Phase 3: AI-First (future, when quality is indistinguishable)
- Most content is AI-generated, using podcast clips as the minority "anchor" content
- Voice clone handles the bulk of content production
- Founders focus on recording podcasts, not creating individual posts
- Mix: ~20% real clips, ~80% AI-generated

### Transition triggers

| Milestone | Trigger |
|---|---|
| Voice clone ready | Blind test: 3/5 people can't distinguish clone from real |
| Phase 2 starts | Voice clone passes quality test + 10 AI posts reviewed by founders |
| Phase 3 starts | AI content engagement is within 80% of human content engagement |

### Disclosure requirements

**FTC guidelines (current):** AI-generated content that appears to be a real person endorsing a product must be disclosed. This applies to commercial accounts promoting The Right Decision.

**Per-platform disclosure:**
| Platform | Required disclosure | How |
|---|---|---|
| TikTok | Yes (synthetic media policy) | Use TikTok's AI-generated content label |
| Instagram/Facebook | Yes (Meta AI content policy) | Use Meta's AI content label when available, or add "#AIgenerated" |
| X/Twitter | Yes (synthetic media policy) | Add disclosure in bio or per-post |
| YouTube | Yes (altered content policy) | Check the "altered/synthetic content" box in upload settings |

**Our policy:** Disclose ALL AI-generated content, even where not strictly required. Transparency builds trust. The brand is about honesty — being secretive about AI contradicts the manifesto.

**Disclosure format:** Small text overlay or caption note: "AI-assisted" or use the platform's built-in label.

---

## 7. Legal Compliance + Platform Policy

### Voice cloning consent

- Both founders sign a written consent form for voice cloning (even between spouses/co-founders, formalize it)
- The consent specifies: commercial use, social media distribution, AI model training
- The consent specifies: what happens if one founder leaves (voice model for that person is deleted)
- Store consent documents in a secure, non-public location

### Voice clone service terms

Before selecting a service, verify:
- [x] Service does NOT retain rights to the trained voice model
- [x] Service allows commercial use of generated audio
- [x] Data can be deleted upon request (GDPR/CCPA compliance)
- [x] Model is stored securely and not shared with other users

### Content rights

- All podcast recordings are owned by The Right Decision (the business entity)
- AI-generated derivative content (clips, voice clones, AI videos) is owned by the business
- Music/audio: use royalty-free only. No trending audio that isn't cleared for commercial use.
- Stock footage: use only from licenses that permit AI/commercial derivative works

### Coordinated behavior mitigation

Running 13 accounts for the same business triggers platform detection. Mitigation:

| Risk | Mitigation |
|---|---|
| Same IP for all accounts | Use different devices or residential proxies for different account groups |
| Same posting times | Stagger by 2+ hours between accounts on the same platform |
| Similar content | Deduplication rules (Section 5) ensure no same clip on same platform |
| Same link in all bios | All bios link to rightdecision.io — this is legitimate. The issue is behavioral, not link-based. |
| Account registration pattern | Create accounts over multiple days, not all at once |

### Ban detection and recovery

**Detection signals:**
- Sudden reach drop (>50% week-over-week) = likely shadow ban
- Unable to post or engage = temporary restriction
- Account removed from search = confirmed shadow ban

**Recovery protocol:**
1. Stop posting from the affected account for 48-72 hours
2. Remove any flagged content
3. Post 2-3 organic, non-promotional pieces to "reset" the account
4. If permanently banned: appeal through platform's process + create new account with similar (not identical) handle
5. Never publicly complain about bans (invites scrutiny)

**Backup:** For brand accounts, maintain a "backup handle" registered but dormant on each platform.

---

## 8. Tools + Services Registry + Cost Model

### Tool registry

| Tool | Purpose | Plan | Monthly cost | API available? | Alternative |
|---|---|---|---|---|---|
| **OpusClip** | Podcast → clips | Pro ($29/mo) | $29 | Yes (limited) | Descript ($24/mo), manual (CapCut, free) |
| **ElevenLabs** | Voice cloning | Scale ($99/mo) | $99 | Yes | PlayHT ($39/mo), Resemble.ai ($25/mo) |
| **HeyGen** | AI talking head video | Creator ($48/mo) | $48 | Yes | Synthesia ($29/mo), D-ID ($26/mo) |
| **Buffer** | Auto-posting (IG, FB) | Essentials ($15/mo) | $15 | Yes | Publer ($28/mo), Later ($25/mo) |
| **Whisper** | Transcription | Self-hosted (free) | $0 | Local | Deepgram ($0.0043/min ≈ $8/mo) |
| **CapCut** | Video editing/assembly | Free | $0 | No | DaVinci Resolve (free) |
| **Canva** | Graphics/carousels | Pro ($15/mo) | $15 | Yes | Figma (free) |

### Monthly cost projection

| Stage | Estimated monthly cost | What's running |
|---|---|---|
| **MVP (Month 1)** | ~$60 | OpusClip + Whisper + CapCut (mostly free/manual) |
| **Pipeline live (Month 2)** | ~$250 | + ElevenLabs + Buffer + basic automation |
| **Full scale (Month 3+)** | ~$400 | + HeyGen + Canva + all 13 accounts automated |
| **With dark channel** | ~$450 | + additional posting volume |

**Budget ceiling: $500/month.** At projected revenue of $9,850/month (50 sales), automation costs are ~5% of revenue. Well within the 97% margin target when combined with $35/month infrastructure.

### Cost per clip

At full scale: $400/month ÷ 900 clips/month (30/day × 30 days) = **$0.44 per clip**.

### Exit criteria (build vs. buy)

Replace a paid tool with custom code when:
- The tool costs >$100/month AND has a simple-to-replicate core function
- The tool's API is unreliable (>5% failure rate over 30 days)
- Lock-in risk is high (no data export, proprietary format)
- Doc #41 will evaluate each tool after 8 weeks of operational data

---

## 9. Monitoring, QC + Failure Recovery

### What this section monitors

**Pipeline health** (not account-level metrics — those are in doc #7, Section 8).

### Key pipeline metrics

| Metric | Target | Alert threshold |
|---|---|---|
| Input processing time | <2 hours from drop to posted | >6 hours |
| Clip approval rate | >70% of OpusClip clips pass quality threshold | <50% |
| Posting success rate | >95% of scheduled posts published | <85% |
| Queue depth | <50 unposted clips at any time | >100 |
| Failed posts in last 24h | 0 | >5 |
| AI content quality (spot check) | 4/5 pass manual review | 2/5 or lower |

### Quality gates

| Stage | Gate | Action if fails |
|---|---|---|
| OpusClip output | Virality score > threshold | Clip goes to `failed/`, not processed further |
| AI-generated content | Spot check (review 1 in 5) | Pause AI pipeline, review settings, adjust |
| Voice clone audio | Blind test quality check (monthly) | Retrain model or adjust parameters |
| Metadata generation | Spot check descriptions for accuracy | Fix template, regenerate metadata |
| Auto-posting | Platform confirms post was published | Retry once. If fail again, move to `failed/` for manual posting |

### Degraded mode operations

| Component down | Impact | Degraded mode | Recovery |
|---|---|---|---|
| OpusClip | No new clips from podcasts | Switch to Descript or manual clip selection | Resume when API recovers |
| ElevenLabs | No AI voice content | Post text-only and graphic content (Pipeline B, text-on-screen type) | Resume when API recovers |
| HeyGen | No AI talking head videos | Post voiceover-only videos (ElevenLabs + stock visuals) | Resume when API recovers |
| Auto-posting API | Clips ready but not posting | Manual posting from `output/` folders. Prioritize: Instagram → TikTok → YouTube | Resume when API recovers |
| All tools | Pipeline fully stalled | Post podcast clips manually (always have raw clips as fallback) | Diagnose and fix. If >48h, switch to manual operation |

### Daily pipeline check (5 min)

1. Check `manifest.json`: any inputs pending >6 hours? → Investigate
2. Check `failed/`: any new failures? → Triage
3. Check posting logs: all scheduled posts went out? → Manual post any misses
4. Quick scroll through today's posted content: anything look wrong? → Pull it down

---

## Quality Checklist

- [x] No section assumes human content creation labor
- [x] Folder structure fully defined with every path documented
- [x] Every tool is named with cost and alternative
- [x] OpusClip workflow is step-by-step with Descript as fallback
- [ ] Dark channel: niche TBD (criteria defined, selection deferred)
- [x] Auto-posting covers all 13 accounts from doc #7
- [x] Monthly cost estimate: ~$400 at full scale, within $500 ceiling
- [x] Pipeline can run without founder involvement after MVP
- [x] MVP pipeline defined (manual walk-through before automating)
- [x] FTC/platform AI disclosure addressed
- [x] Voice cloning consent and quality gates specified
- [x] Content deduplication rules prevent same clip on same platform
- [x] Ban recovery protocol exists
- [x] Degraded mode operations defined for each pipeline stage

**Result: 13/14 criteria met.** Dark channel niche selection deferred (by design).

---

## Assumptions Registry

| Assumption | Confidence | Signal that proves it wrong |
|---|---|---|
| OpusClip produces usable clips from Henry+Indy's setup | 🔴 guess | MVP test: first batch of clips are unusable |
| TikTok Content Posting API access is obtainable | 🔴 guess | Application denied → use Publer or manual posting |
| Voice clone quality passes blind test | 🔴 guess | 3/5 testers identify the clone easily |
| 13 accounts won't trigger coordinated behavior detection | 🔴 guess | Shadow-ban within first month despite mitigations |
| $400-500/month covers all tools at scale | 🟡 hypothesis | Hidden costs (API overages, premium tiers) push above $500 |
| Custom Bun/TypeScript pipeline is faster to build than using n8n | 🟡 hypothesis | Pipeline takes >2 weeks to build vs 2 days in n8n |
| Folder-based architecture handles 150 files/day | 🟡 hypothesis | Performance degrades, need to switch to queue system |
| AI-generated brand content gets meaningful engagement | 🔴 guess | <1% engagement rate after 30 days |
| Dark channel can generate reach without main brand association | 🔴 guess | Zero traction after 30 days of content |

---

## Decision Log

| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-06 | Custom Bun/TypeScript pipeline, no workflow tools | Full control, no vendor dependency, fits DSA architecture | If build takes >2 weeks, reconsider n8n as interim |
| 2026-04-06 | $500/month budget ceiling for tools | ~5% of projected revenue, core competitive advantage | If revenue is lower than projected, tighten to $300 |
| 2026-04-06 | Dark channel niche deferred | Need main pipeline running first. Criteria defined for future selection. | Launch dark channel after main pipeline has 2+ weeks of stable operation |
| 2026-04-06 | MVP pipeline before any automation | No podcast recordings exist yet. Validate before automating. | If MVP succeeds clean, accelerate to automation |
| 2026-04-06 | Disclose all AI content (exceed legal minimums) | Brand is about honesty. Hiding AI contradicts the manifesto. | If disclosure hurts engagement >20%, reconsider approach |
| 2026-04-06 | Voice clone consent formalized in writing | Even between co-founders, written consent protects the business | Standard legal practice |
| 2026-04-06 | Output organized platform → account (not account → platform) | Matches API structure (one API per platform) and cross-posting rules | If account-level management becomes a pain, consider restructuring |

---

## Override Warnings

This document introduces concepts that affect other documents:

1. **Custom Bun/TypeScript pipeline** is new. This will live in the codebase alongside the product. Needs a SPEC.md when implemented. May affect platform/server architecture.
2. **$500/month tool budget** should be added to doc #1's unit economics (currently lists $35/month infrastructure only).
3. **AI content disclosure policy** ("disclose everything") should be added to the manifesto (doc #2) as a brand principle — transparency is on-brand.
4. **Doc #41 scope clarified:** "Content Automation Hardening" not "Content Automation" — doc #8 designs the pipeline, doc #41 optimizes it.
5. **Voice clone assets** are sensitive business assets. Security handling should be noted in CLAUDE.md.

---

**Next step:** The 3 distribution documents (7, 8, 9) are complete. The path forward: build the landing page (doc #5 spec) → build the product → record first podcast → run MVP pipeline → automate → v1 launch.
