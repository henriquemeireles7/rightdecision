# Email, Auth & Payments Polish — Strategy Document

> Created: 2026-04-07
> Eng review: 2026-04-07 (11 decisions applied)
> Source: meta.md (structure) + input.md (founder decisions) + best-practice research
> Pipeline: d-meta → d-input → d-plan → **d-tasks** → d-code

## Purpose
Ship production-quality email, authentication, and payment infrastructure for The Right Decision platform. Everything a senior developer with attention to detail would consider table-stakes. No over-engineering — the basics done right.

## Build Order
1. Email Infrastructure (layout.ts, auth-emails.ts, payment-emails.ts, update sendEmail + migrate reminders.ts)
2. DB Migration (webhook_events table)
3. Webhook Hardening (idempotency via INSERT-first, 3 new event handlers, getUserForSubscription helper, logging)
4. Auth Enhancements (Better Auth email verification + password recovery callbacks, subscription linking via session_id)
5. Access-Gating Middleware (subscription.status check on course routes)
6. Auth Transactional Emails (verification, welcome, password reset, password changed)
7. Payment Lifecycle Emails (confirmation, receipt, failed, renewal reminder, cancelled, revoked)
8. Dunning & Revenue Recovery (Stripe Dashboard: Smart Retries + 14-day cancel + 7-day invoice.upcoming)
9. Stripe Customer Portal (Dashboard config + endpoint)
10. Compliance & Deliverability (SPF/DKIM/DMARC verify, footer)

### Stripe Dashboard Steps (manual, no code)
These must be done before the code that depends on them:
- **Before step 8:** Enable Smart Retries (Billing → Revenue Recovery). Set failed payment retry to cancel after 14 days.
- **Before step 8:** Set invoice.upcoming to fire 7 days before renewal (Billing → Subscription and emails → Days before renewal).
- **Before step 9:** Configure Customer Portal (Settings → Customer Portal: update payment method, view invoices, cancel subscription). Set brand colors `#C4956A` / `#FAF8F5`, add logo.

---

## 1. Email Infrastructure

### Current State
`providers/email.ts` exports `sendEmail(to, subject, html)` — a thin Resend wrapper. No template system. No plain-text. No shared layout. Domain verified.

`features/(shared)/email/reminders.ts` has 3 existing email functions using the old signature with inline HTML and **no dedup logic** (bug: sends every cron run with no tracking).

### What to Build

#### 1.1 Email Template System

Create a template module at `features/(shared)/email/` with:

**Shared layout function:**
```ts
// features/(shared)/email/layout.ts
export function emailLayout(content: string, options?: { preheader?: string }): { html: string; text: string }
```

Built with **template literals** (no JSX, no deps). The layout wraps every email in branded HTML:
- **Header:** "Right Decision" wordmark in Georgia (web-safe fallback for Instrument Serif)
- **Body:** Warm cream background (`#FAF8F5`), white content card (`#FFFFFF`), warm near-black text (`#1A1714`)
- **CTA buttons:** Amber/gold (`#C4956A`), white text, 8px border-radius
- **Footer:** "Right Decision" + `{PHYSICAL_ADDRESS_PLACEHOLDER}` + unsubscribe link (marketing emails only — transactional emails exempt)
- **Width:** 600px max, responsive for mobile (table-based layout for email client compatibility)
- **Font stack:** `'Instrument Sans', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`

**Plain-text generation:**
Every email also produces a plain-text version (strip HTML tags, convert links to `[text](url)` format). Resend supports sending both `html` and `text` in a single API call. **This is a spam-risk fix** — emails without plain-text fallback score lower in spam filters.

#### 1.2 Template Files (2 files, split by domain)

```ts
// features/(shared)/email/auth-emails.ts
// Exports: verificationEmail, welcomeEmail, passwordResetEmail, passwordChangedEmail
// + migrated: inactivityReminderEmail, moduleCompletionEmail, abandonedOnboardingEmail

// features/(shared)/email/payment-emails.ts
// Exports: paymentConfirmationEmail, renewalReceiptEmail, paymentFailedEmail,
//          renewalReminderEmail, subscriptionCancelledEmail, accessRevokedEmail
```

Each export is a function: `(vars) => { subject: string; html: string; text: string }`

Total: **13 email templates** (10 new + 3 migrated from reminders.ts).

#### 1.3 Updated sendEmail + Breaking Change Migration

```ts
// providers/email.ts — updated signature
export async function sendEmail(to: string, email: { subject: string; html: string; text: string }): Promise<void>
```

