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
| analytics-routes.ts | analyticsReadingRoutes |
| bookmark-routes.ts | bookmarkRoutes |
| bookmarks.ts | toggleBookmark, getUserBookmarks, isBookmarked |
| bottom-nav.tsx | BottomNav |
| class-view.tsx | ClassView |
| dashboard.tsx | CourseDashboard |
| decision-routes.ts | decisionRoutes |
| decisions.ts | isDecisionEditable, saveDecision, getDecision, getUserDecisionContext, getUserDecisions |
| journey-page-route.tsx | journeyPageRoute |
| journey-routes.ts | journeyRoutes |
| journey.tsx | JourneyPage |
| listing.tsx | CourseListing |
| menu-overlay.tsx | MenuOverlay |
| micro-decision.tsx | MicroDecision |
| module-landing.tsx | ModuleLandingPage |
| navigation.tsx | getNavItems, Navigation |
| page-routes.tsx | coursePageRoutes |
| progress-routes.ts | progressApiRoutes |
| progress.ts | markClassComplete, getUserProgress, getModuleProgress, getOverallProgress, getCurrentClass |
| reading-analytics-client.ts | getReadingAnalyticsScript |
| reading-analytics.ts | logReading, getReadingStats |
| search-routes.ts | searchRoutes |
| session-memory.ts | getSessionMemoryScript, getSessionResumeScript |
| share-routes.ts | shareRoutes |
| share.ts | generateDecisionCard |
| time-nudge.tsx | TimeNudge, DEFAULT_NUDGES |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/rate-limit
- platform/server
- platform/types
- providers/ai
- providers/analytics
- providers/content
- providers/markdown

<!-- Generated: 2026-04-09T09:30:25.855Z -->
