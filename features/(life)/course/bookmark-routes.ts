import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { getUserBookmarks, toggleBookmark } from './bookmarks'

const bookmarkSchema = z.object({
  classId: z.string().min(1),
})

export const bookmarkRoutes = new Hono<AppEnv>()

// Toggle bookmark
bookmarkRoutes.post('/toggle', requireAuth, zValidator('json', bookmarkSchema), async (c) => {
  const user = c.get('user')
  const { classId } = c.req.valid('json')
  const result = await toggleBookmark(user.id, classId)
  return success(c, result)
})

// List user's bookmarks
bookmarkRoutes.get('/', requireAuth, async (c) => {
  const user = c.get('user')
  const bmarks = await getUserBookmarks(user.id)
  return success(c, {
    bookmarks: bmarks.map((b) => ({ classId: b.classId, createdAt: b.createdAt })),
  })
})