**Migration order (prevents breakage):**
1. Add new template functions in auth-emails.ts + payment-emails.ts
2. Update sendEmail signature in providers/email.ts
3. Update reminders.ts callers to use new signature + templates **in the same commit**
4. Fix reminders.ts dedup bug: add `last_emailed_at` tracking (check before sending, update after sending) to prevent re-sending every cron run

#### 1.4 Resend Plan Consideration
Resend free tier: 100 emails/day, 3,000/month. Sufficient for pre-revenue with <100 users. Upgrade to Pro ($20/month, 50K emails) at 50+ daily active users. No fallback provider — accepted risk for MVP.

### Testing Strategy
- Manual send-and-check in Gmail web, Apple Mail, Outlook.com for each template
- Unit tests: each template function returns valid HTML with correct variables, plain-text has no HTML tags
- No open/click tracking (privacy-first)

---

## 2. Webhook Hardening

### Current State
`features/(shared)/subscription/handle-webhook.ts` handles 3 events with signature verification. No idempotency. No logging. Missing key events. `customer.subscription.updated` handler conflates multiple Stripe statuses (maps everything non-active to past_due).

### What to Build

#### 2.1 Idempotency Table (DB migration prerequisite)

Add to `platform/db/schema.ts`:
```ts
export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  stripeEventId: text('stripe_event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  processedAt: timestamp('processed_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

Then run `bun run db:generate && bun run db:migrate`.

#### 2.2 Idempotency Pattern (INSERT-first)

```ts
// At the top of the webhook handler, after signature verification:
const result = await db.insert(webhookEvents)
  .values({ stripeEventId: event.id, eventType: event.type })
  .onConflictDoNothing({ target: webhookEvents.stripeEventId })

// If no rows inserted, this event was already processed
if (result.rowCount === 0) {
  return success(c, { received: true })
}
// Otherwise, proceed to process the event
```

One DB call for new events (INSERT succeeds). One DB call for duplicates (INSERT no-ops). No SELECT needed.

#### 2.3 getUserForSubscription Helper

```ts
// features/(shared)/subscription/helpers.ts
export async function getUserForSubscription(stripeSubscriptionId: string): Promise<{ id: string; email: string; name: string } | null>
// subscription → userId → user (email + name)
// Returns null if subscription not linked to a user yet
```

Used by all webhook handlers that send emails. Prevents duplicating the DB lookup across 4-5 event handlers. **When null is returned (unlinked subscription), skip the email silently** — the success page flow handles first-payment email.

#### 2.4 New Event Handlers

Add to the webhook switch statement:

| Event | Handler |
|-------|---------|
| `invoice.payment_succeeded` | Check `billing_reason === 'subscription_cycle'` (renewal, not first payment). If renewal + user exists: send renewal receipt email. Update `currentPeriodEnd`. |
| `invoice.payment_failed` | Set subscription status to `past_due`. If user exists: send payment-failed email with Customer Portal link. Log failure reason from invoice. |
| `invoice.upcoming` | If user exists: send 7-day renewal reminder email. (Stripe configured to fire 7 days before charge.) |

#### 2.5 Fix `customer.subscription.updated` Handler

Current handler maps everything non-active to `past_due`. Should preserve Stripe's actual status more accurately:
- `active` → `active`
- `past_due` → `past_due`
- `cancel_at_period_end` → still `active` (user has access until period end), but send cancellation email
- On actual deletion → `cancelled` (handled by `customer.subscription.deleted`)

#### 2.6 Distinguish User-Initiated vs Involuntary Cancellation

In `customer.subscription.deleted` handler:
- Check if last status was `past_due` → involuntary (payment failure) → send **access-revoked** email
- Check if `cancel_at_period_end` was set → user-initiated → send **subscription-cancelled** email

#### 2.7 Logging

Log every webhook event: `console.info('[webhook] ${event.type} ${event.id}')`. For payment failures, log the failure reason from the invoice object.

---

## 3. Authentication Enhancements

### Current State
Better Auth with email/password only. 30-day sessions. No email verification. No password recovery. No Google OAuth (deferred). Subscription not linked to userId.

### What to Build

#### 3.1 Email Verification (Better Auth built-in)

Enable Better Auth's email verification:

```ts
// platform/auth/config.ts
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
},
emailVerification: {
  sendOnSignUp: true,
  autoSignInAfterVerification: true,
  expiresIn: 86400, // 24 hours
  sendVerificationEmail: async ({ user, url }) => {
    await sendEmail(user.email, verificationEmail({ name: user.name, url }))
  },
},
```

**What Better Auth manages:** Token generation, storage in `verifications` table, expiry, URL construction, marking email as verified.
**What we build:** The `sendVerificationEmail` callback (email dispatch), the email template, and a frontend verification landing page.

**Flow:**
1. User signs up → receives verification email with magic link
2. Token expires in 24h
3. Grace period: 48h of limited access while unverified (can view landing/pricing, cannot access course)
4. Resend button: rate-limited to 3 per hour
5. After clicking link → email verified → auto sign-in → welcome email sent → full access

#### 3.2 Password Recovery (Better Auth built-in)

```ts
// platform/auth/config.ts — add to emailAndPassword config
sendResetPassword: async ({ user, url }) => {
  await sendEmail(user.email, passwordResetEmail({ name: user.name, url }))
},
resetPasswordTokenExpiresIn: 1800, // 30 minutes
revokeSessionsOnPasswordReset: true,
```

**What Better Auth manages:** Token generation/storage/expiry, password hashing, session revocation.
**What we build:** The `sendResetPassword` callback, email template, frontend forgot-password page, and reset-password page.

**Flow:**
1. User clicks "Forgot password" → enters email
2. **Same response regardless of whether email exists** (account enumeration prevention — Better Auth built-in)
3. If email exists → send password reset email with secure link
4. User clicks link → new password form (enter twice for confirmation)
5. On success �� redirect to login page with success toast ("Password updated. Please log in."). No auto-login after reset.
6. Send password-changed confirmation email
7. **All existing sessions invalidated** (`revokeSessionsOnPasswordReset: true`)

**Rate limiting:** 5 reset requests per email per hour via middleware.

#### 3.3 Subscription-to-User Linking (via session_id)

**Purchase flow:**
```
Stripe Checkout → redirect to /purchase/success?session_id={id}
                                    │
                                    ▼
