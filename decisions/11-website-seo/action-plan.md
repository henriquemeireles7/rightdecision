# SEO/GEO Action Plan — What Henry Does Manually

**Date:** 2026-04-08
**Status:** Active
**Source:** SEO/GEO Hardening design doc (office-hours + eng-review)

This document lists everything that requires MANUAL action (not code). Check items off as you complete them.

---

## Phase 1: Entity Building (Day 1 — ~3 hours total)

### P0 — Do These First

- [ ] **LinkedIn Personal Profile**
  - URL: https://linkedin.com
  - Create or update personal profile with: "Founder, The Right Decision" as headline
  - Add rightdecisions.io/about as website link
  - Add professional background (coaching 400+ founders, prior exits)
  - Upload professional photo
  - **Why P0:** DA 98, Google's primary entity recognition source

- [ ] **LinkedIn Company Page**
  - URL: https://linkedin.com/company/setup
  - Company name: "The Right Decision"
  - Website: https://rightdecisions.io
  - Description: Use the same brand description across ALL profiles (see Brand Description below)
  - Logo: Upload The Right Decision logo
  - **Why P0:** Separate entity from personal profile, links to Organization schema

- [ ] **Crunchbase**
  - URL: https://www.crunchbase.com/add-new
  - Create company profile: "The Right Decision"
  - Add founders: Henry Meireles, Indy
  - Funding stage: Self-funded / Bootstrapped
  - Website: https://rightdecisions.io
  - **Why P0:** DA 91, shows up in Google Knowledge Panels

- [ ] **Product Hunt (Upcoming)**
  - URL: https://www.producthunt.com/posts/new
  - Don't launch yet — just create an "Upcoming" page
  - Name: "The Right Decision"
  - Tagline: "Stop overthinking. Start deciding. AI-powered decision methodology."
  - Website: https://rightdecisions.io
  - **Why P0:** DA 90, dofollow link. Save full launch for when you have 10+ blog posts

- [ ] **GitHub Organization**
  - URL: https://github.com/organizations/new
  - Create org: "getzeny" or "therightdecision"
  - Add website: https://rightdecisions.io
  - Add description matching brand
  - **Why P0:** DA 96, you already have the repo

- [ ] **Substack**
  - URL: https://substack.com/publish
  - Publication name: "The Right Decision by Henry Meireles"
  - About: Brand description (see below)
  - Website link: https://rightdecisions.io
  - **Why P0:** DA 90+, primary distribution channel for blog cross-posting

### P1 — Do These Within the First Week

- [ ] **AngelList / Wellfound**
  - URL: https://wellfound.com
  - Startup listing with founders, stage, description
  - Website: https://rightdecisions.io

- [ ] **About.me**
  - URL: https://about.me
  - Henry's personal page
  - Link to rightdecisions.io/about
  - **Note:** Dofollow link (DA 84)

- [ ] **Medium**
  - URL: https://medium.com
  - Create profile, link to rightdecisions.io
  - Will use for cross-posting blog content later

### P2 — Do These When P0 and P1 Are Done

- [ ] **Gravatar**
  - URL: https://gravatar.com
  - Link email to avatar + website
  - Dofollow (DA 85), appears everywhere email-based avatars are shown

- [ ] **F6S**
  - URL: https://www.f6s.com
  - Startup directory listing
  - Dofollow (DA 70)

- [ ] **BetaList**
  - URL: https://betalist.com/submit
  - Pre-launch listing
  - Dofollow (DA 65)

- [ ] **StartupPage**
  - URL: https://startupa.ge
  - Startup directory
  - Dofollow (DA 60)

---

## Phase 1: Search Engine Verification (Day 1 — ~30 minutes)

- [ ] **Google Search Console**
  - URL: https://search.google.com/search-console
  - Add property: rightdecisions.io
  - Verify via DNS TXT record (recommended) or HTML file
  - After verification: Submit sitemap at https://rightdecisions.io/sitemap.xml
  - Request indexing for: /, /about, /life, /blog, /concepts, each concept page
  - **Why critical:** Without this, Google may take weeks to discover your site

- [ ] **Bing Webmaster Tools**
  - URL: https://www.bing.com/webmasters
  - Add site: rightdecisions.io
  - Verify via DNS TXT record
  - Submit sitemap
  - **Why:** Bing also powers DuckDuckGo and Yahoo search

