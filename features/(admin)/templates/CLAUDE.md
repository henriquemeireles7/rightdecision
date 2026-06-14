# templates

## Purpose
Admin CRUD for document_templates (P5): author/edit the Life Playbook + Starter Notebook
structure (chapters → pages → fields jsonb), assign templates to programs, publish.
Template structure is course content (TD-4: jsonb authorship doc); answers stay relational.

## Critical Rules
- EVERY schema write is Zod + structurally validated via
  `validateTemplateSchemaForWrite` (platform/templates) — duplicate field ids, select
  without options, options on non-select kinds are all VALIDATION_ERROR. Invalid jsonb
  NEVER reaches the column.
- Field ids are IMMUTABLE once published: updating a published template's schema goes
  through `validatePublishedSchemaUpdate` — removing/renaming an id or changing a kind is
  rejected; deprecation (and adding fields) is allowed and version-stamped server-side.
- Updating a PUBLISHED template's schema BUMPS version (newVersion = version + 1) in the
  same write. Draft edits never bump. First publish flips status only — version stays.
- NEVER delete a template — documents FK to it (cascade would destroy user answers).
  No delete endpoint exists on purpose.
- Deprecation is one-way: a deprecated field keeps its original deprecatedInVersion
  forever (documents pinned before it still render it; later pins never do).
- Admin gating is ROLE-based: `.use(requireAuth).use(requirePermission('manage_content'))`
  — never enrollment-based (eng-schema S7).
- Slug is unique per program (service-enforced — no DB index): duplicate slug within the
  same program = VALIDATION_ERROR.

## Imports (use from other modules)
```ts
import { adminTemplatesRoutes } from '@/features/(admin)/templates/routes'
```

## Recipe: Endpoint contract
```ts
// GET    /            ?programId=    list (drafts included — this is admin)
// POST   /            { programId, slug, title, sortOrder?, schema }  → draft v1
// GET    /:id
// PATCH  /:id         { title?, sortOrder?, programId?, slug?, schema? }
//                     published + schema → immutability check + version bump
// POST   /:id/publish draft → published (version unchanged)
```

## Verify
```sh
source /tmp/test-env.sh && DATABASE_URL=postgresql://test:test@localhost:5432/test_b4 bun test "features/(admin)/templates"
```

---
## Files
| File | Exports |
|------|---------|
| routes.ts | adminTemplatesRoutes |
| service.ts | listTemplates, getTemplate, createTemplate, updateTemplate, publishTemplate |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/server
- platform/templates
- platform/types

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | adminTemplatesRoutes |
| service.ts | listTemplates, getTemplate, createTemplate, updateTemplate, publishTemplate |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/server
- platform/templates
- platform/types

<!-- Generated: 2026-06-13T01:29:20.705Z -->
