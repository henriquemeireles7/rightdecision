# Email, Auth & Payments Polish — Strategy Document

> Created: 2026-04-07
> Source: meta.md (structure) + input.md (founder decisions) + best-practice research
> Pipeline: d-meta → d-input → d-plan → **d-tasks** → d-code

## Purpose
Ship production-quality email, authentication, and payment infrastructure for The Right Decision platform. Everything a senior developer with attention to detail would consider table-stakes. No over-engineering — the basics done right.

## Build Order
1. Email Infrastructure (templates, layout, plain-text)
2. Webhook Hardening (idempotency, new events, logging)
3. Auth Enhancements (email verification, password recovery, subscription linking)
4. Auth Transactional Emails (verification, welcome, password reset, password changed)
5. Payment Lifecycle Emails (confirmation, receipt, failed, renewal reminder, cancelled, revoked)
6. Dunning & Revenue Recovery (Smart Retries, grace period, access revocation)
7. Stripe Customer Portal (self-service billing)
8. Compliance & Deliverability (domain auth verification, footer, bounce handling)

---

## 1. Email Infrastructure

### Current State
`providers/email.ts` exports `sendEmail(to, subject, html)` — a thin Resend wrapper. No template system. No plain-text. No shared layout. Domain verified.

### What to Build

#### 1.1 Email Template System

Create a template module at `features/(shared)/email/` with:

**Shared layout function:**
```ts
// features/(shared)/email/layout.ts
export function emailLayout(content: string, options?: { preheader?: string }): { html: string; text: string }
```

