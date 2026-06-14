import { Hono } from 'hono'
import { requireAuth } from '@/platform/auth/middleware'
import { requirePermission } from '@/platform/auth/permissions'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { listPlatformAccounts, syncPlatformAccounts } from './service'

export const accountSyncRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(requirePermission('manage_content'))
  .get('/', async (c) => {
    const accounts = await listPlatformAccounts()
    return success(c, { accounts })
  })
  .post('/sync', async (c) => {
    const result = await syncPlatformAccounts()
    return success(c, result)
  })
