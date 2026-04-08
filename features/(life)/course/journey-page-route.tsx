import { Hono } from 'hono'
import { auth } from '@/platform/auth/config'
import { renderPage } from '@/platform/server/render'
import type { AppEnv } from '@/platform/types'
import { getAllModules } from '@/providers/content'
import { getUserDecisions } from './decisions'
import { JourneyPage } from './journey'
import { getOverallProgress, getUserProgress } from './progress'

export const journeyPageRoute = new Hono<AppEnv>()

journeyPageRoute.get('/', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.redirect('/login')
  const user = session.user

  const decisions = await getUserDecisions(user.id, 'life-decisions')
  const overall = await getOverallProgress(user.id)

  const modules = getAllModules()
  const userProgress = await getUserProgress(user.id)
  const completedIds = new Set(userProgress.map((p) => p.classId))
  let currentClassId: string | null = null
  for (const mod of modules) {
    for (const cls of mod.classes) {
      if (!completedIds.has(cls.id)) {
        currentClassId = cls.id
        break
      }
    }
    if (currentClassId) break
  }

  return c.html(
    renderPage(
      <JourneyPage
        decisions={decisions.map((d) => ({
          classId: d.classId,
          prompt: d.prompt,
          response: d.response,
          createdAt: d.createdAt.toISOString(),
        }))}
        totalClasses={overall.totalClasses}
        courseComplete={overall.percent === 100}
        currentClassId={currentClassId}
      />,
      { title: 'Your Journey — The Right Decision' },
    ),
  )
})
