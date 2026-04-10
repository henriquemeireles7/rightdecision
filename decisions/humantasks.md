# Human Tasks

> Last verified: 2026-04-09

Tasks that require manual human action. AI agents add items here when they hit something only a human can do. Check this file regularly and mark items done.

## Priority Framework

- **P0:** Blocks launch or blocks ALL users. Do this week.
- **P1:** Blocks first 100 users or first revenue. Do this month.
- **P2:** Nice-to-have before launch. Do when P0/P1 are clear.

| Owner | Meaning |
|-------|---------|
| Henry | Technical tasks, infrastructure, API setup |
| Indy | Content, brand, creative, social |
| Either | Non-technical tasks anyone can do |

---

## Entity Building (SEO — P0)

- [ ] **LinkedIn Personal Profile** — Create/update with "Founder, The Right Decision" headline, link to rightdecisions.io/about, professional photo
- [ ] **LinkedIn Company Page** — Company: "The Right Decision", website: rightdecisions.io, logo, brand description
- [ ] **Crunchbase** — Create company profile, add founders (Henry + Indy), mark as bootstrapped
- [ ] **Product Hunt (Upcoming)** — Create upcoming page, tagline: "Stop overthinking. Start deciding."
- [ ] **GitHub Organization** — Create org "getzeny" or "therightdecision", add website + description
- [ ] **Substack** — Publication: "The Right Decision by Henry Meireles", link to rightdecisions.io

## Entity Building (SEO — P1)

- [ ] **AngelList / Wellfound** — Startup listing with founders, stage, description
- [ ] **About.me** — Henry's personal page, link to rightdecisions.io/about (dofollow DA 84)
- [ ] **Medium** — Create profile, link to rightdecisions.io

## Entity Building (SEO — P2)

- [ ] **Gravatar** — Link email to avatar + website (dofollow DA 85)
- [ ] **F6S** — Startup directory listing (dofollow DA 70)
- [ ] **BetaList** — Pre-launch listing (dofollow DA 65)
- [ ] **StartupPage** — Startup directory (dofollow DA 60)

## Search Engine Verification

- [ ] **Google Search Console** — Add property rightdecisions.io, verify via DNS TXT, submit sitemap
- [ ] **Bing Webmaster Tools** — Add site, verify via DNS TXT, submit sitemap
- [ ] **Google Business Profile** — If applicable (registered US company)

## GCP Service Account (for SEO health dashboard)

- [ ] **Create GCP Project** — "right-decision-seo", enable Search Console API
- [ ] **Create Service Account** — "seo-health-check", download JSON key
- [ ] **Grant Search Console Access** — Add service account email with "Full" permission
- [ ] **Add Credentials to Railway** — `railway variable set GOOGLE_SERVICE_ACCOUNT_JSON='...'`

## Content & Brand

- [ ] Record podcast episodes (needed before VSL doc)
- [ ] Indy's origin story for manifesto (Section 10 gap)
- [ ] Set up social media accounts per doc #7 specs
- [ ] Henry + Indy do Life Decisions exercises as example content
- [ ] Choose Wins Board taxonomy naming
- [ ] Write second blog post (see ops/00-legacy/11-website-seo/action-plan.md for structure)
- [ ] Cross-post first blog to Substack within 24 hours

## Infrastructure

- [ ] Domain registration for therightdecision.com (if not done)

---

## Brand Description (use this EXACT text on all profiles)

**Short:** Solving decision-making with AI. A methodology + platform for personal and business decisions.

**Medium:** The Right Decision helps people stop overthinking and start deciding. Founded by Henry Meireles, we combine a proven decision-making methodology with AI to help people stuck in life transitions make the decisions that actually change their lives. $197/year.