Success page reads session_id from URL
                                    │
                                    ▼
API endpoint: POST /api/checkout/complete
  1. Retrieve Stripe Checkout session via session_id
  2. Get stripeCustomerId + subscription details from session
  3. Create subscription in DB (onConflictDoNothing — webhook may have already created it)
  4. Create user account (Better Auth sign-up)
  5. Link subscription.userId = new user ID
  6. Upgrade user.role from 'free' to 'pro'
  7. Send payment confirmation + course welcome email
  8. Return success → redirect to course dashboard
```

**Key:** The success page is the primary path. The webhook is the idempotent backup. The success page creates the subscription AND the user account in one flow. This eliminates the race condition (webhook might not have fired yet).

**Pre-fill email:** The success page calls Stripe API to get the customer email from the session, then pre-fills the signup form. This prevents the edge case of email mismatch.

#### 3.4 Session Invalidation on Password Change

Already handled by `revokeSessionsOnPasswordReset: true` (Section 3.2) and `revokeOtherSessions: true` in the client-side `changePassword()` call.

#### 3.5 Google OAuth (Deferred — V2)

Not building now. When ready: add `socialProviders.google` to Better Auth config with `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`. Account linking is on by default in Better Auth.

---

## 4. Auth Transactional Emails

### Email Templates (in auth-emails.ts)

#### 4.1 Email Verification
- **Trigger:** User signup (Better Auth `sendVerificationEmail` callback)
- **Subject:** "Verify your email — Right Decision"
- **Content:** Greeting, "Click below to verify your email", CTA button → verification URL, "This link expires in 24 hours", "If you didn't create an account, ignore this email"
- **Tone:** Welcoming, brief, no hype

#### 4.2 Welcome
- **Trigger:** Email verified (Better Auth `autoSignInAfterVerification` callback or post-verification hook)
- **Subject:** "Welcome to Right Decision"
- **Content:** Greeting, "Your account is verified and ready", conditional: if active subscription → "Your course is waiting" + link to course dashboard; if free → link to pricing
- **Tone:** Warm, direct, no fluff

#### 4.3 Password Reset Request
- **Trigger:** Forgot password form submission (Better Auth `sendResetPassword` callback)
- **Subject:** "Reset your password — Right Decision"
- **Content:** Greeting, "Someone requested a password reset", CTA button → reset URL, "This link expires in 30 minutes", "If you didn't request this, you can safely ignore this email"
- **Tone:** Neutral, security-focused, reassuring

#### 4.4 Password Changed Confirmation
- **Trigger:** Successful password change (Better Auth `onPasswordReset` callback)
- **Subject:** "Your password was changed — Right Decision"
- **Content:** Greeting, "Your password was successfully changed on {date}", "All other sessions signed out", "If you didn't make this change, reset immediately" + link
- **Tone:** Alert but not alarming, actionable

---

## 5. Payment Lifecycle Emails

### Email Templates (in payment-emails.ts)

#### 5.1 Payment Confirmation + Course Welcome
- **Trigger:** Success page flow (Section 3.3, step 7) — NOT the webhook
- **Subject:** "You're in — here's your first step"
- **Content:** Greeting, receipt ("$197.00 — Right Decision: The Course (Annual)"), "Your access is active until {renewal_date}", first step guidance with CTA to first lesson, "If you have questions, reply to this email"
- **Tone:** Celebratory but grounded. "You decided. Now let's move." Anti-self-help voice.

**This email doubles as the onboarding welcome for MVP.** No drip sequence needed until V2.

#### 5.2 Renewal Receipt
- **Trigger:** `invoice.payment_succeeded` webhook (renewals only — `billing_reason === 'subscription_cycle'`)
- **Subject:** "Your Right Decision subscription renewed"
- **Content:** Greeting, receipt ("$197.00 charged to {card_last4}"), "Your access continues through {next_renewal_date}", link to Stripe Customer Portal
- **Tone:** Informational, brief

#### 5.3 Payment Failed
- **Trigger:** `invoice.payment_failed` webhook
- **Subject:** "Your payment didn't go through"
- **Content:** Greeting, "Your payment of $197.00 couldn't be processed", "This happens — usually an expired card or temporary hold", CTA → Stripe Customer Portal, "Course access stays active while we retry (14 days)", "Questions? Reply to this email"
- **Tone:** Helpful, not alarming. "This happens" normalizes it.

#### 5.4 Renewal Reminder (7 Days Before)
- **Trigger:** `invoice.upcoming` webhook (Stripe configured to fire 7 days before charge)
- **Subject:** "Your subscription renews in 7 days"
- **Content:** Greeting, "Your subscription ($197.00/year) renews on {date}", "Payment method: {card_brand} ending in {last4}", links to update card / cancel via Customer Portal
- **Tone:** Informational, transparent. Give them control.

#### 5.5 Subscription Cancelled (User-Initiated)
- **Trigger:** `customer.subscription.updated` with `cancel_at_period_end = true`, OR `customer.subscription.deleted` where last status was not `past_due`
- **Subject:** "Your subscription has been cancelled"
- **Content:** Greeting, "Your subscription has been cancelled", "You'll have access until {period_end_date}", CTA to resubscribe, "We'd love to know what we could have done better. Reply to this email."
- **Tone:** Respectful, no guilt.

#### 5.6 Access Revoked (Involuntary — Payment Failure)
- **Trigger:** `customer.subscription.deleted` where last status was `past_due` (Stripe cancelled after 14-day retry window)
- **Subject:** "Your course access has been paused"
- **Content:** Greeting, "We weren't able to process your payment after multiple attempts", "Your access has been paused", CTA to reactivate, "If there's anything we can help with, reply to this email"
- **Tone:** Matter-of-fact, door always open. Not punitive.

---

## 6. Access-Gating Middleware (NEW — from eng review)

### The Problem
No middleware checks subscription status before serving course content. `requirePermission` only checks `user.role`. If role is `pro` but subscription is `cancelled`, the user still has full access. Dunning and revocation are meaningless without enforcement.

### What to Build

```ts
// features/(shared)/subscription/require-subscription.ts
export function requireActiveSubscription(c, next) {
  // 1. Get user from context (via requireAuth)
  // 2. Query subscription by userId
  // 3. Map status to access:
  //    active → allow
  //    past_due → allow (grace period)
  //    trialing → allow
  //    cancelled → deny (throwError 'SUBSCRIPTION_REQUIRED')
  //    no subscription → deny
}
```

**Apply to course routes:** Stack after `requireAuth`:
```ts
courseRoutes.use(requireAuth, requireActiveSubscription)
```

This is the enforcement layer for everything in sections 5-6. Without it, emails promise revocation but nothing enforces it.

**Why not just change the role?** Because role changes are one-way and hard to undo. If we set role to `free` on cancellation, we need custom logic to set it back to `pro` when they resubscribe. The middleware approach checks subscription status in real-time — role stays `pro`, but access is gated by subscription status.

---

## 7. Dunning & Revenue Recovery

### Strategy (MVP)

**Stripe Dashboard config (manual, no code):**
1. Billing → Revenue Recovery: Enable Smart Retries (ML-optimized retry times)
2. Billing → Subscription and emails → Manage failed payments: Set retry for 14 days, then cancel subscription
3. Billing → Subscription and emails → Days before renewal: Set to 7 days (for `invoice.upcoming` webhook timing)

**Our code on top:**
1. On `invoice.payment_failed` → set subscription status to `past_due` + send payment-failed email (Section 5.3)
2. Grace period: Stripe retries for 14 days. During this time, `past_due` subscriptions still get course access (via access-gating middleware, Section 6)
3. After 14 days → Stripe cancels subscription → fires `customer.subscription.deleted` → set status to `cancelled` + send access-revoked email (Section 5.6)
4. `cancelled` subscriptions are denied by access-gating middleware

**Key insight:** The 14-day grace period is Stripe's retry window, not our custom timer. Zero code needed to enforce timing. Stripe owns the schedule.

### V2 Enhancements (500+ subscribers)
- Multi-stage dunning emails (day 0, 3, 7, 14 with escalating urgency) — requires scheduled jobs system
- Hard vs soft decline differentiation
- Cancellation survey for churn analysis

---

## 8. Stripe Customer Portal

### What to Build

**Stripe Dashboard config (manual prerequisite):**
1. Settings → Customer Portal
2. Enable: Update payment method, View invoice history, Cancel subscription
3. Set brand colors: primary `#C4956A`, background `#FAF8F5` (accept Stripe controls the UI)
4. Add logo
5. Set cancellation flow: ask reason (optional), cancel at period end

