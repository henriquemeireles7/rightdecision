import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { createWin, getMyWins, getPublicFeed } from './service'

const createWinSchema = z.object({
  lifeArea: z.enum(['health', 'relationships', 'career', 'money']),
  description: z.string().min(1).max(280),
})

const feedQuerySchema = z.object({
  lifeArea: z.enum(['health', 'relationships', 'career', 'money']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

export const winsRoutes = new Hono<AppEnv>()

// Public feed — no auth required
winsRoutes.get('/feed', zValidator('query', feedQuerySchema), async (c) => {
  const { lifeArea, limit, offset } = c.req.valid('query')
  const feed = await getPublicFeed(lifeArea, limit, offset)
  return success(c, { wins: feed })
})

// Create a win — auth required
winsRoutes.post('/', requireAuth, zValidator('json', createWinSchema), async (c) => {
  const user = c.get('user')
  const { lifeArea, description } = c.req.valid('json')

  const result = await createWin(user.id, lifeArea, description)

  if ('error' in result && result.error) {
    return throwError(c, result.error)
  }

  return success(c, { win: result.win })
})

// My wins — auth required
winsRoutes.get('/mine', requireAuth, async (c) => {
  const user = c.get('user')
  const myWins = await getMyWins(user.id)
  return success(c, { wins: myWins })
})
