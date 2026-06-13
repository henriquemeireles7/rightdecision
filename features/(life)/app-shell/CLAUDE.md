# app-shell

## Purpose
The /app SSR shell for the P3 members SPA: one minimal HTML document (renderPage-style)
with `<div id="app">`, the content-hashed bundle script resolved from
public/build/manifest.json, and `window.__APP_CONFIG__` (manifest + Stream customer code).
Also serves /app/media/* — session-gated 302 redirects to short-lived signed R2 URLs for
catalog cover images (coverImageKey/thumbnailKey are R2 keys, never public URLs).

## Critical Rules
- The /app mount in platform/server/routes.ts MUST stay BEFORE the '/' catch-alls
  (authPageRoutes, websiteRoutes) — otherwise /app deep links 404 into marketing
- NEVER hardcode a bundle filename — resolve through manifest.json every request
  (content hashes change every build; dev rebuilds must not require a server restart)
- Unauthenticated requests redirect to /login?next=<path> — page routes redirect,
  they never return the JSON 401 envelope (mirrors course/page-routes.tsx)
- NEVER sign a media URL without a session — a signed URL is access
- The shell document is NOT renderPage() — the SPA owns its own header/nav/main
  landmarks; the shell ships only the document head, config, and mount point
- `deps` parameters are options injection for TESTS ONLY (getSession/readManifest/signUrl
  stubs) — production callers never pass them

## Imports (use from other modules)
```ts
import { appShellRoutes } from '@/features/(life)/app-shell/routes'
```

## Recipe: Adding config the SPA needs at boot
```ts
// Extend buildAppConfig() in routes.tsx — the SPA reads it via getAppConfig()
// (client/app/config.ts). Only PUBLIC values: this JSON ships to every member.
const config = { manifest, streamCustomerCode: env.CLOUDFLARE_STREAM_CUSTOMER_CODE ?? null }
```

## Verify
```sh
bun test "features/(life)/app-shell" && bunx tsc --noEmit
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.tsx | createAppShellRoutes, appShellRoutes |

## Internal Dependencies
- platform/auth
- platform/env
- platform/errors
- platform/types
- providers/storage

<!-- Generated: 2026-06-13T00:43:48.444Z -->
