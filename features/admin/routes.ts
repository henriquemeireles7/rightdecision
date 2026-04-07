import { Hono } from 'hono'
import { requireAuth } from '@/platform/auth/middleware'
import { requirePermission } from '@/platform/auth/permissions'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { getOnboardingAnalytics } from './onboarding-analytics'

export const adminRoutes = new Hono<AppEnv>()

// All admin routes require admin role
adminRoutes.use('*', requireAuth)
adminRoutes.use('*', requirePermission('view_analytics'))

adminRoutes.get('/analytics/onboarding', async (c) => {
  const data = await getOnboardingAnalytics()
  return success(c, data)
})
