# course

## Purpose
Course access logic: free/paid gating, content delivery, progress tracking integration.

## Critical Rules
- Module 0 (onboarding) and Module 1 are FREE — no subscription required
- Modules 2-9 require active subscription (check subscriptions table, not role)
- NEVER gate on user role — gate on subscription status
- Access check is at the class level, not module level

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