The layout wraps every email in branded HTML:
- **Header:** "Right Decision" wordmark in Instrument Serif (web-safe fallback: Georgia)
- **Body:** Warm cream background (`#FAF8F5`), white content card (`#FFFFFF`), warm near-black text (`#1A1714`)
- **CTA buttons:** Amber/gold (`#C4956A`), white text, 8px border-radius
- **Footer:** "Right Decision" + `{PHYSICAL_ADDRESS_PLACEHOLDER}` + unsubscribe link (for marketing emails only — transactional emails don't need unsubscribe)
- **Width:** 600px max, responsive for mobile
- **Font stack:** `'Instrument Sans', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` (Instrument Sans won't load in most email clients — the fallback stack matches the feel)

**Plain-text generation:**
Every email also produces a plain-text version (strip HTML, convert links to `[text](url)` format). Resend supports sending both HTML + text in a single API call.

**Template functions (one per email type):**
```ts
// features/(shared)/email/templates/payment-confirmation.ts
export function paymentConfirmationEmail(vars: {
  name: string
  amount: string
  firstLessonUrl: string
}): { subject: string; html: string; text: string }
```

Each template returns `{ subject, html, text }`. The `sendEmail` helper is updated to accept these.

#### 1.2 Updated sendEmail

```ts
// providers/email.ts — updated signature
export async function sendEmail(to: string, email: { subject: string; html: string; text: string }): Promise<void>
```

The function sends via Resend with both `html` and `text` fields. Logs email type + recipient for debugging (no content logged).

#### 1.3 Resend Plan Consideration
Resend free tier: 100 emails/day, 3,000/month. For pre-revenue with <100 users, this is sufficient. Upgrade to Pro ($20/month, 50K emails) when approaching 50+ daily active users. No fallback provider — accepted risk for MVP.

### Testing Strategy
- Manual send-and-check in Gmail web, Apple Mail, Outlook.com for each template
- Unit tests verify template functions return valid HTML with correct variables interpolated
- No open/click tracking (privacy-first)

---

## 2. Webhook Hardening

### Current State
`features/(shared)/subscription/handle-webhook.ts` handles 3 events with signature verification. No idempotency. No logging. Missing key events.

### What to Build

#### 2.1 Idempotency Table

```sql
-- New table: webhook_events
webhook_events (
  id uuid PK,
  stripe_event_id text UNIQUE NOT NULL,  -- Stripe event ID (evt_xxx)
  event_type text NOT NULL,
  processed_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
)
```

Before processing any webhook event:
1. Check if `stripe_event_id` exists in `webhook_events`
2. If exists → return `success(c, { received: true })` immediately (already processed)
3. If not → insert the event ID, then process

This prevents duplicate emails and duplicate DB writes when Stripe retries webhooks.

#### 2.2 New Event Handlers

Add to the webhook switch statement:

| Event | Handler |
|-------|---------|
| `invoice.payment_succeeded` | If not first invoice (renewal): send renewal receipt email. Update subscription `currentPeriodEnd`. |
| `invoice.payment_failed` | Set subscription status to `past_due`. Send payment-failed email with Stripe Customer Portal link. Log failure reason. |
| `invoice.upcoming` | Send 7-day renewal reminder email (Stripe sends this ~7 days before charge by default). |

#### 2.3 Logging

Log every webhook event: `console.info(`[webhook] ${event.type} ${event.id}`)`. For payment failures, log the failure reason from the invoice object. This is the minimum needed for debugging payment issues in Railway logs.

---

## 3. Authentication Enhancements

### Current State
Better Auth with email/password. 30-day sessions. No email verification. No password recovery. No Google OAuth (deferred). Subscription not linked to userId.

### What to Build

#### 3.1 Email Verification

Better Auth has built-in email verification support. Enable it:

```ts
// platform/auth/config.ts — add to betterAuth config
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
  sendVerificationEmail: async ({ user, url }) => {
    await sendEmail(user.email, verificationEmail({ name: user.name, url }))
  },
},
```

**Flow:**
1. User signs up → receives verification email with magic link
2. Token expires in 24h
3. Grace period: 48h of limited access while unverified (can view landing/pricing, cannot access course)
4. Resend button: rate-limited to 3 per hour
5. After clicking link → email verified → welcome email sent → full access

**Implementation detail:** Better Auth manages the `verifications` table and token lifecycle. We only need to provide the `sendVerificationEmail` callback and the email template.

#### 3.2 Password Recovery

Better Auth has built-in password reset support. Enable it:

```ts
// platform/auth/config.ts — add to betterAuth config
emailAndPassword: {
  // ...existing config...
  sendResetPassword: async ({ user, url }) => {
    await sendEmail(user.email, passwordResetEmail({ name: user.name, url }))
  },
},
```

**Flow:**
1. User clicks "Forgot password" → enters email
2. **Same response regardless of whether email exists** (account enumeration prevention)
3. If email exists → send password reset email with secure link (Better Auth generates token: cryptographically secure, hashed in DB, 30min expiry, single-use)
4. User clicks link → new password form (enter twice for confirmation)
5. On success → redirect to login page with success toast ("Password updated. Please log in.")
6. Send password-changed confirmation email
7. **All existing sessions invalidated** on password change

**Rate limiting:** 5 reset requests per email per hour. Better Auth handles token security; we add rate limiting via middleware.

#### 3.3 Subscription-to-User Linking

**The problem:** Current purchase flow is: Stripe Checkout (no auth) → webhook creates subscription with `stripeCustomerId` but no `userId` → user lands on success page → creates account.

**The solution:** On account creation (the success page flow):

1. User creates account with the email used at Stripe Checkout
2. After account creation, query subscriptions table for matching `stripeCustomerId` OR match by email via Stripe API:
   ```ts
   // Lookup: find the Stripe customer by email, then link subscription
   const customers = await payments.customers.list({ email: user.email, limit: 1 })
   if (customers.data.length > 0) {
     await db.update(subscriptions)
       .set({ userId: user.id, updatedAt: new Date() })
       .where(eq(subscriptions.stripeCustomerId, customers.data[0].id))
   }
   ```
3. Update user role from `free` to `pro`
4. Send payment confirmation + course welcome email (now that we have a user account to address)

**Edge case:** If user creates account with a different email than they used at checkout, the link won't happen automatically. The success page should pre-fill the email from the Stripe session (via `session_id` query param → Stripe API lookup).

#### 3.4 Session Invalidation on Password Change

Better Auth supports `revokeOtherSessions` on password change. Ensure this is enabled so that when a user changes their password, all other sessions are invalidated.

#### 3.5 Google OAuth (Deferred — V2)

Not building now. When ready:
- Create OAuth client in Google Cloud Console
- Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `platform/env.ts`
- Add Google social provider to Better Auth config
- Handle account linking (same email, different auth method)
- Add "Sign in with Google" button to login/signup pages

---

## 4. Auth Transactional Emails

### Email Templates

#### 4.1 Email Verification
- **Trigger:** User signup
- **Subject:** "Verify your email — Right Decision"
- **Content:**
  - Greeting with name
  - "Click below to verify your email and access your account"
  - CTA button: "Verify Email" → verification URL
  - "This link expires in 24 hours"
  - "If you didn't create an account, ignore this email"
- **Tone:** Welcoming, brief, no hype

#### 4.2 Welcome
- **Trigger:** Email verified
- **Subject:** "Welcome to Right Decision"
- **Content:**
  - Greeting with name
  - "Your account is verified and ready"
  - If user has active subscription: "Your course is waiting" + link to course dashboard
  - If free user: Brief description of what's available + link to pricing
- **Tone:** Warm, direct, no fluff

#### 4.3 Password Reset Request
- **Trigger:** Forgot password form submission (only if email exists — but response is always the same)
- **Subject:** "Reset your password — Right Decision"
- **Content:**
  - Greeting with name
  - "Someone requested a password reset for your account"
  - CTA button: "Reset Password" → reset URL
  - "This link expires in 30 minutes"
  - "If you didn't request this, your password hasn't changed. You can safely ignore this email."
- **Tone:** Neutral, security-focused, reassuring

#### 4.4 Password Changed Confirmation
- **Trigger:** Successful password change
- **Subject:** "Your password was changed — Right Decision"
- **Content:**
  - Greeting with name
  - "Your password was successfully changed on {date} at {time}"
  - "All other sessions have been signed out for your security"
  - "If you didn't make this change, reset your password immediately:" + link to forgot-password page
- **Tone:** Alert but not alarming, actionable

---

## 5. Payment Lifecycle Emails

### Email Templates

#### 5.1 Payment Confirmation + Course Welcome
- **Trigger:** `checkout.session.completed` → after user creates account and subscription is linked
- **Subject:** "You're in — here's your first step"
- **Content:**
  - Greeting with name
  - Receipt details: "$197.00 — Right Decision: The Course (Annual)"
  - "Your access is active until {renewal_date}"
  - **First step guidance:** "The course starts with Act 1: See Clearly. Your first class is ready:" + CTA button to first lesson
  - "If you have questions, reply to this email" (enables direct support)
- **Tone:** Celebratory but grounded. No hype. "You decided. Now let's move." Anti-self-help voice — not "Congratulations on your journey!"

**This email doubles as the onboarding welcome for MVP.** No drip sequence needed until V2.

#### 5.2 Renewal Receipt
- **Trigger:** `invoice.payment_succeeded` (renewals only — skip first invoice, that's covered by 5.1)
- **Subject:** "Your Right Decision subscription renewed"
- **Content:**
  - Greeting with name
  - Receipt: "$197.00 charged to {card_last4}"
  - "Your access continues through {next_renewal_date}"
  - "View your billing history:" + link to Stripe Customer Portal
- **Tone:** Informational, brief

**How to distinguish first payment from renewal:** On `invoice.payment_succeeded`, check if `invoice.billing_reason === 'subscription_cycle'` (renewal) vs `'subscription_create'` (first payment). Only send renewal receipt for `subscription_cycle`.

#### 5.3 Payment Failed
- **Trigger:** `invoice.payment_failed`
- **Subject:** "Your payment didn't go through"
- **Content:**
  - Greeting with name
  - "Your payment of $197.00 for Right Decision couldn't be processed"
  - "This happens — usually it's an expired card or temporary bank hold"
  - CTA button: "Update Payment Method" → Stripe Customer Portal URL
  - "Your course access stays active while we retry. If the payment isn't resolved within 14 days, your access will be paused."
  - "Questions? Reply to this email."
- **Tone:** Helpful, not alarming. "This happens" normalizes it. No urgency — we have 14 days.

#### 5.4 Renewal Reminder (7 Days Before)
- **Trigger:** `invoice.upcoming` webhook (Stripe sends this ~7 days before charge)
- **Subject:** "Your subscription renews in 7 days"
- **Content:**
  - Greeting with name
  - "Your Right Decision subscription ($197.00/year) renews on {date}"
  - "Payment method: {card_brand} ending in {last4}"
  - "Need to update your card?" + link to Stripe Customer Portal
  - "Want to cancel?" + link to Stripe Customer Portal cancellation
- **Tone:** Informational, transparent. No pressure. Give them control.

**Implementation:** When `invoice.upcoming` fires, look up the customer's subscription and email. Stripe includes `customer` and `subscription` in the event data. Fetch user email via subscription → userId → users table.

#### 5.5 Subscription Cancelled
- **Trigger:** `customer.subscription.deleted` (or `cancel_at_period_end` set to true on `customer.subscription.updated`)
- **Subject:** "Your subscription has been cancelled"
- **Content:**
  - Greeting with name
  - "Your Right Decision subscription has been cancelled"
  - "You'll continue to have access until {period_end_date}"
  - "Changed your mind? You can resubscribe anytime:" + CTA button to pricing page
  - "We'd love to know what we could have done better. Reply to this email."
- **Tone:** Respectful, no guilt. "Changed your mind?" is soft and optional. The reply invitation is the simplest possible feedback mechanism.

#### 5.6 Access Revoked
- **Trigger:** 14 days after `invoice.payment_failed` if payment still unresolved (subscription status transitions to `cancelled`)
- **Subject:** "Your course access has been paused"
- **Content:**
  - Greeting with name
  - "We weren't able to process your payment after multiple attempts"
  - "Your access to the course has been paused"
  - CTA button: "Reactivate Your Subscription" → pricing page or Stripe Customer Portal
  - "If there's anything we can help with, reply to this email"
- **Tone:** Matter-of-fact, door always open. Not punitive.

**Implementation note:** This email triggers when the subscription transitions from `past_due` to `cancelled` after the Stripe retry window (14 days). The webhook handler for `customer.subscription.deleted` checks if the cancellation was user-initiated (cancel_at_period_end) vs involuntary (payment failure). Different email for each.

---

## 6. Dunning & Revenue Recovery

### Strategy (MVP)

**Stripe Smart Retries (do first — zero code needed):**
1. Go to Stripe Dashboard → Billing → Revenue Recovery
2. Enable Smart Retries (Stripe's ML picks optimal retry times)
3. Set to 8 retries over 14 days (Stripe default)
4. This alone recovers a significant portion of failed payments silently

**Our layer on top:**
1. On `invoice.payment_failed` → set subscription status to `past_due` + send payment-failed email (Section 5.3)
2. Grace period: 14 days of full course access while Stripe retries
3. After 14 days → if still unpaid → Stripe fires `customer.subscription.deleted` → set status to `cancelled` + send access-revoked email (Section 5.6)
4. Access check middleware: `past_due` still gets `pro` permissions. `cancelled` gets `free` permissions.

**Access degradation logic:**
```ts
// In requireAuth middleware or subscription check:
// active → pro (full access)
// past_due → pro (full access, grace period)
// cancelled → free (landing + pricing only)
// trialing → pro (if we ever add trials)
```

### V2 Enhancements (500+ subscribers)
- Multi-stage dunning emails (day 0, 3, 7, 14 with escalating urgency)
- Hard vs soft decline differentiation (requires Stripe `invoice.payment_failed` `payment_intent.last_payment_error.decline_code`)
- Scheduled jobs system for timed emails
- Cancellation survey for churn analysis

---

## 7. Stripe Customer Portal

### What to Build

**Configure in Stripe Dashboard:**
1. Settings → Customer Portal
2. Enable: Update payment method, View invoice history, Cancel subscription
3. Set brand colors: primary `#C4956A`, background `#FAF8F5`
4. Add logo
5. Set cancellation flow: ask reason (optional), immediate cancellation at period end

**Create portal session endpoint:**
```ts
// features/(shared)/subscription/customer-portal.ts
// POST /api/subscription/portal → returns portal URL
// Requires auth (requireAuth middleware)
// Looks up stripeCustomerId from subscription linked to userId
// Creates Stripe billing portal session
// Returns portal URL for client redirect
```

**Link from user settings:**
- Add "Manage Billing" link/button in user settings page
- Opens Stripe Customer Portal in new tab

---

## 8. Compliance & Deliverability

### Domain Authentication
Resend domain (rightdecision.com) is already verified. Verify that SPF, DKIM, and DMARC records are correctly configured:
```sh
# Check SPF
dig TXT rightdecision.com +short
# Check DKIM
dig TXT resend._domainkey.rightdecision.com +short
# Check DMARC
dig TXT _dmarc.rightdecision.com +short
```

### Email Footer
Every email includes a footer with:
- "Right Decision" brand name
- `{PHYSICAL_ADDRESS_PLACEHOLDER}` — to be replaced with actual address before public launch
- For transactional emails: no unsubscribe link needed (legally exempt)
- For future marketing emails: one-click unsubscribe (CAN-SPAM + Gmail requirements)

### Bounce & Complaint Handling
1. Configure Resend webhook for bounce and complaint events
2. Maintain a suppression list in DB (emails that bounced or complained)
3. Check suppression list before sending any email
4. This prevents sending to dead addresses and protects sender reputation

**Table:**
```sql
email_suppressions (
  id uuid PK,
  email text UNIQUE NOT NULL,
  reason text NOT NULL,  -- 'bounce' | 'complaint'
  created_at timestamp NOT NULL DEFAULT now()
)
```

---

## Summary: All New Database Tables

| Table | Purpose |
|-------|---------|
| `webhook_events` | Idempotency tracking for Stripe webhooks |
| `email_suppressions` | Bounce/complaint suppression list |

**Modified tables:**
| Table | Change |
|-------|--------|
| `subscriptions` | Link `userId` after account creation |

**No new env vars needed** — Better Auth, Stripe, and Resend credentials already exist. Google OAuth env vars deferred to V2.

---

## Summary: All New Files

| File | Purpose |
|------|---------|
| `features/(shared)/email/layout.ts` | Shared branded HTML layout + plain-text generation |
| `features/(shared)/email/templates/verification.ts` | Email verification template |
| `features/(shared)/email/templates/welcome.ts` | Welcome email template |
| `features/(shared)/email/templates/password-reset.ts` | Password reset request template |
| `features/(shared)/email/templates/password-changed.ts` | Password changed confirmation template |
| `features/(shared)/email/templates/payment-confirmation.ts` | Payment confirmation + course welcome |
| `features/(shared)/email/templates/renewal-receipt.ts` | Annual renewal receipt |
| `features/(shared)/email/templates/payment-failed.ts` | Payment failed + update card CTA |
| `features/(shared)/email/templates/renewal-reminder.ts` | 7-day renewal reminder |
| `features/(shared)/email/templates/subscription-cancelled.ts` | Cancellation confirmation |
| `features/(shared)/email/templates/access-revoked.ts` | Access revoked after grace period |
| `features/(shared)/email/CLAUDE.md` | Module CLAUDE.md |
| `features/(shared)/subscription/customer-portal.ts` | Stripe Customer Portal session endpoint |

**Modified files:**
| File | Change |
|------|--------|
| `providers/email.ts` | Updated `sendEmail` to accept `{ subject, html, text }` |
| `platform/auth/config.ts` | Add email verification + password reset callbacks |
| `platform/db/schema.ts` | Add `webhook_events` + `email_suppressions` tables |
| `platform/env.ts` | No changes needed (all env vars exist) |
| `platform/errors.ts` | Add email-related error codes if needed |
| `features/(shared)/subscription/handle-webhook.ts` | Add idempotency, new event handlers, email sending |
| `features/(shared)/subscription/create-checkout.ts` | Pre-fill email from session, link subscription to user |

---

## Documents That May Need Updating

| Document | Why |
|----------|-----|
| `decisions/architecture.md` | New email module, webhook idempotency pattern |
| `decisions/coding.md` | Email template conventions |
| `decisions/hardening.md` | Auth enhancements (verification, password recovery) |
| `decisions/roadmap.md` | Add email/auth/payments milestone |

---

## Next Step
Run `/d-tasks` to convert this document into beads for implementation.
