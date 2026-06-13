# admin

## Purpose
The /admin SPA bundle (Platform V2, Project 2): Preact client-rendered course builder,
programs, cohorts, lives and materials screens for the non-technical co-founder. Served by
features/(admin)/shell/routes.ts (manifest-driven, admin-role gated). Consumes the
features/(admin)/* APIs through features/(shared)/api-client — never hand-rolled fetch.

## Critical Rules
- NEVER import server runtime code (db, env, providers, features services) — this folder is
  bundled for the browser. Platform/API imports must be `import type` or via api-client.
- NEVER hand-roll fetch for API calls — every call goes through data.ts (createAdminData →
  api-client + unwrap). Direct-to-cloud uploads (tus to Stream, presigned PUT to R2) are NOT
  API calls and bypass Hono by design.
- ALWAYS inject side-effectful transports: Uploader (tus) and PutFile (R2 PUT) come from
  context with scripted fakes in tests — NEVER real uploads in CI.
- 100% interaction-state coverage — every screen ships loading (sand/linen skeletons, pinned
  aspect ratios), empty (warm copy + primary "create your first X" action), error
  (what/why/how-to-fix + retry), success/pending on every mutation. An unexplained spinner
  is a support call.
- Design tokens come from styles/global.css (bg-cream/sand/linen, text-ink/body/muted,
  gold) — text on gold is ALWAYS ink (`text-ink`), white-on-gold is banned. Desktop-first
  (≥1024px). Non-essential animation wrapped in motion-safe:.
- The publish gate UI EXPLAINS, the API ENFORCES — mirror the invariant (videoStatus='ready'
  AND captionsReady AND decisionPrompt) as inline reasons; never duplicate enforcement.
- Cover picker renders the 4 candidates ALONGSIDE sibling covers (collection cohesion is
  judged in context — hard requirement, ADR 18). R2 keys render via /admin/media/<key>.
- Types flow from AppRoutes through api-client's unwrap — re-export inferred aliases from
  data.ts (AdminCourse, AdminLesson, …); never define response types manually.

## Imports (use from other modules)
```ts
// This is a bundle entry — nothing imports from here. Internally:
import { DataContext, createAdminData, useData } from './data'
import { UploaderContext, createTusUploader } from './uploader'
import { navigate, useRoute, routePath } from './router'
```

## Recipe: New screen
```tsx
export function ThingsScreen() {
  const data = useData()
  const { state, reload, setData } = useLoad(() => data.listThings(), [])
  if (state.status === 'loading') return <ListSkeleton />
  if (state.status === 'error') return <ErrorState message={state.message} onRetry={reload} />
  if (state.data.things.length === 0) return <EmptyState title="No things yet" action ... />
  return <section>…rows + mutations with pending/error/success…</section>
}
```
Then add the route to router.ts, the switch arm in app.tsx, and a sidebar link.

## Verify
```sh
source /tmp/test-env.sh && bun test client/admin && bunx tsc --noEmit && bun run build:client
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| app.tsx | AdminApp |
| cohorts.tsx | splitCohorts, CohortsScreen |
| courses.tsx | slugify, lessonChipStatus, CoursesScreen, CourseDetailScreen, ModuleDetailScreen |
| covers.tsx | CoverSibling, CoverSection |
| data.ts | createAdminData, AdminData, AdminCourse, AdminCourseDetail, AdminModule, AdminLesson, AdminProgram, AdminProgramDetail, AdminCohort, AdminCohortSuggestion, AdminLive, AdminMaterial, DataContext, useData |
| index.tsx | — |
| lesson-editor.tsx | publishBlockers, LessonEditorScreen |
| lives.tsx | LiveState, deriveLiveState, LivesScreen |
| materials.tsx | MaterialsScreen |
| programs.tsx | ProgramsScreen, ProgramDetailScreen |
| router.ts | Route, parseRoute, routePath, navigate, useRoute |
| test-fixtures.ts | setBrowserPath, makeData, makeCourse, makeModule, makeLesson, makeProgram, makeCohort, makeSuggestion, makeLive, makeMaterial |
| ui.tsx | buttonPrimary, buttonSecondary, buttonGhost, buttonDanger, inputClass, ErrorDescription, describeError, ListSkeleton, EmptyState, ErrorState, InlineError, InlineSuccess, Chip, ChipStatus, StatusChip, ConfirmDialog, mediaUrl, RouteLink, formatInstant, formatBytes, LoadState, useLoad, AutosaveText, useAction |
| uploader.ts | UploadHandlers, UploadHandle, Uploader, createTusUploader, UploaderContext, useUploader, PutFile, putFileWithProgress, PutFileContext, usePutFile |
| video-upload.tsx | UploadStatus, VideoUpload |

## Internal Dependencies
- features/(admin)
- features/(shared)

<!-- Generated: 2026-06-13T00:43:48.444Z -->
