# Hardening — Security & Quality Baseline

> Last audit: not yet run
> Score: —/10
> Mode: —

## Current Status
No audit has been run yet. Run `/d-harden` to perform the first hardening audit.

## Outstanding Issues
| ID | Severity | Phase | Description | Bead |
|----|----------|-------|-------------|------|

## Resolved Issues
| ID | Description | Resolved | How |
|----|-------------|----------|-----|

## Stack-Specific Notes
- **Auth**: Better Auth with 30-day session expiry, CSRF enabled
- **Payments**: Stripe Checkout (no custom payment forms), webhook signature verification
- **DB**: Drizzle ORM (prevents raw SQL injection by design), PostgreSQL on Railway
- **Deploy**: Railway Dockerfile deploy, multi-stage build

## Audit History
| Date | Mode | Score | Found | Fixed |
|------|------|-------|-------|-------|
