# playbook

## Purpose
Member-facing Life Playbook / Starter Notebook API (P5): the user's program-scoped fill-in
documents. Templates come from enrollments → programs → document_templates (published only);
a `documents` row is instantiated LAZILY on first read per template, pinning templateVersion.
Every saved answer is a structured row (document_answers = ADR 9's typed rows) and a decision
event — this is the data the AI layer (P6) and the Decision Graph read.

## Critical Rules
- NEVER validate a fieldId against the template's CURRENT schema — always against the
  version view of the document's PINNED templateVersion
  (`schemaForVersion(template.schema, doc.templateVersion)` from platform/templates).
  Unknown field for that version = ANSWER_FIELD_INVALID.
- saveAnswer is ONE transaction: answer upsert + documents.status transition +
  record('answer_saved', tx) (+ 'document_started' on empty→in_progress,
  'document_completed' on →complete). If any write fails, ALL roll back —
  never a saved answer without its decision event.
- Typed answers set source='typed' AND confirmedAt=now — confirmation is implicit for
  typing (ADR 11's unconfirmed state exists for interview answers only, written by P6).
- Lazy instantiation is idempotent: onConflictDoNothing on documents(userId, templateId),
  then re-select. Reading never bumps a pinned version; pinning happens exactly once.
- Document status derives from data: required fields (of the pinned view) all answered →
  'complete'; any answer → 'in_progress'; else 'empty'. Progress counts (filled/total per
  page + chapter) count ALL fields of the pinned view; completion counts REQUIRED only.
- Routes are enrollment-gated (requireEnrollment with templateId → programId resolver);
  the index endpoint scopes by active enrollments in SQL instead. NEVER serve draft
  templates to members.
- NEVER put answer values in event properties — fieldId/documentId only (PII rule).
- Answer values render in export HTML — ALWAYS escape them (escapeHtml in export.ts).

## Decision: "PDF export" = print-ready HTML (v1)
The export endpoint returns a self-contained print-ready HTML document (white background,
ink text, Instrument Serif heads, gold ONLY for rules/accents, @media print stylesheet) and
the user prints to PDF from the browser. We deliberately did NOT render a PDF binary with
satori: satori produces a single SVG/PNG frame and cannot paginate a multipage document,
and a server-side PDF pipeline (headless Chrome) is overkill for v1. The roadmap's intent —
"white bg, ink text, gold accents, branded, printable" — is fully met by the print
stylesheet. Revisit only if users demand a downloadable .pdf file.

## Imports (use from other modules)
```ts
import { getPlaybook, getPage, saveAnswer, programIdForTemplate } from '@/features/(life)/playbook/service'
import { renderExportHtml } from '@/features/(life)/playbook/export'
import { playbookRoutes } from '@/features/(life)/playbook/routes'
```

## Recipe: New playbook read
```ts
// Scope by ACTIVE enrollment + published templates in SQL, then merge user rows:
const rows = await db
  .select({ template: documentTemplates })
  .from(documentTemplates)
  .innerJoin(enrollments, and(
    eq(enrollments.programId, documentTemplates.programId),
    eq(enrollments.userId, userId),
    activeEnrollmentClause(),
  ))
  .where(eq(documentTemplates.status, 'published'))
// then ensureDocument(userId, template) — lazy, pins template.version
```

## Verify
```sh
source /tmp/test-env.sh && DATABASE_URL=postgresql://test:test@localhost:5432/test_b4 bun test "features/(life)/playbook"
```

---
## Files
| File | Exports |
|------|---------|
| export.ts | escapeHtml, renderExportHtml |
| routes.ts | createPlaybookRoutes, playbookRoutes |
| service.ts | PlaybookProgress, programIdForTemplate, getPlaybook, getPage, getExportData, saveAnswer |

## Internal Dependencies
- features/(shared)
- platform/auth
- platform/db
- platform/errors
- platform/events
- platform/server
- platform/templates
- platform/types

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| export.ts | escapeHtml, renderExportHtml |
| routes.ts | createPlaybookRoutes, playbookRoutes |
| service.ts | PlaybookProgress, programIdForTemplate, getPlaybook, getPage, getExportData, saveAnswer |

## Internal Dependencies
- features/(shared)
- platform/auth
- platform/db
- platform/errors
- platform/events
- platform/server
- platform/templates
- platform/types

<!-- Generated: 2026-06-13T01:29:20.705Z -->
