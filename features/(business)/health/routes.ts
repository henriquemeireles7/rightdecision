import { Hono } from 'hono'
import { requireAuth } from '@/platform/auth/middleware'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { checkHealth } from './service'

export const healthRoutes = new Hono<AppEnv>().use(requireAuth).get('/', async (c) => {
  const result = await checkHealth()
  return success(c, result)
})
