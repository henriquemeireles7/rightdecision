# Email, Auth & Payments Polish — Meta Document

> Document type: Strategy + Implementation Spec
> Created: 2026-04-07
> Pipeline: d-meta → d-input → d-plan → d-tasks → d-code

## Purpose
Define every email, authentication flow, and payment lifecycle event for The Right Decision platform — the shared infrastructure that both Life Decisions ($197/yr) and Business Decisions ($1,997/yr) depend on. Ship what a senior developer with attention to detail would consider table-stakes for a professional subscription course platform.

## Audience
Henry (sole developer) + AI agents implementing the work.

---

## Build Order
Infrastructure first, then auth, then emails, then payments:
1. Email Infrastructure (Section 1) + Webhook Hardening (Section 7)
2. Authentication Flows (Section 2)
3. Auth Transactional Emails (Section 3)
4. Payment Lifecycle Emails (Section 4) + Dunning (Section 5) + Customer Portal (Section 8)
5. Compliance & Deliverability (Section 9)
6. V2: Onboarding Drip Sequence (Section 6) — after course player exists and users exist

---

## Sections

### 1. Email Infrastructure
**What belongs here:** Email provider setup (Resend), sending domain, template system architecture, shared layout/branding, plain-text fallbacks, Resend plan limits, email testing strategy.
**Done-when:** A reusable template system exists with branded HTML layout (Instrument Serif + warm cream palette), all emails render correctly on mobile, plain-text fallback for every email. Resend plan selected with adequate sending limits. Test emails verified in Gmail web, Apple Mail, and Outlook.com (manual send-and-check).
**Failure mode:** Building email templates without a shared layout → every email looks different, maintenance nightmare. Skipping plain-text → spam filters penalize you. Resend outage = all emails delayed — accepted risk for MVP, no fallback provider.

### 2. Authentication Flows
**What belongs here:** Email/password hardening, Google OAuth, email verification, password recovery, session management, account security.

#### 2a. Email Verification
**Done-when:** New signups receive verification email, 24h token expiry, grace period (48h limited access while unverified), resend with rate limiting (3/hour), verified status stored in DB.
**Failure mode:** Skipping verification → bots and typo emails pollute user base. No grace period → users bounce before checking email.

#### 2b. Password Recovery
**Done-when:** Forgot-password sends secure token (64+ chars, SHA-256 hashed in DB, 30min expiry, single-use). Same response whether email exists or not (account enumeration prevention). Confirmation email on successful change. Rate-limited (5 requests/email/hour). No auto-login after reset — redirect to login page with success toast.
**Failure mode:** Leaking whether an email exists → privacy/security issue. Auto-login after reset → OWASP violation. Short tokens → brute-forceable.

#### 2c. Google OAuth
**Done-when:** Google sign-in works alongside email/password. Minimal scopes (email, profile). Account linking (existing email user adds Google, or vice versa). Proper error handling for denied consent.
**Failure mode:** No account linking → duplicate accounts for same person. No denied-consent handling → broken UX when user clicks "Cancel" on Google consent screen.

#### 2d. Session Management
**Done-when:** HTTP-only, Secure, SameSite=Lax cookies. 30-day sessions with sliding expiration. All sessions invalidated on password change.
**Failure mode:** Tokens in localStorage → XSS exposure. No invalidation on password change → compromised sessions persist.

### 3. Transactional Emails (Auth)
**What belongs here:** Every email triggered by authentication events.

| Email | Trigger | Priority |
|-------|---------|----------|
| Email verification | Signup | P0 |
| Welcome (post-verification) | Email verified | P0 |
| Password reset request | Forgot password | P0 |
| Password changed confirmation | Password updated | P0 |
| New device login alert | Login from unknown device | P1 (V2) |

**Done-when:** All P0 emails implemented, tested, branded. P1 tracked as follow-up.
**Failure mode:** No welcome email → user feels lost after signup. No password-changed confirmation → user doesn't know if account was compromised.

### 4. Payment Lifecycle Emails
**What belongs here:** Every email triggered by Stripe webhook events.

| Email | Stripe Event | Priority |
|-------|-------------|----------|
| Payment confirmation + welcome to course | `checkout.session.completed` | P0 |
| Annual receipt (renewals) | `invoice.payment_succeeded` (renewals) | P0 |
| Payment failed — update your card | `invoice.payment_failed` | P0 |
| Renewal reminder (7 days before) | `invoice.upcoming` | P0 |
| Renewal reminder (30 days before) | Scheduled/cron | P1 |
| Subscription cancelled confirmation | `customer.subscription.deleted` | P0 |
| Access revoked / expired | Grace period ended (14 days after failure) | P0 |

**Done-when:** All P0 emails implemented. Payment-failed email includes direct link to Stripe Customer Portal to update card. Renewal reminder at 7d before annual charge. Stripe Smart Retries enabled.
**Failure mode:** No payment-failed email → recoverable payments become permanent churn. No renewal reminder → surprise $197 charge → chargebacks. No cancellation email → user doesn't know when access ends.

