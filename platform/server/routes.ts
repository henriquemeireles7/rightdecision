import type { Hono } from 'hono'
import { accountRoutes } from '@/features/account/routes'
import { bookmarkRoutes } from '@/features/course/bookmark-routes'
import { courseRoutes } from '@/features/course-player/routes'
import { progressApiRoutes } from '@/features/course/progress-routes'
import { progressRoutes } from '@/features/course-progress/routes'
import { onboardingRoutes } from '@/features/onboarding/routes'
import { checkoutRoutes } from '@/features/subscription/create-checkout'
import { winsRoutes } from '@/features/wins/routes'
import { webhookRoutes } from '@/features/subscription/handle-webhook'
import { authRoutes } from '@/platform/auth/routes'

export function mountRoutes(app: Hono) {
  return app
    .route('/api/auth', authRoutes)
    .route('/api/onboarding', onboardingRoutes)
    .route('/api/checkout', checkoutRoutes)
    .route('/api/webhook', webhookRoutes)
    .route('/api/courses', courseRoutes)
    .route('/api/progress', progressRoutes)
    .route('/api/progress/v2', progressApiRoutes)
    .route('/api/wins', winsRoutes)
    .route('/api/bookmarks', bookmarkRoutes)
    .route('/api/account', accountRoutes)
}