- [ ] **Google Business Profile** (optional)
  - URL: https://business.google.com
  - If applicable (you have a registered US company)
  - Helps with brand entity recognition in Google's Knowledge Graph

---

## Phase 1: GCP Service Account for Search Console API (Day 1 — ~30 minutes)

The SEO health dashboard script needs API access to check indexing status.

- [ ] **Create GCP Project**
  - URL: https://console.cloud.google.com
  - Create project: "right-decision-seo" (or similar)
  - Enable "Google Search Console API"

- [ ] **Create Service Account**
  - IAM & Admin → Service Accounts → Create
  - Name: "seo-health-check"
  - Download JSON key file

- [ ] **Grant Search Console Access**
  - In Google Search Console: Settings → Users and permissions
  - Add the service account email (from the JSON key)
  - Permission level: "Full" (needed for URL Inspection API)

- [ ] **Add Credentials to Railway**
  - `railway variable set GOOGLE_SERVICE_ACCOUNT_JSON='<paste JSON key contents>'`
  - Or store as a file path if Railway supports it

---

## Brand Description (use this EXACT text everywhere)

**Short (1 line):**
> Solving decision-making with AI. A methodology + platform for personal and business decisions.

**Medium (2-3 lines):**
> The Right Decision helps people stop overthinking and start deciding. Founded by Henry Meireles, we combine a proven decision-making methodology with AI to help people stuck in life transitions make the decisions that actually change their lives. $197/year.

**Long (for About pages):**
> Most people aren't stuck because they lack information. They're stuck because they've been trained to understand instead of decide. The Right Decision is a methodology + AI platform that breaks the cycle of overthinking, analysis paralysis, and self-help addiction. Founded by Henry Meireles — who has coached 400+ founders and gone through his own transformation from multimillionaire to losing everything to rebuilding — we help women 30-50 who have "done the work" but are still stuck make the one decision that changes everything.

---

## Profile Optimization Rules

1. **Same brand name everywhere:** "The Right Decision" (exact capitalization)
2. **Same logo everywhere:** Upload the same logo file to every platform
3. **Same description:** Use the brand descriptions above (short for taglines, medium for bios)
4. **Link consistency:**
   - Company profiles → https://rightdecisions.io (matches Organization schema)
   - Personal profiles → https://rightdecisions.io/about (matches Person schema)
5. **Henry's title everywhere:** "Founder, The Right Decision"
6. **Photo consistency:** Same professional photo on LinkedIn, About.me, Gravatar, Crunchbase

---

## Phase 2: Content Production (Day 3+)

After entity profiles are created and Search Console is verified:

- [ ] **Write second blog post** using the d-blog skill (or manually following this structure):
  1. Hook: A specific moment from your story
  2. Problem: The universal problem it illustrates
  3. Agitation: Why obvious solutions don't work
  4. Framework: Introduce the Right Decision methodology
  5. Steps: 3-5 actionable steps
  6. Resolution: Come back to the story
  7. CTA: Natural link to /life

  **Suggested first story:** Losing everything as a multimillionaire. This is your highest-impact piece.

- [ ] **Cross-post to Substack** within 24 hours of publishing
  - Add "Originally published at rightdecisions.io/blog/[slug]" at the top
  - This prevents Google from treating it as duplicate content

---

## Tracking Progress

| Metric | Target (30 days) | Current |
|--------|------------------|---------|
| Entity profiles created | 10+ | 0 |
| Search Console verified | Yes | No |
| Blog posts published | 15+ | 1 |
| Pages indexed | 25+ | ? |
| Substack subscribers | 50+ | 0 |

Update this table weekly. Check Google Search Console "Coverage" report weekly for the first month.

---

## Quarterly Content Refresh (starts Month 3)

Every 90 days, review all published content:
- Run `bun run freshness` to get the stale content report
- Update concept pages: refresh statistics, add new FAQ pairs, update opening definition
- Update blog posts: add new internal links, update "updated" date if content changes
- Re-submit updated URLs to IndexNow (automatic via deploy)

This prevents GEO citation decay — AI systems deprioritize content older than 3 months.