**Portal session endpoint:**
```ts
// features/(shared)/subscription/customer-portal.ts
// POST /api/subscription/portal → returns portal URL
// Requires: requireAuth middleware
// 1. Get userId from context
// 2. Look up subscription by userId → get stripeCustomerId
// 3. Create Stripe billing portal session:
//    payments.billingPortal.sessions.create({ customer: stripeCustomerId, return_url: PUBLIC_APP_URL })
// 4. Return success(c, { url: session.url })
```

Wire in routes.ts: `.route('/api/subscription/portal', portalRoutes)`

**Link from user settings:** "Manage Billing" button → opens portal URL in new tab.

---

## 9. Compliance & Deliverability

### Domain Authentication
Resend domain (rightdecision.io) is already verified. Verify SPF, DKIM, and DMARC records:
```sh
dig TXT rightdecision.io +short              # SPF
dig TXT resend._domainkey.rightdecision.io +short  # DKIM
dig TXT _dmarc.rightdecision.io +short        # DMARC
```

### Email Footer
Every email includes a footer with:
- "Right Decision" brand name
- `{PHYSICAL_ADDRESS_PLACEHOLDER}` — to be replaced with actual address before public launch
- Transactional emails: no unsubscribe needed (legally exempt)
- Future marketing emails: one-click unsubscribe (CAN-SPAM + Gmail requirements)

