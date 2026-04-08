import { Hono } from 'hono'
import { requireAuth } from '@/platform/auth/middleware'
import type { ErrorCode } from '@/platform/errors'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { listPlatformAccounts, syncPlatformAccounts } from './service'

export const accountSyncRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', async (c) => {
    const accounts = await listPlatformAccounts()
    return success(c, { accounts })
  })
  .post('/sync', async (c) => {
    try {
      const result = await syncPlatformAccounts()
      return success(c, result)
    } catch {
      return throwError(c, 'INTERNAL_SERVER_ERROR' as ErrorCode)
    }
  })
