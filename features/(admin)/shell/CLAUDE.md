# shell

## Purpose
The /admin SSR shell route: serves the admin SPA's HTML shell (hashed client/admin bundle
from public/build/manifest.json + /styles.css) and the /admin/media/* signed-redirect for
rendering R2 cover/candidate images in the panel. Gated by session + admin ROLE.

## Critical Rules
- Non-admin (any authenticated role that isn't 'admin') gets 404 via c.notFound(), NEVER
  403 — the panel's existence is not advertised. Unauthenticated gets a /login redirect
  (same as other SSR member pages).
- Admin gating stays ROLE-based (eng-schema S7) — never enrollment-based.
- NEVER hardcode a hashed bundle filename — always read public/build/manifest.json
  (cached after first successful read; hashes only change across deploys/restarts).
- /admin/media/* only REDIRECTS to a short-lived signed R2 URL (getSignedUrl) — bytes never
  proxy through Hono.
- Keep the module CHAINED and side-effect injectable: createAdminShellRoutes(deps) takes
  getSession/loadManifest/signMediaUrl overrides so tests run without Better Auth, a built
  bundle, or R2.
- This is an HTML shell, not an API — c.html()/c.redirect()/c.notFound() are correct here;
  the JSON envelope rules apply to the /api/admin/* routes, not this module.

## Imports (use from other modules)
```ts
import { adminShellRoutes } from '@/features/(admin)/shell/routes'
```

## Recipe: Mount (platform/server/routes.ts)
```ts
.route('/admin', adminShellRoutes) // BEFORE the '/' catch-alls
```

## Verify
```sh
source /tmp/test-env.sh && bun test "features/(admin)/shell"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | ShellDeps, createAdminShellRoutes, adminShellRoutes |

## Internal Dependencies
- platform/auth
- platform/types
- providers/storage

<!-- Generated: 2026-06-13T00:43:48.444Z -->
