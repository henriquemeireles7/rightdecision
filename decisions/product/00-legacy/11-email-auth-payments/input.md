# Email, Auth & Payments — Structured Input

> Captured: 2026-04-07
> Source: founder answers + codebase analysis + best-practice research

## Product Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Signup-to-purchase flow | Purchase first, account second | User buys via Stripe Checkout → lands on success page → creates account. Subscription linked to user after account creation. |
| Google OAuth | Deferred | No credentials ready. Ship email/password + payment emails first. Add Google OAuth as enhancement later. |
| CAN-SPAM address | Deferred | Add physical address to email footer before public launch. Template has placeholder. |
| Grace period | 14 days | Generous grace on payment failure. Full access for 14 days while Stripe Smart Retries + dunning email run. |
| Onboarding drip | V2 | Payment confirmation email doubles as welcome + first-step guide. Full drip sequence when 50+ users. |
| Win-back sequence | V2 | Build when churn data exists. |
| Multi-stage dunning | V2 | MVP: one payment-failed email + Stripe Smart Retries. Multi-stage when 500+ subscribers. |

## User Flow: Purchase → Account → Course

```
1. User lands on pricing page (unauthenticated)
2. Clicks "Start Now" → Stripe Checkout (subscription mode, $197/yr)
3. Stripe processes payment → webhook: checkout.session.completed
4. User redirected to /purchase/success?session_id={id}
5. Success page: "Create your account to access the course"
6. User enters name + password → account created
7. Subscription linked to userId (via stripeCustomerId match)
8. User role upgraded from 'free' to 'pro'
9. Email: payment confirmation + welcome + first lesson link
10. User redirected to course dashboard
```

Key: The subscription already exists in DB (from webhook) before the user creates their account. Account creation links the existing subscription.

## Email Inventory (MVP — P0 only)

### Auth Emails
1. **Email verification** — after signup, 24h token, grace period
2. **Welcome** — post-verification, course access confirmed
3. **Password reset request** — secure token, same response regardless
4. **Password changed confirmation** — security notification

### Payment Emails
5. **Payment confirmation + course welcome** — on checkout.session.completed, includes first lesson link
6. **Renewal receipt** — on invoice.payment_succeeded (renewals only, not first payment)
7. **Payment failed** — on invoice.payment_failed, update-card link to Stripe Customer Portal
8. **Renewal reminder (7 days)** — before annual charge, via invoice.upcoming webhook
9. **Subscription cancelled** — on customer.subscription.deleted, when access ends, reactivation link
10. **Access revoked** — after 14-day grace period, reactivation link

Total: 10 emails for MVP.

## Infrastructure Needed

### Email Template System
- Shared HTML layout: Instrument Serif + warm cream palette (from design.md)
- Every email gets: branded header, content area, footer with unsubscribe placeholder + address placeholder
- Plain-text fallback for every email
- `sendEmail` wrapper updated to accept template name + variables

### Webhook Hardening
- Add `webhook_events` table (eventId, eventType, processedAt) for idempotency
- Add handlers: invoice.payment_failed, invoice.payment_succeeded, invoice.upcoming
- Log all webhook events

### Stripe Customer Portal
- Configure in Stripe Dashboard
- Add portal session creation endpoint
- Link from user settings page

### Auth Enhancements
- Email verification flow (Better Auth has built-in support)
- Password recovery flow (Better Auth has built-in support)
- Link subscription to userId on account creation
- Invalidate all sessions on password change

## What NOT to Build
- Google OAuth (deferred — no credentials)
- New device login alerts (P1)
- Scheduled jobs system (V2 — not needed until drip sequence)
- Win-back emails (V2 — no churn data)
- Multi-stage dunning (V2 — one email sufficient for now)
- Email open tracking (privacy-first)
- 30-day renewal reminder (P1 — 7-day sufficient)
