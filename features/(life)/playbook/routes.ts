import { zValidator } from '@hono/zod-validator'
import type { Context, MiddlewareHandler } from 'hono'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireEnrollment } from '@/platform/auth/enrollment'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { renderExportHtml } from './export'
import { getExportData, getPage, getPlaybook, programIdForTemplate, saveAnswer } from './service'

const templateParam = z.object({ templateId: z.uuid() })
const pageParam = z.object({ templateId: z.uuid(), pageId: z.string().min(1) })
const answerBody = z.object({ fieldId: z.string().min(1), value: z.string().min(1) })

/** Resolver for requireEnrollment: the program owning the template. */
const templateProgram = (c: Context<AppEnv>) => {
  const templateId = c.req.param('templateId')
  return templateId ? programIdForTemplate(templateId) : null
}

type RouteDeps = {
  /** Options injection for TESTS ONLY (auth stub) — production callers never pass it. */
  auth?: MiddlewareHandler<AppEnv>
}

export function createPlaybookRoutes(deps: RouteDeps = {}) {
  const auth = deps.auth ?? requireAuth

  return (
    new Hono<AppEnv>()
      .get('/', auth, async (c) => {
        const user = c.get('user')
        return success(c, await getPlaybook(user.id))
      })
      .get(
        '/:templateId/pages/:pageId',
        auth,
        zValidator('param', pageParam),
        requireEnrollment(templateProgram),
        async (c) => {
          const { templateId, pageId } = c.req.valid('param')
          const result = await getPage(c.get('user').id, templateId, pageId)
          if ('error' in result && result.error) {
            return throwError(c, result.error, 'details' in result ? result.details : undefined)
          }
          return success(c, result)
        },
      )
      .put(
        '/:templateId/answers',
        auth,
        zValidator('param', templateParam),
        zValidator('json', answerBody),
        requireEnrollment(templateProgram),
        async (c) => {
          const { fieldId, value } = c.req.valid('json')
          const result = await saveAnswer(
            c.get('user').id,
            c.req.valid('param').templateId,
            fieldId,
            value,
          )
          if ('error' in result) return throwError(c, result.error, result.details)
          return success(c, result)
        },
      )
      // The v1 "PDF export": print-ready HTML (browser print-to-PDF) — see CLAUDE.md.
      .get(
        '/:templateId/export',
        auth,
        zValidator('param', templateParam),
        requireEnrollment(templateProgram),
        async (c) => {
          const user = c.get('user')
          const result = await getExportData(user.id, c.req.valid('param').templateId)
          if ('error' in result && result.error) return throwError(c, result.error)
          const { title, schema, answersByFieldId } = result
          return c.html(renderExportHtml({ title, schema, answersByFieldId, userName: user.name }))
        },
      )
  )
}

/** Mounted by the parent router (platform/server/routes.ts) under /api/playbook. */
export const playbookRoutes = createPlaybookRoutes()
