# materials

## Purpose
Admin CRUD for downloadable materials (R2 files), presigned PUT upload URLs, and the
program_materials mapping (which programs include which materials).

## Critical Rules
- NEVER proxy file bytes through Hono — `requestMaterialUploadUrl()` returns a presigned
  PUT URL from `storage.getUploadUrl()`; the client PUTs directly to R2.
- File keys are server-generated (`materials/<uuid>/<sanitized-filename>`) — NEVER accept a
  client-supplied key (path-traversal surface; storage.ts rejects unsafe keys as backstop).
- `lessonId` is optional on a material; when given it MUST exist → LESSON_NOT_FOUND.
- Program mapping is idempotent: adding an existing (programId, materialId) pair no-ops via
  onConflictDoNothing; removing a missing pair returns NOT_FOUND.
- Materials MAY be deleted (unlike lives) — FK cascade removes program_materials rows.

## Imports (use from other modules)
```ts
import { adminMaterialsRoutes } from '@/features/(admin)/materials/routes'
```

## Recipe: Upload flow (client-side contract)
```ts
// 1. POST /upload-url { fileName, mimeType } → { uploadUrl, fileKey }
// 2. Client PUTs the file to uploadUrl (direct to R2)
// 3. POST / { title, fileKey, fileSizeBytes, mimeType, lessonId? } → material row
```

## Verify
```sh
source /tmp/test-env.sh && DATABASE_URL=postgresql://test:test@localhost:5432/test_b1 bun test "features/(admin)/materials"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | adminMaterialsRoutes |
| service.ts | requestMaterialUploadUrl, createMaterial, listMaterials, updateMaterial, deleteMaterial, addMaterialToProgram, removeMaterialFromProgram, listProgramMaterials |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/server
- platform/types
- providers/errors
- providers/storage

<!-- Generated: 2026-06-12T23:31:24.935Z -->
