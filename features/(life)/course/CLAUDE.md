# course

## Purpose
Course experience: editorial reading room, micro-decisions, journey timeline, reading analytics,
share cards, bookmarks, progress tracking, and access gating (free/paid).

## Critical Rules
- Module 0 (onboarding) and Module 1 are FREE — no subscription required
- Modules 2-9 require active subscription (check subscriptions table, not role)
- NEVER gate on user role — gate on subscription status
- Access check is at the class level, not module level
- ALWAYS use renderCourseMarkdown() for course content (NOT renderMarkdown)
- Micro-decisions have a 5-minute edit window — after that, locked forever
- Reading analytics is fire-and-forget — NEVER let analytics failure break reading
- Content is trusted local .mdx files — no DOMPurify needed server-side
- Share card text MUST be sanitized (stripHtml) before rendering with satori

## Imports (use from other modules)
```ts
import { renderCourseMarkdown } from '@/providers/markdown'
import { getClass, getModule, getAllModules, getCourse } from '@/providers/content'
import type { CourseClass, CourseModule, Course } from '@/providers/content'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| access.ts | AccessTier, canAccessClass, getModuleFromClassId, getUserAccessTier |
| bookmark-routes.ts | bookmarkRoutes |
| bookmarks.ts | toggleBookmark, getUserBookmarks, isBookmarked |
| class-view.tsx | ClassView |
| dashboard.tsx | CourseDashboard |
| navigation.tsx | getNavItems, Navigation |
| progress-routes.ts | progressApiRoutes |
| progress.ts | markClassComplete, getUserProgress, getModuleProgress, getOverallProgress, getCurrentClass |
| search-routes.ts | searchRoutes |
| time-nudge.tsx | TimeNudge, DEFAULT_NUDGES |

## Internal Dependencies
- platform/auth
- platform/db
- platform/server
- platform/types
- providers/content

<!-- Generated: 2026-04-08T05:22:13.829Z -->
