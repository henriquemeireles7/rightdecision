import { zValidator } from '@hono/zod-validator'
import type { MiddlewareHandler } from 'hono'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { chat } from '@/providers/ai'
import { enforceAiBudget } from './budget'
import type { ChatProvider } from './service'
import { getConversation, listConversations, runChatTurn } from './service'

const sendBody = z.object({
  conversationId: z.uuid().optional(),
  message: z.string().min(1).max(4000),
})

const conversationParam = z.object({ conversationId: z.uuid() })

type RouteDeps = {
  /** TESTS ONLY: auth stub + budget bypass + fixture chat provider. */
  auth?: MiddlewareHandler<AppEnv>
  budget?: MiddlewareHandler<AppEnv>
  provider?: ChatProvider
}

export function createAiChatRoutes(deps: RouteDeps = {}) {
  const auth = deps.auth ?? requireAuth
  const budget = deps.budget ?? enforceAiBudget()
  const provider = deps.provider ?? chat

  return (
    new Hono<AppEnv>()
      // List the user's chat conversations (resume surface).
      .get('/', auth, async (c) => {
        const user = c.get('user')
        return success(c, await listConversations(user.id))
      })
      // One conversation + its full message history — the refetch-on-drop read path.
      .get('/:conversationId', auth, zValidator('param', conversationParam), async (c) => {
        const user = c.get('user')
        const result = await getConversation(user.id, c.req.valid('param').conversationId)
        if ('error' in result && result.error)
          return throwError(
            c,
            result.error,
            'details' in result ? (result.details as string | undefined) : undefined,
          )
        return success(c, result)
      })
      // Send a message — thin streamSSE piping (DX Convention 4). The pure runChatTurn
      // owns assembly + persist-on-completion; a 404 for a foreign conversation is sent as
      // an SSE error event (the stream is already open by the time we resolve ownership).
      .post('/', auth, budget, zValidator('json', sendBody), (c) => {
        const user = c.get('user')
        const { conversationId, message } = c.req.valid('json')
        return streamSSE(c, async (stream) => {
          const result = await runChatTurn({
            userId: user.id,
            conversationId,
            userMessage: message,
            provider,
            onChunk: (text) => stream.writeSSE({ event: 'token', data: text }),
          })
          if ('error' in result) {
            await stream.writeSSE({ event: 'error', data: result.error })
            return
          }
          await stream.writeSSE({
            event: 'done',
            data: JSON.stringify({
              conversationId: result.conversationId,
              crisis: result.crisis,
              dropped: result.dropped,
            }),
          })
        })
      })
  )
}

/** Mounted by the parent router (platform/server/routes.ts) under /api/chat. */
export const aiChatRoutes = createAiChatRoutes()
