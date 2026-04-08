import type { Hono } from 'hono'
import { analyticsRoutes } from '@/features/(business)/analytics-collect/routes'
import { clipCutRoutes } from '@/features/(business)/clip-cut/routes'
import { clipSelectRoutes } from '@/features/(business)/clip-select/routes'
import { insightRoutes } from '@/features/(business)/insight-generate/routes'
import { metadataRoutes } from '@/features/(business)/metadata-generate/routes'
import { postDistributeRoutes } from '@/features/(business)/post-distribute/routes'
import { transcribeRoutes } from '@/features/(business)/transcribe/routes'
import { bookmarkRoutes } from '@/features/(life)/course/bookmark-routes'
import { coursePageRoutes } from '@/features/(life)/course/page-routes'
import { analyticsReadingRoutes } from '@/features/(life)/course/analytics-routes'
import { decisionRoutes } from '@/features/(life)/course/decision-routes'
import { journeyRoutes } from '@/features/(life)/course/journey-routes'
import { shareRoutes } from '@/features/(life)/course/share-routes'
import { progressApiRoutes } from '@/features/(life)/course/progress-routes'
import { searchRoutes } from '@/features/(life)/course/search-routes'
import { courseRoutes } from '@/features/(life)/course-player/routes'
import { progressRoutes } from '@/features/(life)/course-progress/routes'
import { onboardingRoutes } from '@/features/(life)/onboarding/routes'
import { winsRoutes } from '@/features/(life)/wins/routes'
import { authPageRoutes } from '@/features/(life)/auth/routes'
import { accountRoutes } from '@/features/(shared)/account/routes'
import { adminRoutes } from '@/features/(shared)/admin/routes'
import { checkoutRoutes } from '@/features/(shared)/subscription/create-checkout'
import { completeCheckoutRoutes } from '@/features/(shared)/subscription/complete-checkout'
import { portalRoutes } from '@/features/(shared)/subscription/customer-portal'
import { webhookRoutes } from '@/features/(shared)/subscription/handle-webhook'
import { websiteRoutes } from '@/features/(shared)/website/routes.tsx'
import { authRoutes } from '@/platform/auth/routes'

export function mountRoutes(app: Hono) {
  return (
    app
      .route('/api/auth', authRoutes)
      .route('/api/onboarding', onboardingRoutes)
      .route('/api/checkout', checkoutRoutes)
      .route('/api/checkout/flow', completeCheckoutRoutes)
      .route('/api/webhook', webhookRoutes)
      .route('/api/subscription/portal', portalRoutes)
      .route('/api/courses', courseRoutes)
      .route('/api/progress', progressRoutes)
      .route('/api/progress/v2', progressApiRoutes)
      .route('/api/wins', winsRoutes)
      .route('/api/bookmarks', bookmarkRoutes)
      .route('/api/decisions', decisionRoutes)
      .route('/api/analytics/reading', analyticsReadingRoutes)
      .route('/api/journey', journeyRoutes)
      .route('/api/share', shareRoutes)
      .route('/api/account', accountRoutes)
      .route('/api/search', searchRoutes)
      .route('/api/admin', adminRoutes)
      // ─── BD Pipeline ───
      .route('/api/pipeline-runs', transcribeRoutes)
      .route('/api/clip-select', clipSelectRoutes)
      .route('/api/clip-cut', clipCutRoutes)
      .route('/api/metadata-generate', metadataRoutes)
      .route('/api/post-distribute', postDistributeRoutes)
      .route('/api/analytics-collect', analyticsRoutes)
      .route('/api/insights', insightRoutes)
      // ─── Course SSR Pages ───
      .route('/courses', coursePageRoutes)
      .route('/', coursePageRoutes) // /journey route
      // Auth pages — BEFORE website catch-all
      .route('/', authPageRoutes)
      // Website — AFTER all /api/* routes (homepage, LP at /life, blog, concepts, legal)
      .route('/', websiteRoutes)
  )
}
