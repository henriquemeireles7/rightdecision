# Deploy — How We Ship

> Last verified: 2026-04-06

## Infrastructure
- **Hosting:** Railway (app + PostgreSQL, same provider = zero network hop)
- **Container:** Dockerfile with Bun image
- **Database:** PostgreSQL on Railway
- **GitHub:** henriquemeireles7
- **Email:** hsameireles@gmail.com

## Subdomain Strategy
- `therightdecision.com` — Main website (brand, pricing page, both products)
- `app.therightdecision.com` — Course platform (Life Decisions + Business Decisions)
- `api.therightdecision.com` — Automation APIs (Business Decisions)
- All served from same Railway deployment, route-based separation

## Environment Variables
All env vars flow through `platform/env.ts` via `@t3-oss/env-core` + Zod validation.
Build crashes if env vars are missing or invalid. Never use `process.env` directly.

Required vars (see `.env.example`):
- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — auth session signing
- `STRIPE_SECRET_KEY` — payment processing
- `STRIPE_WEBHOOK_SECRET` — webhook verification
- `RESEND_API_KEY` — transactional email

## Config-as-Code (`railway.toml`)
All build and deploy settings are version-controlled in `railway.toml` at the repo root.
Code config **always overrides** Railway dashboard settings.

What it controls:
- **Builder:** `DOCKERFILE` — uses our multi-stage Dockerfile
- **Start command:** `bun run dist/app.js`
- **Healthcheck:** `GET /health` with 300s timeout — Railway rolls back if it fails
- **Restart policy:** `ON_FAILURE` with 5 retries — auto-recovers from crashes
- **Replicas:** 1 (scale up by changing `numReplicas`)

What it does NOT control (use `railway variable set` or dashboard):
- Environment variables (DATABASE_URL, secrets, etc.)
- Custom domains and networking
- Volume mounts

Rules:
- NEVER configure build/deploy settings in the dashboard — they'll be overridden by `railway.toml`
- To add pre-deploy migrations: add `preDeployCommand = "bun run db:migrate"` to `[deploy]`
- To add environment overrides: use `[environments.staging.deploy]` sections
- Config file path does NOT follow Root Directory — always use absolute path from repo root

## CI Pipeline
GitHub Actions: `biome ci` → `tsc --noEmit` → `bun test` → `bun run build`

## Deploy Checklist
1. `bun run check` passes locally (lint + typecheck + test)
2. Push to branch, CI green
3. Railway auto-deploys from main branch
4. Verify health endpoint
5. Check database migrations ran

## Database Migrations
```bash
bun run db:generate  # Generate migration from schema changes
bun run db:migrate   # Apply migrations
bun run db:seed      # Seed dev data (dev only)
bun run db:studio    # Open Drizzle Studio for inspection
```

## Deploy Anti-patterns
- Deploying without running `bun run check` first
- Manual database migrations on production — automate in deploy pipeline
- Storing secrets in `.env` files committed to git — use Railway dashboard
- Running `bun run dev` on production — always use the built Dockerfile
- Skipping health check verification after deploy
- Creating separate Railway services before the monolith needs splitting
- Using preview environments without verifying env var parity
- Force-pushing to main branch — always use PRs with CI green
- Deploying on Fridays without monitoring in place

## Domain Setup
- Primary: therightdecision.com (TBD)
- App: app.therightdecision.com (course platform)
- API: api.therightdecision.com (Business Decisions automation)