### Bounce & Complaint Handling
Rely on Resend's built-in suppression for MVP. Resend automatically stops delivering to addresses that hard-bounced. No custom suppression table needed until 1000+ sends/day.

---

## NOT in Scope

| Item | Rationale |
|------|-----------|
| Google OAuth | No credentials ready. Deferred to V2. |
| New device login alerts | Requires device fingerprinting. P1. |
| Email suppressions table | Resend handles bounces. Revisit at scale. |
| Win-back email sequences | No churn data exists yet. |
| Multi-stage dunning | One email sufficient for MVP. Optimize at 500+ subscribers. |
| Onboarding drip sequence | Payment confirmation email doubles as welcome. Full drip at 50+ users. |
| Scheduled jobs infrastructure | Not needed until drip sequence. |
| 30-day renewal reminder | 7-day reminder sufficient for launch. |
| Email open/click tracking | Privacy-first. |
| Legacy `purchases` table migration | No users on old payment flow in production (pre-revenue). Table remains as dead code. |

---

## What Already Exists

| Existing Code | Plan Reuses It? | Notes |
|---------------|-----------------|-------|
| `providers/email.ts` (Resend wrapper) | Yes, extends signature | Breaking change migrated atomically |
| `handle-webhook.ts` (3 event handlers) | Yes, adds idempotency + 3 new handlers | Fixes status conflation bug |
| `reminders.ts` (3 email functions) | Yes, migrates to template system | Fixes dedup bug |
| Better Auth verifications table | Yes, used for email verification | No custom token management |
| Better Auth password reset | Yes, used for forgot-password | No custom token management |
| Better Auth account linking | Yes, on by default | No code needed |
| `subscriptions` table (status enum) | Yes, `past_due` used for grace period | No schema change needed |
| `requireAuth` middleware | Yes, stacked with new `requireActiveSubscription` | No modification needed |

