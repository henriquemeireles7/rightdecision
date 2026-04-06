# Social Media Setup — The Right Decision
**Version:** 1.0
**Date:** 2026-04-06
**Status:** Draft
**Author:** Henry + Indy + Claude
**Meta-doc:** decisions/07-social-media-setup/meta.md
**Input:** decisions/07-social-media-setup/input.md + raw.md
**Pipeline:** d-meta → d-input → d-plan (here) → d-tasks

## Document scope
**This document IS:** The complete social media infrastructure — every account, its identity, what it posts, how content flows from podcasts to platforms, and the operational plan to run 13 accounts simultaneously using AI-first content production.
**This document is NOT:** The content automation pipeline (doc #8). Not the knowledge base (doc #9). Not paid traffic (doc #21). Not the manifesto copy (doc #2, which feeds into this).
**Primary reader:** Henry (tech setup, integrations), Indy (account creation, engagement), AI agents (content generation, posting).
**Depends on:** Business Model (doc #1), Manifesto (doc #2), Course Outline (doc #4), DESIGN.md, human.md
**Feeds into:** Short-Video Viral Strategy (doc #8), Knowledge Base Strategy (doc #9), Paid Traffic (doc #21)

---

## 1. Account Registry + Access Management

### The accounts

| # | Platform | Handle | Type | Owner | ICP | Process |
|---|----------|--------|------|-------|-----|---------|
| 1 | TikTok | @indykaz | Personal | Indy | Women 30-50 | Human → AI-first |
| 2 | TikTok | @henrykaz | Personal | Henry | Men, business | Human → AI-first |
| 3 | TikTok | @therightdecision | Brand | Both | Everyone | 100% AI from day 1 |
| 4 | Instagram | @indykaz | Personal | Indy | Women 30-50 | Human → AI-first |
| 5 | Instagram | @henrykaz | Personal | Henry | Men, business | Human → AI-first |
| 6 | Instagram | @therightdecision | Brand | Both | Everyone | 100% AI from day 1 |
| 7 | Facebook | Indy Kaz | Personal/Page | Indy | Women 30-50 | Human → AI-first |
| 8 | Facebook | Henry Kaz | Personal/Page | Henry | Men, business | Human → AI-first |
| 9 | Facebook | The Right Decision | Page | Both | Everyone | 100% AI from day 1 |
| 10 | X/Twitter | @indykaz | Personal | Indy | Women 30-50 | Human → AI-first |
| 11 | X/Twitter | @henrykaz | Personal | Henry | Men, business | Human → AI-first |
| 12 | X/Twitter | @therightdecision | Brand | Both | Everyone | 100% AI from day 1 |
| 13 | YouTube | @therightdecision | Brand | Both | Everyone | Mixed (podcast = human, shorts = AI) |

**Plus podcast platforms (not social, but part of distribution):**

| Platform | Account name | Purpose |
|----------|-------------|---------|
| Apple Podcasts | The Right Decision | Full audio episodes |
| Spotify | The Right Decision | Full audio episodes |

### Handle fallback convention
If a handle is taken, try in order:
1. `therightdecision_` (underscore suffix)
2. `rightdecision` (drop "the")
3. `therightdecision.co` (if platform allows dots)
4. For personal: `indykaz_` → `indy.kaz` → `indykazconsulting`

### Access management
- All credentials stored in a shared password manager (1Password or Bitwarden)
- Both founders have admin access to all brand accounts
- Each founder is primary owner of their personal accounts, other founder is backup admin
- Backup email: a shared email (e.g., social@therightdecision.com) for all brand accounts
- 2FA enabled on all accounts from day 1

---

## 2. Bio + Description Copy

### Bio formula
**Personal accounts:** [Name] | [One-line positioning] | [CTA]
**Brand accounts:** [Brand promise] | [What you get] | [CTA]

### Platform character limits

| Platform | Bio limit | Name limit |
|----------|-----------|------------|
| TikTok | 80 chars | 30 chars |
| Instagram | 150 chars | 30 chars |
| X/Twitter | 160 chars | 50 chars |
| Facebook (Page) | 101 chars (intro) + 255 (about) | 75 chars |
| YouTube | 1000 chars (about) | 100 chars |

### Indy Kaz — personal bios

**TikTok (80 chars):**
> You know what to do. You just haven't decided yet. ↓ therightdecision.com

**Instagram (150 chars):**
> You already know what you need to do. You've known for months. I help you finally decide — and do it. 🔗 therightdecision.com

**X/Twitter (160 chars):**
> You don't need another book, another course, or another year of therapy. You need one decision. Co-founder @therightdecision. therightdecision.com

**Facebook (intro, 101 chars):**
> Helping women stop preparing and start deciding. Co-founder of The Right Decision.

**Facebook (about, 255 chars):**
> You've done the therapy, read the books, taken the courses. And you're still stuck. Not because you haven't tried hard enough — because you keep doing everything except deciding. I've been there. That's why we built The Right Decision. therightdecision.com

### Henry Kaz — personal bios

**TikTok (80 chars):**
> Building The Right Decision. Code + decisions + doing the thing.

**Instagram (150 chars):**
> Technical founder building The Right Decision. Decisions are the primitive. Everything else is noise. 🔗 therightdecision.com

**X/Twitter (160 chars):**
> Building @therightdecision — a methodology + AI that turns stuck goals into clear decisions. Previously: exits, almost unemployed, then one right decision.

**Facebook (intro, 101 chars):**
> Founder of The Right Decision. Decisions are the atomic unit of change.

**Facebook (about, 255 chars):**
> I had multiple companies. Exits. Then I was almost unemployed for a year. I did everything: therapy, meditation, books, plans. Still stuck. Then I stopped all of it and just did the thing. That's what we teach. therightdecision.com

### The Right Decision — brand bios

**TikTok (80 chars):**
> The one decision that transforms your life. $197/year. ↓ Link

**Instagram (150 chars):**
> Stop preparing. Start deciding. A methodology + AI that turns stuck goals into clear decisions and daily actions. $197/year. 🔗 therightdecision.com

**X/Twitter (160 chars):**
> The most expensive thing in your life is the decision you haven't made. A methodology + AI for the one decision that matters most. therightdecision.com

**Facebook (intro, 101 chars):**
> The one decision that transforms your life. Methodology + AI. $197/year.

**Facebook (about, 255 chars):**
> You don't need another course. You need one decision. The Right Decision identifies the single biggest thing standing between where you are and where you want to be — then decomposes it into decisions, tasks, and habits you execute daily. therightdecision.com

**YouTube (about, 1000 chars):**
> Every meaningful change in your life begins with a decision.

> Not with information. Not with motivation. Not with a plan. A decision.

> The Right Decision is a methodology + AI platform ($197/year) that does three things:
> 1. Identifies the ONE constraint between where you are and where you want to be
> 2. Helps you make the decision you've been avoiding
> 3. Decomposes that decision into daily actions you can actually execute

> We publish 2 podcast episodes daily — real conversations between Henry and Indy about decisions, constraints, and doing the thing. No scripts. No polish. Just honest thinking about what it takes to get unstuck.

> This is not therapy. Not motivation. Not another self-help framework. It's the discipline of deciding accurately and executing consistently.

> Start here: therightdecision.com

> New episodes every day. Subscribe so you don't miss the conversation that changes how you think about decisions.

### Bio refresh cadence
Update bios when:
- A new course module launches (update CTA)
- Subscriber count hits a milestone worth mentioning
- A campaign is running (temporary CTA change)
- Quarterly review: are the bios still accurate?

---

## 3. Visual Identity Spec Sheets

### Design foundation (from DESIGN.md)
- **Palette:** Warm cream (#FAF8F5), sand (#F2EDE6), linen (#E8E0D4), warm near-black (#1A1714), accent gold (#C4956A)
- **Fonts:** Instrument Serif (display), Instrument Sans (body)
- **Mood:** Morning light through linen curtains. Calm authority.

### Profile photo specs

| Platform | Dimensions | Crop | Format |
|----------|-----------|------|--------|
| TikTok | 200x200px | Circular | JPG/PNG |
| Instagram | 320x320px | Circular | JPG/PNG |
| X/Twitter | 400x400px | Circular | JPG/PNG |
| Facebook (Page) | 176x176px | Circular (displays as) | JPG/PNG |
| YouTube | 800x800px | Circular | JPG/PNG |

**Personal accounts:** Headshot of Indy/Henry. Warm lighting. Cream/beige background or natural setting. No text overlay. Face fills 60-70% of the circle.

**Brand account:** The Right Decision logotype or monogram on cream (#FAF8F5) background. Gold accent (#C4956A) if needed. No face — the brand is the methodology, not a person.

### Cover/banner specs

| Platform | Dimensions | Safe zone | Notes |
|----------|-----------|-----------|-------|
| YouTube | 2560x1440px | Center 1546x423px is safe on all devices | Text must be in safe zone |
| Facebook | 820x312px | Renders differently on mobile (640x360px crop) | Test mobile rendering |
| X/Twitter | 1500x500px | Center area safe; edges crop on mobile | Keep key info centered |
| TikTok | N/A | No cover image | — |
| Instagram | N/A | No cover image (but story highlights covers) | 1080x1920px for highlights |

**Cover design rules:**
- Cream background (#FAF8F5) with subtle warm grain texture
- Instrument Serif for any text (tagline, not handle — handle is already visible)
- Brand tagline on YouTube/Facebook covers: "Stop preparing. Start deciding."
- No photos on covers. Let the typography and warm palette do the work.
- Gold accent (#C4956A) sparingly — one line, one word highlight at most

### Instagram story highlight covers
- 1080x1920px, centered icon/text in middle 600x600px zone
- Cream background, gold accent icon
- Categories: Course | Podcast | Stories | FAQ | Reviews

### Thumbnail style (YouTube)
- 1280x720px minimum (16:9)
- Warm cream base with one high-contrast element (face, bold text, or both)
- Instrument Serif for title text — max 5 words visible at mobile scale
- Face takes up 40%+ of thumbnail area (when applicable)
- No clutter: one face + one text element + warm background
- Avoid: neon colors, red arrows, shocked faces, busy collages

---

## 4. Content Playbook by Account + Platform

### Three content tiers mapped to buyer journey

| Tier | Purpose | Content type | % of posts |
|------|---------|-------------|------------|
| **Awareness** (top-funnel) | Stop the scroll. Get discovered. | Hooks from 7 angles, sin callouts, provocative questions | 60% |
| **Consideration** (mid-funnel) | Build trust. Show mechanism. | Methodology explanations, founder stories, before/after, mini-VSLs | 30% |
| **Conversion** (bottom-funnel) | Drive to therightdecision.com | Offer posts, testimonials, price anchoring, direct CTA | 10% |

### Brand accounts (rightdecision) — AI-generated, methodology-mapped

Content is tightly coupled to the course structure. Every post maps to a specific element:

| Content category | Source | Example |
|---|---|---|
| **Angle posts** | 7 angles from manifesto | "You don't need another book. You need to decide." (Angle 1) |
| **Sin callouts** | 8 sins from manifesto | "Are you disguising indecision as research?" (Sin #3) |
| **Mini-VSLs** | Individual course lessons | 60-sec video explaining one concept from Module 3 |
| **Methodology clips** | Decision Cycle phases | "Step 3: The dominant constraint is the one you're avoiding" |
| **Podcast clips** | Best moments from daily podcast | Extracted via OpusClip (doc #8) |
| **Offer posts** | Price anchoring, guarantee, CTA | "For the price of one therapy session: a full year of decision clarity" |

### Indy personal accounts — starts human, evolves to AI

| Content category | Description | Voice |
|---|---|---|
| **Real talk** | Her opinions on self-help, therapy culture, being stuck | Kitchen table Indy (human.md Indy Test) |
| **Stories** | Personal experiences with decisions, marriage, life abroad | Vulnerable, specific, direct |
| **Methodology drops** | Same angles/sins but in HER voice, from HER experience | Not a brand post — a woman sharing what she learned |
| **Behind the scenes** | Recording podcasts, building the product, daily life | Authentic, unpolished |
| **Reposts/reactions** | React to trending content through the "decision" lens | Hot takes, opinion-forward |

### Henry personal accounts — starts human, evolves to AI

| Content category | Description | Voice |
|---|---|---|
| **Builder journey** | Building the product, tech decisions, founder life | Direct, philosophical, grounded |
| **Business decisions** | Framework applied to business/money: pricing, hiring, pivoting | Practitioner, not guru |
| **Methodology deep-dives** | Technical explanation of the Decision Cycle | Engineer explaining a system |
| **Behind the tech** | AI platform, automation, what the product actually does | Transparent, no hype |
| **Internet business** | Making money online, digital products, solo founder path | Future expansion of ICP to men |

### Platform-specific templates

#### YouTube (brand only)

**Video description template:**
```
[One-sentence hook from the episode]

In this episode, Henry and Indy talk about [topic].

[3-5 bullet points of key moments with timestamps]

00:00 - [Topic 1]
05:30 - [Topic 2]
12:15 - [Topic 3]

---

The Right Decision is a methodology + AI platform that identifies the one decision that matters most in your life right now — and decomposes it into daily actions.

Start for $197/year: https://therightdecision.com
7-day money-back guarantee.

---

Subscribe for new episodes every day.

#therightdecision #decisions #selfimprovement #getunstuck #lifedecisions
```

**Thumbnail rules:** See Section 3 (Visual Identity).

**End screen:** Subscribe button + "watch next" card → latest episode or best-performing episode.

#### TikTok (all 3 accounts)

**Caption formula:**
```
[Hook — first line stops the scroll]

[1-2 sentences of value or story]

[CTA: Follow for more | Link in bio | Comment your answer]

#therightdecision #decisions #stuck #[topic-specific tags]
```

**Format:** Vertical 9:16. 15-60 seconds for clips, up to 3 min for original content. Native captions (not burned-in from another platform). Trending audio when relevant but not forced.

**Hashtag strategy:** 3-5 per post. Mix of:
- Brand: #therightdecision
- Topic: #decisions #getunstuck #lifechanges
- Platform: trending/discovery tags relevant to the content

#### Instagram (all 3 accounts)

**Reel caption formula:** Same as TikTok but can be longer (up to 2200 chars). Add a paragraph of value after the hook.

**Carousel template (brand account):**
- Slide 1: Bold statement (Instrument Serif, cream background, gold accent)
- Slides 2-5: Breakdown/explanation (Instrument Sans, one idea per slide)
- Slide 6: CTA ("Save this. Then go to therightdecision.com")
- Dimensions: 1080x1350px (4:5 portrait)

**Story template:** Quick, informal, ephemeral. Polls ("Have you been avoiding a decision?"), questions, behind-the-scenes. No heavy design.

#### X/Twitter (all 3 accounts)

**Single post formula:**
```
[Bold claim or provocative observation]

[1-2 supporting sentences]

[Optional: link to therightdecision.com]
```

**Thread formula:**
```
Tweet 1: [Hook — the claim that makes people click "Show more"]
Tweet 2-5: [Supporting points, stories, examples]
Tweet 6: [Summary + CTA to therightdecision.com]
```

**Tone:** X rewards opinion and provocation. Be direct. No emojis. Short sentences. Henry's natural voice works perfectly here.

#### Facebook (all 3 accounts)

**Post formula:**
```
[Story opening — 2-3 sentences that create an open loop]

[Value/insight — the lesson or framework point]

[Question to drive comments: "What decision have you been avoiding?"]

[Optional: link to therightdecision.com]
```

**Tone:** More conversational than X, longer than TikTok. Facebook audiences in the 30-50 range respond to storytelling and direct questions. Groups strategy: join relevant self-development groups and participate (don't spam).

### Template refresh triggers
- Refresh templates every 90 days or when engagement drops 30% from baseline
- Test one new format per platform per month (new carousel layout, different video length, etc.)

---

## 5. Cross-Posting Rules + Adaptation Matrix

### The rule
Content created for one platform must be **adapted**, never copy-pasted. Each platform has different optimal formats, aspect ratios, caption styles, and algorithm preferences.

### Adaptation matrix

| Source content | → TikTok | → Instagram | → X/Twitter | → Facebook | → YouTube |
|---|---|---|---|---|---|
| **Podcast clip (video)** | Native 9:16, no watermarks, TikTok captions | Reel 9:16, no TikTok logo, IG captions | Video tweet, square crop (1:1), or link to full | Native upload, square or landscape | Short (if <60s) or timestamp in full ep |
| **Carousel/graphic** | Skip (not native) | Native carousel 4:5 | Single image + thread | Image post + long caption | Community tab post |
| **Text insight** | Text on screen over b-roll | Text carousel or text reel | Tweet or thread | Text post with question | Community tab |
| **Podcast full episode** | Skip (too long) | Skip (not native) | Link tweet | Link post | Full upload (primary home) |
| **Story/BTS** | Behind-the-scenes TikTok | Story + highlight | Skip or casual tweet | Story or short post | Community tab |

### Hard rules
1. **Never** post a TikTok video to Instagram Reels with the TikTok watermark. Instagram suppresses these.
2. **Never** use the same caption across platforms. Adapt length, tone, hashtags.
3. **Never** post a horizontal video vertically (or vice versa) without re-cropping.
4. **YouTube Shorts and TikToks** can share the same source video but must be uploaded natively to each platform.
5. Brand accounts post **adapted versions** of the same core content. Personal accounts post **unique content** + selectively share brand content with personal commentary.

---

## 6. Content Engine — Podcast-to-Distribution Pipeline

### The podcast

| Attribute | Spec |
|---|---|
| **Format** | Conversation between Henry + Indy |
| **Length** | 30-60 minutes per episode |
| **Cadence** | 2 episodes per day |
| **Recording** | Video (for YouTube + clips) + audio (for podcast platforms) |
| **Equipment** | Two cameras (one per person), good microphone, natural lighting |
| **Location** | Home studio or wherever feels natural |
| **Topics** | Mapped to 7 angles, 8 sins, 9 course modules, and current life experiences |

### Dual purpose: distribution + training

The podcast serves two jobs simultaneously:

**Job 1: Distribution.** Raw material for the entire content machine. Every 30-60 min episode produces:
- 1 full YouTube video
- 1 full audio episode (Apple Podcasts + Spotify)
- 5-15 short clips (extracted via OpusClip, see doc #8)
- 3-5 text insights (transcribed and reformatted)
- 1-2 carousel ideas (from key frameworks discussed)

**Job 2: Training.** Rehearsal for course delivery. By discussing each course module, angle, and concept in conversation, Henry and Indy:
- Refine how they explain the methodology
- Discover which stories land and which fall flat
- Build comfort and fluency with the material
- Generate raw material that may improve the actual course content

**The tension:** Social-optimized content (short, punchy, provocative) vs. training-optimized content (structured, thorough, progressive). Resolution: record the podcast for training quality. Let the clip extraction process (doc #8) find the social-optimized moments. Don't try to make the podcast itself "viral" — make it honest and thorough, then let AI find the gold.

### Topic rotation

| Week | Angle focus | Podcast topics (examples) |
|---|---|---|
| 1 | Angle 1: Atomic Unit | "Why reading another book won't save you." "The difference between knowing and deciding." |
| 2 | Angle 2: Diagnosis | "You're solving the wrong problem." "How to find the real constraint." |
| 3 | Angle 3: Priority | "If your decision doesn't rearrange your life, it was a wish." |
| 4 | Angle 4: Risk | "Why 'waiting until I'm ready' is the most expensive strategy." |
| 5 | Angle 5: Temporal | "The invisible cost of not deciding." |
| 6 | Angle 6: Ownership | "Nobody can make the right decision for your life." |
| 7 | Angle 7: System | "The right decision isn't a moment. It's a muscle." |
| 8+ | Sins, course modules, real stories, current events through the decision lens | Repeat and deepen |

### Transition to live video

**Current mode:** 2 pre-recorded podcasts/day
**Future mode:** 1 live video/day (live on YouTube, simulcast to Instagram Live / TikTok Live / Facebook Live)

**Transition trigger:** When Henry and Indy feel comfortable on camera. This is a readiness-based trigger, not a metric. Signals of readiness:
- Can explain any course module without notes
- Natural back-and-forth, not scripted
- Comfortable with audience interaction (comments, questions)
- Have recorded 50+ episodes (roughly 25 days at 2/day)

### Podcast platform setup

**Apple Podcasts:**
- Submit via Apple Podcasts Connect or a host (Riverside, Buzzsprout, Anchor)
- Title: "The Right Decision with Henry & Indy"
- Category: Self-Improvement (primary), Education (secondary)
- Cover art: 3000x3000px, Ethereal Warmth design, faces + brand name

**Spotify:**
- Submit via Spotify for Podcasters
- Same title, category, cover art
- Enable video podcasts (Spotify supports video)

**RSS feed:** Use a podcast host that generates one RSS feed, distributes to both platforms + Google Podcasts + Amazon Music automatically.

---

## 7. Engagement + Community Response Protocol

### The principle
Social media is social. Posting without engaging is broadcasting. Algorithms reward accounts that participate in the community, not just publish to it.

### Daily engagement routine

| Activity | Time | Who | Platform |
|---|---|---|---|
| Reply to all comments on last 24h posts | 15 min/morning | Both (own accounts) | All |
| Reply to DMs (non-sales inquiries) | 10 min/morning | Account owner | Instagram, TikTok |
| Engage on 10 accounts in the ICP's space | 15 min/day | Indy (women's space), Henry (business space) | Instagram, TikTok |
| Reply to X/Twitter mentions and quote tweets | 10 min/day | Account owner | X/Twitter |
| Monitor brand mentions | 5 min/day | Henry (set up alerts) | All |

**Total: ~55 minutes/day split between both founders.**

### Reply voice rules

| Account type | Reply tone | Example |
|---|---|---|
| Indy personal | Kitchen table friend. Warm, direct, specific. | "Girl, that IS the decision. You just said it out loud for the first time." |
| Henry personal | Calm, grounded, philosophical. | "The cost of waiting is invisible. But you feel it every day." |
| Brand | Supportive but methodology-anchored. | "That's what we call the dominant constraint. Module 4 helps you name it." |

### DM handling
- **Sales inquiries:** Link to therightdecision.com. Don't sell in DMs.
- **Personal stories:** Acknowledge, validate, point to the methodology. "That sounds like a dominant constraint. Have you tried naming it explicitly?"
- **Hate/trolls:** Don't engage. Block if persistent. Never argue publicly.
- **Collaboration requests:** Forward to shared email. Evaluate case by case.

### Crisis protocol
If a personal account post causes brand backlash:
1. Don't delete the post (Streisand effect)
2. Assess: is this a genuine mistake or a difference of opinion?
3. If mistake: post a clarification, not an apology (unless warranted)
4. If opinion: stand by it. The brand is direct and honest. That will polarize some people. That's okay.
5. If serious (legal, defamation, safety): consult before acting

---

## 8. Analytics, KPIs + Funnel Tracking

### Funnel

```
Impressions (all 13 accounts) → Profile visits → Link clicks → therightdecision.com → $197 checkout → Sale
```

### KPIs by timeframe

| Metric | 30-day target | 60-day target | 90-day target |
|---|---|---|---|
| Total followers (all accounts) | 1,000 | 5,000 | 15,000 |
| Weekly impressions | 50,000 | 200,000 | 500,000 |
| Profile visit rate | >5% of impressions | >5% | >5% |
| Link click rate | >2% of profile visits | >3% | >3% |
| Landing page visits/week | 50 | 300 | 750 |
| Conversions (sales/week) | 2 | 10 | 25 |

These are aggressive but calibrated to the business model's path to $100K (508 customers).

### Per-platform metrics that matter

| Platform | Primary metric | Secondary | Vanity (track but don't optimize for) |
|---|---|---|---|
| TikTok | Views per video | Profile visits | Followers |
| Instagram | Reach + saves | Profile visits, link clicks | Likes |
| YouTube | Watch time + subscribers | Click-through rate on thumbnails | Views |
| X/Twitter | Impressions + link clicks | Replies (engagement) | Followers |
| Facebook | Reach + link clicks | Shares | Page likes |
| Apple/Spotify | Downloads per episode | Completion rate | Total subscribers |

### Link tracking
- Use UTM parameters on all bio links: `therightdecision.com?utm_source=instagram&utm_medium=bio&utm_campaign=organic`
- Different UTMs per account: `utm_source=tiktok_indy`, `utm_source=instagram_brand`, etc.
- Track in whatever analytics the landing page uses (likely Vercel Analytics or PostHog)

### Weekly review routine (15 min every Sunday)
1. Check total impressions across all platforms
2. Check link clicks → landing page visits → conversions
3. Identify top 3 performing posts across all accounts — what made them work?
4. Identify bottom 3 — what went wrong?
5. Adjust next week's content mix based on what's working

---

## 9. Platform Compliance + Algorithm Guide

### Algorithm essentials per platform

| Platform | Rewards | Punishes |
|---|---|---|
| **TikTok** | Watch time, completion rate, shares, comments, "not interested" avoidance | External links in video, watermarks from other platforms, inconsistent posting |
| **Instagram** | Saves, shares, watch time on Reels, carousel swipes | TikTok watermarks, low-quality images, link stickers in every story |
| **YouTube** | Session time, click-through rate, subscriber conversion, watch duration | Clickbait (high CTR + low watch time), inconsistent uploads |
| **X/Twitter** | Replies, quote tweets, bookmarks, link clicks | External links in tweets (reduces reach — put links in replies), threads without engagement |
| **Facebook** | Shares, meaningful comments, group engagement | Engagement bait ("comment YES if..."), link posts (video performs better) |

### Content policy risks for self-development
- **TikTok:** May restrict content that makes health/wellness claims. Frame as "methodology," not medical advice. Never claim to cure depression/anxiety.
- **Instagram:** Restricted hashtags exist in the wellness space. Avoid: #selfhelp (overused, possibly restricted). Use specific tags.
- **Facebook:** Groups have strict self-promotion rules. Participate first, share after trust.
- **All platforms:** Explicitly state "this is not therapy, not medical advice" in any content discussing mental health topics. The methodology doc (doc #3) has the scope boundary: "does NOT replace professional help for clinical depression, addiction, trauma."

### Verification strategy
- YouTube: Apply for verification after 100K subscribers or via official artist/brand channel
- Instagram: Apply after significant following or via Meta Verified ($14.99/month for small accounts)
- TikTok: Apply through Creator Marketplace once eligible
- X/Twitter: Consider X Premium for verification checkmark ($8/month) — boosts reach
- Facebook: Meta Verified available for businesses

---

## 10. Initial Setup + Ongoing Health Checklist

### Day 1: Account creation (both founders, one session, ~3 hours)

**Pre-setup:**
- [ ] Set up shared password manager vault for social accounts
- [ ] Create shared email: social@therightdecision.com
- [ ] Prepare profile photos (Indy headshot, Henry headshot, brand logo)
- [ ] Prepare cover images (YouTube, Facebook, X/Twitter)
- [ ] Have bio copy ready (from Section 2)

**Per-platform setup:**

**TikTok (x3 accounts):**
- [ ] Download TikTok, create accounts with target handles
- [ ] Switch to Creator Account (Settings → Manage Account)
- [ ] Add bio, profile photo, website link
- [ ] Link Instagram account (if desired)
- [ ] Enable analytics (automatic with Creator Account)

**Instagram (x3 accounts):**
- [ ] Create accounts with target handles
- [ ] Switch to Professional Account (Creator or Business)
- [ ] Add bio, profile photo, website link
- [ ] Set up story highlight covers
- [ ] Create first 3 highlight categories (Course, Podcast, About)
- [ ] Enable cross-posting to Facebook Page

**Facebook (x3 pages):**
- [ ] Create Pages (not personal profiles for brand/Indy-brand purposes)
- [ ] Add profile photo, cover image, about section, website link
- [ ] Set page category: Education / Personal Coach
- [ ] Enable messaging
- [ ] Link Instagram accounts

**X/Twitter (x3 accounts):**
- [ ] Create accounts with target handles
- [ ] Add bio, profile photo, header image, website link
- [ ] Consider X Premium for verification ($8/month per account — evaluate ROI)
- [ ] Pin first tweet: the core thesis or a mini-manifesto thread

**YouTube (x1 channel):**
- [ ] Create brand channel (not personal Google account channel)
- [ ] Claim @therightdecision handle
- [ ] Upload channel art (banner), profile photo, About section
- [ ] Set channel keywords: decisions, self-improvement, life coaching alternative, methodology
- [ ] Upload channel trailer (can be first podcast episode or a 60-sec brand video)
- [ ] Set default upload settings (description template, tags, end screen)

**Podcast platforms:**
- [ ] Choose podcast host (Riverside, Buzzsprout, or Spotify for Podcasters)
- [ ] Upload cover art (3000x3000px)
- [ ] Write show description (from YouTube About bio, expanded)
- [ ] Submit RSS feed to Apple Podcasts + Spotify
- [ ] Record and publish Episode 1

### Day 7: First health check
- [ ] All 13 accounts are live and posting
- [ ] Analytics are connected and tracking on all platforms
- [ ] Bio links are working (click each one, verify landing page loads)
- [ ] At least 7 posts published across all brand accounts
- [ ] At least 3 posts published on each personal account
- [ ] First podcast episode is live on YouTube + Apple + Spotify
- [ ] UTM tracking is working (check landing page analytics for social referrals)

### Day 30: Monthly health check
- [ ] Review 30-day KPIs against targets (Section 8)
- [ ] Identify best-performing platform and double down
- [ ] Identify worst-performing platform and diagnose (content? timing? format?)
- [ ] Update bios if needed (campaign changes, CTA updates)
- [ ] Check for any content policy warnings or restrictions
- [ ] Review engagement protocol adherence (are DMs being answered? comments replied to?)

---

## Quality Checklist

- [x] Every account has bio copy within platform character limits
- [ ] All 13 handles confirmed available (or fallbacks applied)
- [x] Posting templates are platform-native (not generic)
- [x] Distribution plan has specific numbers per platform
- [x] Podcast format defined with dual purpose + tension resolution
- [x] Visual specs reference DESIGN.md palette with dimension tables
- [x] Cross-posting matrix says what goes where and what gets adapted
- [x] Buyer journey mapped (60% awareness / 30% consideration / 10% conversion)
- [x] Engagement protocol has time budgets (55 min/day)
- [x] KPI framework has 30/60/90 day targets
- [x] All 13 accounts launch simultaneously (founder's decision)
- [x] Podcast platforms (Apple, Spotify) included
- [x] Customer-facing copy passes the Indy Test

**Result: 12/13 criteria met.** Handle availability check outstanding.

---

## Assumptions Registry

| Assumption | Confidence | Signal that proves it wrong |
|---|---|---|
| Handles available on all platforms | 🔴 guess | Check during Day 1 setup |
| 2 podcasts/day is sustainable | 🔴 guess | Founders burn out or quality drops within 2 weeks |
| AI-generated brand content converts as well as human content | 🔴 guess | Brand account engagement is <10% of personal account engagement |
| All 13 accounts simultaneously is operationally feasible with automation | 🔴 guess | Content quality degrades, engagement drops, accounts go dormant |
| Instagram is highest-converting platform for this ICP | 🟡 hypothesis | Another platform drives more link clicks |
| Podcast clips are the highest-ROI content format | 🟡 hypothesis | Original short-form outperforms clips |
| Personal accounts drive more trust than brand account | 🟡 hypothesis | Brand account outperforms personal in engagement |
| 55 min/day engagement is sufficient | 🟡 hypothesis | Engagement metrics are low despite posting consistently |
| X Premium verification is worth $8/month per account | 🔴 guess | No measurable reach increase from verification |

---

## Decision Log

| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-06 | Launch all 13 accounts simultaneously | Founder preference + doc #8 automation makes it feasible | If quality degrades, prioritize top 3-4 accounts |
| 2026-04-06 | Brand accounts are 100% AI-generated from day 1 | AI-first strategy, human effort reserved for podcasts | If AI content underperforms, add human content to brand accounts |
| 2026-04-06 | Personal accounts start human, evolve to AI | Build authentic presence first, then scale with voice clones | If AI voice is indistinguishable, accelerate transition |
| 2026-04-06 | One funnel: all accounts → therightdecision.com | Simplicity. No link-in-bio tools. | If conversion is low, test link-in-bio with multiple CTAs |
| 2026-04-06 | Podcasts published on audio platforms from day 1 | Maximum distribution. Audio audiences are different from video. | If audio downloads are negligible, deprioritize audio-only optimization |
| 2026-04-06 | Transition to live video is readiness-based, not metric-based | Founders need to feel comfortable, not hit a number | If they never feel ready, set a date ceiling (90 days from first recording) |
| 2026-04-06 | Henry will expand to business/money content for men | Grows total addressable market beyond women 30-50 | If men don't convert to $197, keep focus on women ICP |

---

## Override Warnings

This document introduces concepts that affect other documents:

1. **AI-first content strategy** is new. Doc #8 (Short-Video Viral Strategy) should reference the process tiers defined here (100% AI brand, human→AI personal, 100% AI dark channels).
2. **Henry expanding to men/business ICP** is new. The business model (doc #1) targets women 30-50 exclusively. This expansion should be noted as a future consideration in general.md.
3. **Podcast platforms (Apple, Spotify)** were not in the original scope of doc #7 in general.md. They're included here because the podcast is a core distribution channel.
4. **55 min/day engagement budget** should be reflected in any operational capacity planning.

---

**Next step:** Run `/d-auto` for doc #9 (Knowledge Base Strategy), then doc #8 (Short-Video Viral Strategy) which depends on both #7 and #9.
