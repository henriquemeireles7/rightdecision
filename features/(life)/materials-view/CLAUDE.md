# materials-view

## Purpose
Member-facing materials library API: list the materials mapped to the user's enrolled
program(s) (program_materials join) and issue short-lived R2 download URLs gated by
canAccessMaterial.

## Critical Rules
- ALWAYS gate downloads on canAccessMaterial (features/(shared)/enrollment) — a signed
  URL is access; never sign for unenrolled users (ENROLLMENT_REQUIRED)
- NEVER expose fileKey in list responses — the signed URL from providers/storage
  getSignedUrl is the only download path
- The list query scopes by ACTIVE enrollment join through program_materials — no
  unscoped material reads in this module
- Deduplicate materials mapped to multiple enrolled programs — one row per material
- Material ids that don't exist are NOT_FOUND; existing-but-unenrolled is
  ENROLLMENT_REQUIRED (don't collapse the two — the catalog upsell needs the difference)

## Imports (use from other modules)
```ts
import { listMaterials, getMaterialDownloadUrl } from '@/features/(life)/materials-view/service'
import { materialsViewRoutes } from '@/features/(life)/materials-view/routes'
```

## Recipe: New gated download
```ts
const result = await getMaterialDownloadUrl(userId, materialId)
if ('error' in result) return throwError(c, result.error) // NOT_FOUND | ENROLLMENT_REQUIRED
return success(c, result.data) // { url, title, mimeType }
```

## Verify
```sh
DATABASE_URL=postgresql://test:test@localhost:5432/test_b2 bun test "features/(life)/materials-view"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | createMaterialsViewRoutes, materialsViewRoutes |
| service.ts | programIdsForMaterial, listMaterials, getMaterialDownloadUrl |

## Internal Dependencies
- features/(shared)
- platform/auth
- platform/db
- platform/errors
- platform/server
- platform/types
- providers/storage

<!-- Generated: 2026-06-12T23:31:24.936Z -->