### 5. Dunning & Revenue Recovery
**What belongs here:** Failed payment handling strategy, grace periods, Stripe Smart Retries configuration, access degradation policy.
**Done-when:** Stripe Smart Retries enabled (Stripe Dashboard → Billing → Revenue Recovery, 8 retries over 14 days). One payment-failed email with update-card link (Stripe Customer Portal). Grace period: 14 days full access after first failure. Access revoked on day 14 if unresolved, with "access revoked" email including reactivation link. Subscription status tracked in DB (active → past_due → cancelled).
**Failure mode:** Cutting access immediately on first failure → worst UX, drives permanent churn. No reactivation path → user can't come back even if they want to.

**V2 (when 500+ subscribers):** Multi-stage dunning (day 0, 3, 7, 14 emails with escalating urgency). Hard vs soft decline differentiation. This requires a scheduled jobs system — design it then, not now.

### 6. Course Onboarding Email Sequence (V2)
**What belongs here:** Post-purchase drip sequence for Life Decisions students. Deferred until course player exists and there are 50+ paying users to measure impact.

**MVP (ships now):** The payment confirmation email (Section 4) doubles as the welcome — includes first lesson link, course expectations, and "here's how to get started."

**V2 spec (build when users exist):**

| Day | Email | Purpose |
|-----|-------|---------|
| 0 | Welcome + first step | Set expectations, link to first lesson, reduce buyer's remorse |
| 1 | Quick win | One insight they can apply today (from Act 1) |
| 3 | Progress nudge | "Here's what to do next" — guide to next module |
| 7 | Feature discovery | Show a platform feature they haven't used |
| 14 | Feedback request | Ask how it's going, open a conversation |

**V2 requires:** Scheduled jobs system (DB-backed queue, per-user drip state tracking, suppression rules for active users). Design this infrastructure when building the drip.
**Failure mode (V2):** Pure calendar-based → emails feel robotic. No pause logic → nagging active users. Promotional tone → violates brand voice.

### 7. Webhook Hardening
**What belongs here:** Making the Stripe webhook handler production-grade.
**Done-when:** Signature verification on every event (already done). Idempotent processing (deduplicate by event ID — store processed event IDs in DB, check before processing). All relevant events handled: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.upcoming`. Webhook events logged for debugging (event type + ID + timestamp).
**Failure mode:** No idempotency → duplicate emails, duplicate DB writes on Stripe retries. Missing events → silent failures. No logging → can't debug payment issues.

### 8. Stripe Customer Portal
**What belongs here:** Self-service billing management so users can update payment method, view invoices, and cancel without contacting support.
**Done-when:** Stripe Customer Portal configured (Dashboard → Settings → Customer Portal) and linked from user settings page. Users can: update payment method, view invoice history, cancel subscription. Portal configured with brand colors and logo (accept that portal UI is Stripe-controlled — cannot apply full design system).
**Failure mode:** No self-service → every billing question becomes a support ticket (solo developer can't handle this). Users can't update expired cards → involuntary churn.

### 9. Email Compliance & Deliverability
**What belongs here:** Legal requirements, sending reputation, domain authentication, bounce/complaint handling.
**Done-when:** Custom sending domain verified (SPF, DKIM, DMARC) in Resend. Physical mailing address in email footer (CAN-SPAM requirement). Transactional emails are purely transactional (no promotional content mixed in — GDPR reclassification risk). Bounce/complaint webhooks configured in Resend with suppression list (don't email addresses that bounced).
**Failure mode:** No domain auth → emails land in spam. Promotional content in receipts → GDPR violation. No bounce handling → sending reputation degrades over time.

---

## Out of Scope
- Two-factor authentication (V2 feature, not MVP)
- New device login alerts (P1, requires device fingerprinting)
- SMS notifications (email-only for now)
- Marketing email campaigns (this doc covers transactional + lifecycle only)
- Email analytics/open tracking (privacy-first, avoid tracking pixels)
- Plan upgrades/downgrades (single plan per product for now)
- Business Decisions payment flow (separate doc when BD ships)
- Win-back email sequences (build when churn data exists, requires cancellation survey)
- Scheduled jobs infrastructure (design when V2 drip sequence is needed)
- Multi-stage dunning (optimize when 500+ subscribers)
- Fallback email provider (accepted risk — Resend is single point of failure for MVP)

## Dependencies
- Resend account with custom domain (rightdecision.com)
- Stripe Dashboard: enable Smart Retries, configure Customer Portal
- Better Auth: Google OAuth provider configuration
- Google Cloud Console: OAuth client credentials

## Verify
After implementation, verify with:
```sh
bun test                              # all email/auth/payment tests pass
bun run check                         # full lint + typecheck + test
stripe trigger checkout.session.completed  # test webhook → email flow
stripe trigger invoice.payment_failed      # test dunning email
```
