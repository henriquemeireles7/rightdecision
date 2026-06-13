import { Hono } from 'hono'
import { requireAuth } from '@/platform/auth/middleware'
import { requirePermission } from '@/platform/auth/permissions'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { checkHealth } from './service'

export const healthRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(requirePermission('manage_content'))
  .get('/', async (c) => {
    const result = await checkHealth()
    return success(c, result)
  })
