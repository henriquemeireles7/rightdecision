import type { Hono } from 'hono'
import { courseRoutes } from '@/features/course-player/routes'
import { progressRoutes } from '@/features/course-progress/routes'
import { checkoutRoutes } from '@/features/subscription/create-checkout'
import { webhookRoutes } from '@/features/subscription/handle-webhook'
import { authRoutes } from '@/platform/auth/routes'

export function mountRoutes(app: Hono) {
  return app
    .route('/api/auth', authRoutes)
    .route('/api/checkout', checkoutRoutes)
    .route('/api/webhook', webhookRoutes)
    .route('/api/courses', courseRoutes)
    .route('/api/progress', progressRoutes)
}
