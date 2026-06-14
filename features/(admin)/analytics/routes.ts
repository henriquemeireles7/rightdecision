import { Hono } from 'hono'
import { requireAuth } from '@/platform/auth/middleware'
import { requirePermission } from '@/platform/auth/permissions'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { getOnboardingAnalytics } from './onboarding-analytics'

// Migrated from features/(shared)/admin/ (Platform V2 P2 deliverable 1).
// Chained so AppRoutes inference flows; the /analytics/onboarding path is kept so the
// parent mount at /api/admin preserves the existing public URL.
export const adminAnalyticsRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(requirePermission('view_analytics'))
  .get('/analytics/onboarding', async (c) => {
    const data = await getOnboardingAnalytics()
    return success(c, data)
  })
