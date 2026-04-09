import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { checkRateLimit } from '@/platform/rate-limit'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { generateSuggestions } from '@/providers/ai'
import { track } from '@/providers/analytics'
import { getClass } from '@/providers/content'
import { renderCourseMarkdown } from '@/providers/markdown'
import {
  getDecision,
  getUserDecisionContext,
  getUserDecisions,
  isDecisionEditable,
  saveDecision,
} from './decisions'

export const decisionRoutes = new Hono<AppEnv>()

const saveSchema = z.object({
  classId: z.string().min(1),
  courseSlug: z.string().min(1),
  decisionType: z.enum(['text', 'choice']),
  prompt: z.string().min(1),
  response: z.string().min(1).max(2000),
})

decisionRoutes.post('/save', requireAuth, zValidator('json', saveSchema), async (c) => {
  const user = c.get('user')
  const { classId, courseSlug, decisionType, prompt, response } = c.req.valid('json')

  const result = await saveDecision(user.id, classId, courseSlug, decisionType, prompt, response)

  if (result.locked) {
    return throwError(c, 'DECISION_LOCKED')
  }

  return success(c, {
    decision: result.decision,
    editable: isDecisionEditable(result.decision.createdAt),
  })
})

const classIdRegex = /^module-\d+\/class-\d+$/

decisionRoutes.get('/:classId{.+}', requireAuth, async (c) => {
  const user = c.get('user')
  const classId = c.req.param('classId')
  if (!classIdRegex.test(classId)) return throwError(c, 'DECISION_VALIDATION_ERROR')

  const decision = await getDecision(user.id, classId)
  if (!decision) {
    return throwError(c, 'DECISION_NOT_FOUND')
  }

  return success(c, {
    decision,
    editable: isDecisionEditable(decision.createdAt),
  })
})

const listSchema = z.object({
  courseSlug: z.string().optional(),
})

decisionRoutes.get('/', requireAuth, zValidator('query', listSchema), async (c) => {
  const user = c.get('user')
  const { courseSlug } = c.req.valid('query')

  const decisions = await getUserDecisions(user.id, courseSlug)
  return success(c, { decisions })
})

// ─── Decision Block API (Doc 13: free funnel + paid course) ───

const suggestionsSchema = z.object({
  question: z.string().min(1),
  classId: z.string().min(1),
  blockId: z.string().min(1),
})

/** Get AI-generated suggestions for a decision block. */
decisionRoutes.post(
  '/suggestions',
  requireAuth,
  zValidator('json', suggestionsSchema),
  async (c) => {
    // Rate limit: 10 suggestions per IP per minute (Claude API cost protection)
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rateCheck = checkRateLimit(`ai-suggestions:${ip}`, 10, 60 * 1000)
    if (!rateCheck.allowed) {
      // Return generic suggestions instead of error (graceful degradation)
      return success(c, {
        suggestions: [
          'Something I have been avoiding for a while',
          'A change I know I need to make',
          'The thing I keep thinking about but never act on',
        ],
      })
    }

    const user = c.get('user')
    const { question } = c.req.valid('json')

    const previousContext = await getUserDecisionContext(user.id)
    const suggestions = await generateSuggestions(question, previousContext)

    return success(c, { suggestions })
  },
)

const blockSaveSchema = z.object({
  classId: z.string().min(1),
  blockId: z.string().min(1),
  courseSlug: z.string().min(1),
  question: z.string().min(1),
  response: z.string().min(1).max(2000),
  isCustom: z.boolean(),
  suggestionIndex: z.number().optional(),
})

/** Save a decision block answer + unlock next segment. */
decisionRoutes.post('/block/save', requireAuth, zValidator('json', blockSaveSchema), async (c) => {
  const user = c.get('user')
  const { classId, blockId, courseSlug, question, response, isCustom, suggestionIndex } =
    c.req.valid('json')

  const previousContext = await getUserDecisionContext(user.id)

  const result = await saveDecision(
    user.id,
    classId,
    courseSlug,
    isCustom ? 'text' : 'choice',
    question,
    response,
    blockId,
    isCustom,
    previousContext,
  )

  if (result.locked) {
    return throwError(c, 'DECISION_LOCKED')
  }

  // Track analytics (no PII — only event name, indices, timing)
  track('decision_block_answered', {
    classId,
    blockId,
    isCustom,
    suggestionIndex: suggestionIndex ?? null,
  })

  return success(c, { saved: true })
})

const segmentSchema = z.object({
  classId: z.string().min(1),
  blockId: z.string().min(1),
})

/** Fetch the next content segment after answering a decision block. */
decisionRoutes.post('/segment', requireAuth, zValidator('json', segmentSchema), async (c) => {
  const user = c.get('user')
  const { classId, blockId } = c.req.valid('json')

  // Verify the user actually answered this block
  const decision = await getDecision(user.id, classId, blockId)
  if (!decision) {
    return throwError(c, 'UNAUTHORIZED')
  }

  // Find the class and the segment after this block
  const courseClass = getClass(classId)
  if (!courseClass) {
    return throwError(c, 'NOT_FOUND')
  }

  // Find the segment index after the matching decision block
  const blockIndex = courseClass.segments.findIndex(
    (s) => s.type === 'decision-block' && s.block?.blockId === blockId,
  )

  if (blockIndex === -1 || blockIndex + 1 >= courseClass.segments.length) {
    return success(c, { content: null, hasMore: false })
  }

  // Collect all segments until the next decision block (or end)
  const nextSegments: string[] = []
  for (let i = blockIndex + 1; i < courseClass.segments.length; i++) {
    const seg = courseClass.segments[i]!
    if (seg.type === 'decision-block') break
    if (seg.content) nextSegments.push(seg.content)
  }

  const hasMoreBlocks = courseClass.segments.some(
    (s, i) => i > blockIndex + 1 && s.type === 'decision-block',
  )

  const renderedContent =
    nextSegments.length > 0 ? renderCourseMarkdown(nextSegments.join('\n\n')) : null

  return success(c, { content: renderedContent, hasMore: hasMoreBlocks })
})
