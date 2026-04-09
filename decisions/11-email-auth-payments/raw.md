# Email, Auth & Payments — Raw Input

> Captured: 2026-04-07

## Founder Answers

### Q1: Signup-to-purchase flow
**Answer:** User purchases first via Stripe Checkout, then creates account — reverse flow.

Context from codebase: Current checkout creates subscriptions with stripeCustomerId but no userId. The subscription record needs to be linked to the user account after they sign up on the success page.

### Q2: Infrastructure state
**Answer:** Resend domain is verified (rightdecision.io), no Google OAuth credentials yet.

Implication: Google OAuth is deferred — ship email/password + payment emails first. Google OAuth becomes a future enhancement.

### Q3: CAN-SPAM physical address
**Answer:** Skip for now, add before public launch.

Implication: Email footer template should have a placeholder for physical address that's easy to fill in later.

### Q4: Grace period on payment failure
**Answer:** 14 days — generous, maximizes recovery.

### Q5: Initial request (from conversation)
Henry's exact words: "We need to get our emails right. For example we need transactional emails, we need password recovery, we need google auth, we need email when the user pays, we need emails that makes sense for our product. Life decisions is just a course so we should have an email sequence (IDK the best practices here we need to research) - the idea is to make the basic fundamental stuff get done in the right way. like are there emails necessary when user renewal? for now its early but we should have this email done, if payment fails we have a recovery email? so the idea here is to improve these 3 shared features of our app so that it works like a professional app, just what a senior developer with attention to details would ship."

Key theme: "Professional app, senior developer with attention to detail." Not over-engineered, but complete. The basics done right.

## Codebase State (captured from code exploration)

### Email (providers/email.ts)
- Resend wrapper, exports `sendEmail(to, subject, html)`
- From: `Right Decision <henry@rightdecision.io>`
- No template system, no plain-text fallback
- Domain verified in Resend

### Auth (platform/auth/)
- Better Auth with email/password only
- 30-day sessions, daily refresh
- No Google OAuth (deferred)
- No email verification flow (emailVerified column exists in schema but unused)
- No password recovery flow
- `verifications` table exists (Better Auth managed) — can be used for tokens
- Roles: free, pro, admin (non-additive)

### Payments (features/(shared)/subscription/)
- Stripe Checkout for subscriptions ($197/year)
- Webhook handles: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
- No invoice.payment_failed handler
- No invoice.payment_succeeded handler (for renewal receipts)
- No invoice.upcoming handler (for renewal reminders)
- No idempotency (no event ID deduplication)
- No emails sent on any payment event
- Subscription status enum: active, past_due, cancelled, trialing
- Subscription NOT linked to userId (only stripeCustomerId)
- No Stripe Customer Portal integration

### Schema gaps
- subscriptions.userId is nullable — needs to be linked after account creation
- No webhook_events table for idempotency tracking
- No email_logs or sent_emails tracking
