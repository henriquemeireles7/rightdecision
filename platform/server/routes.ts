import type { Hono } from 'hono'
import { adminAnalyticsRoutes } from '@/features/(admin)/analytics/routes'
import { adminCohortsRoutes } from '@/features/(admin)/cohorts/routes'
import { adminCourseBuilderRoutes } from '@/features/(admin)/course-builder/routes'
import { streamWebhookRoutes } from '@/features/(admin)/course-builder/webhook-routes'
import { adminDistributionRoutes } from '@/features/(admin)/distribution/routes'
import { adminLivesRoutes } from '@/features/(admin)/lives/routes'
import { adminMaterialsRoutes } from '@/features/(admin)/materials/routes'
import { adminProgramsRoutes } from '@/features/(admin)/programs/routes'
import { adminShellRoutes } from '@/features/(admin)/shell/routes'
import { adminTemplatesRoutes } from '@/features/(admin)/templates/routes'
import { accountSyncRoutes } from '@/features/(business)/account-sync/routes'
import { analyticsRoutes } from '@/features/(business)/analytics-collect/routes'
import { clipCutRoutes } from '@/features/(business)/clip-cut/routes'
import { clipSelectRoutes } from '@/features/(business)/clip-select/routes'
import { healthRoutes } from '@/features/(business)/health/routes'
import { insightRoutes } from '@/features/(business)/insight-generate/routes'
import { metadataRoutes } from '@/features/(business)/metadata-generate/routes'
import { postDistributeRoutes } from '@/features/(business)/post-distribute/routes'
import { transcribeRoutes } from '@/features/(business)/transcribe/routes'
import { aiChatRoutes } from '@/features/(life)/ai-chat/routes'
import { appShellRoutes } from '@/features/(life)/app-shell/routes'
import { authPageRoutes } from '@/features/(life)/auth/routes'
import { catalogRoutes } from '@/features/(life)/catalog/routes'
import { analyticsReadingRoutes } from '@/features/(life)/course/analytics-routes'
import { bookmarkRoutes } from '@/features/(life)/course/bookmark-routes'
import { decisionRoutes } from '@/features/(life)/course/decision-routes'
import { journeyPageRoute } from '@/features/(life)/course/journey-page-route'
import { journeyRoutes } from '@/features/(life)/course/journey-routes'
import { coursePageRoutes } from '@/features/(life)/course/page-routes'
import { progressApiRoutes } from '@/features/(life)/course/progress-routes'
import { searchRoutes } from '@/features/(life)/course/search-routes'
import { shareRoutes } from '@/features/(life)/course/share-routes'
import { courseRoutes } from '@/features/(life)/course-player/routes'
import { progressRoutes } from '@/features/(life)/course-progress/routes'
import { interviewRoutes } from '@/features/(life)/interview/routes'
import { joinRoutes } from '@/features/(life)/join/routes'
import { journalRoutes } from '@/features/(life)/journal/routes'
import { livesViewRoutes } from '@/features/(life)/lives-view/routes'
import { materialsViewRoutes } from '@/features/(life)/materials-view/routes'
import { onboardingRoutes } from '@/features/(life)/onboarding/routes'
import { playbookRoutes } from '@/features/(life)/playbook/routes'
import { playerRoutes } from '@/features/(life)/player/routes'
import { watchEventsRoutes } from '@/features/(life)/watch-events/routes'
import { winsRoutes } from '@/features/(life)/wins/routes'
import { accountRoutes } from '@/features/(shared)/account/routes'
import { freeIntroRoutes } from '@/features/(shared)/free-intro/routes'
import { completeCheckoutRoutes } from '@/features/(shared)/subscription/complete-checkout'
import { checkoutRoutes } from '@/features/(shared)/subscription/create-checkout'
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
      .route('/api/free-intro', freeIntroRoutes)
      .route('/api/account', accountRoutes)
      .route('/api/search', searchRoutes)
      .route('/api/admin', adminAnalyticsRoutes)
      // ─── V2 Members Area APIs ───
      .route('/api/catalog', catalogRoutes)
      .route('/api/player', playerRoutes)
      .route('/api/watch-events', watchEventsRoutes)
      .route('/api/lives', livesViewRoutes)
      .route('/api/materials', materialsViewRoutes)
      .route('/api/join', joinRoutes)
      .route('/api/playbook', playbookRoutes)
      .route('/api/journal', journalRoutes)
      .route('/api/chat', aiChatRoutes)
      .route('/api/interview', interviewRoutes)
      // ─── V2 Admin APIs ───
      .route('/api/admin/course-builder', adminCourseBuilderRoutes)
      .route('/api/admin/materials', adminMaterialsRoutes)
      .route('/api/admin/lives', adminLivesRoutes)
      .route('/api/admin/cohorts', adminCohortsRoutes)
      .route('/api/admin/programs', adminProgramsRoutes)
      .route('/api/admin/templates', adminTemplatesRoutes)
      .route('/api/admin/distribution', adminDistributionRoutes)
      .route('/api/webhook/stream', streamWebhookRoutes)
      // ─── BD Pipeline ───
      .route('/api/pipeline/health', healthRoutes)
      .route('/api/platform-accounts', accountSyncRoutes)
      .route('/api/pipeline-runs', transcribeRoutes)
      .route('/api/clip-select', clipSelectRoutes)
      .route('/api/clip-cut', clipCutRoutes)
      .route('/api/metadata-generate', metadataRoutes)
      .route('/api/post-distribute', postDistributeRoutes)
      .route('/api/analytics-collect', analyticsRoutes)
      .route('/api/insights', insightRoutes)
      // ─── Course SSR Pages ───
      .route('/courses', coursePageRoutes)
      .route('/journey', journeyPageRoute)
      // V2 Members SPA shell — MUST stay BEFORE the '/' catch-alls below,
      // or /app deep links 404 into marketing (P3 mount-order rule)
      .route('/app', appShellRoutes)
      // V2 Admin SPA shell (P2) — same mount-order rule as /app
      .route('/admin', adminShellRoutes)
      // Auth pages — BEFORE website catch-all
      .route('/', authPageRoutes)
      // Website — AFTER all /api/* routes (homepage, LP at /life, blog, concepts, legal)
      .route('/', websiteRoutes)
  )
}