---

## Summary: All New Files

| File | Purpose |
|------|---------|
| `features/(shared)/email/layout.ts` | Shared branded HTML layout + plain-text generation |
| `features/(shared)/email/auth-emails.ts` | 4 auth templates + 3 migrated reminder templates |
| `features/(shared)/email/payment-emails.ts` | 6 payment lifecycle templates |
| `features/(shared)/email/CLAUDE.md` | Module CLAUDE.md |
| `features/(shared)/subscription/customer-portal.ts` | Stripe Customer Portal session endpoint |
| `features/(shared)/subscription/helpers.ts` | getUserForSubscription helper |
| `features/(shared)/subscription/require-subscription.ts` | Access-gating middleware |

**Modified files:**

| File | Change |
|------|--------|
| `providers/email.ts` | Updated `sendEmail` to accept `{ subject, html, text }` |
| `platform/auth/config.ts` | Add emailVerification + sendResetPassword + revokeSessionsOnPasswordReset |
| `platform/db/schema.ts` | Add `webhookEvents` table |
| `platform/server/routes.ts` | Mount portal route |
| `features/(shared)/subscription/handle-webhook.ts` | Add idempotency, 3 new event handlers, fix status conflation |
| `features/(shared)/subscription/create-checkout.ts` | Add POST /complete endpoint for success page flow |
| `features/(shared)/email/reminders.ts` | Migrate to new template system + fix dedup bug |

**New DB table:** `webhook_events` (idempotency tracking)

**No new env vars needed** — all credentials already exist.

---

## Failure Modes

| Codepath | Failure Scenario | Has Test? | Has Error Handling? | User Sees |
|----------|-----------------|-----------|---------------------|-----------|
| Success page → Stripe session retrieval | Invalid/expired session_id | Planned | Planned (redirect to error page) | Clear error |
| Success page → subscription creation | DB insert fails | Planned | Planned (throwError) | Error message |
| Webhook → getUserForSubscription | Subscription not linked to user | Planned | Yes (returns null, skip email) | Silent (correct) |
| Webhook → email send fails | Resend API down | Planned | **NEEDS**: try/catch around sendEmail, log error, don't fail webhook | Silent (bad) — **add error handling** |
| Access-gating → no subscription found | User deleted subscription externally | Planned | Planned (deny access) | "Subscription required" |
| Password reset → expired token | User clicks link after 30 min | Planned | Better Auth handles | Clear error page |

**Critical gap:** Webhook email sending must be wrapped in try/catch. If sendEmail throws (Resend down), the webhook handler should still return `success(c, { received: true })` — otherwise Stripe retries the webhook indefinitely. Log the email failure for manual follow-up.

---

## Worktree Parallelization Strategy

| Step | Modules Touched | Depends On |
|------|----------------|------------|
| Email templates (1.1-1.3) | features/(shared)/email/, providers/email | — |
| DB migration (2.1) | platform/db/schema | — |
| Webhook hardening (2.2-2.7) | features/(shared)/subscription/ | DB migration, Email templates |
| Auth config (3.1-3.2) | platform/auth/ | Email templates |
| Success page flow (3.3) | features/(shared)/subscription/ | Auth config, Email templates |
| Access-gating (6) | features/(shared)/subscription/ | — |
| Customer portal (8) | features/(shared)/subscription/ | — |

**Parallel lanes:**
- **Lane A:** Email templates + DB migration (independent, no shared modules)
- **Lane B:** Access-gating middleware + Customer portal (independent of Lane A)
- **Lane C (after A):** Webhook hardening + Auth config + Success page flow (sequential, shared subscription module)

**Execution order:** Launch A + B in parallel. Merge both. Then C.

---

## Documents That May Need Updating

| Document | Why |
|----------|-----|
| `decisions/architecture.md` | New email module, webhook idempotency pattern, access-gating pattern |
| `decisions/coding.md` | Email template conventions |
| `decisions/hardening.md` | Auth enhancements (verification, password recovery) |
| `decisions/roadmap.md` | Add email/auth/payments milestone |

---

## Next Step
Run `/d-tasks` to convert this document into beads for implementation.
