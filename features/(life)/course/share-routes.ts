import { Hono } from 'hono'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import type { AppEnv } from '@/platform/types'
import { getDecision } from './decisions'
import { generateDecisionCard } from './share'

const classIdRegex = /^module-\d+\/class-\d+$/

export const shareRoutes = new Hono<AppEnv>()

shareRoutes.get('/decision/:classId{.+}', requireAuth, async (c) => {
  const user = c.get('user')
  const classId = c.req.param('classId')
  if (!classIdRegex.test(classId)) return throwError(c, 'SHARE_NOT_FOUND')

  const decision = await getDecision(user.id, classId)
  if (!decision) {
    return throwError(c, 'SHARE_NOT_FOUND')
  }

  try {
    const image = await generateDecisionCard(decision.response)
    const isSvg = image[0] === 0x3c // '<' char = SVG fallback

    return new Response(new Uint8Array(image), {
      headers: {
        'Content-Type': isSvg ? 'image/svg+xml' : 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return throwError(c, 'SHARE_GENERATION_FAILED')
  }
})
