import { Hono } from 'hono'
import { auth } from '@/platform/auth/config'
import { renderPage } from '@/platform/server/render'
import type { AppEnv } from '@/platform/types'
import { getClass, getAllCourses, getAllModules, getModule } from '@/providers/content'
import { canAccessClass, getModuleFromClassId, getUserAccessTier } from './access'
import { ClassView } from './class-view'
import { CourseDashboard } from './dashboard'
import { getDecision, isDecisionEditable } from './decisions'
import { JourneyPage } from './journey'
import { CourseListing } from './listing'
import { ModuleLandingPage } from './module-landing'
import { getModuleProgress, getOverallProgress, getUserProgress } from './progress'
import { getUserDecisions } from './decisions'
import { isBookmarked } from './bookmarks'

export const coursePageRoutes = new Hono<AppEnv>()

// Helper: get user from session (optional — returns null if not logged in)
async function getUser(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session) return null
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  }
}

// ─── GET /courses → Course Listing ──────────────────────────────────────────
coursePageRoutes.get('/', async (c) => {
  const courses = getAllCourses()
  const courseProgress = new Map<string, { percent: number; completed: number; total: number }>()

  const user = await getUser(c.req.raw.headers)
  if (user) {
    const progress = await getOverallProgress(user.id)
    courseProgress.set('life-decisions', {
      percent: progress.percent,
      completed: progress.completedClasses,
      total: progress.totalClasses,
    })
  }

  return c.html(
    renderPage(
      <CourseListing courses={courses} courseProgress={courseProgress} />,
      { title: 'Courses — The Right Decision', description: 'Your reading list.' },
    ),
  )
})

// ─── GET /courses/:slug → Course Dashboard ──────────────────────────────────
coursePageRoutes.get('/:slug', async (c) => {
  const user = await getUser(c.req.raw.headers)
  if (!user) return c.redirect('/login')

  const accessTier = await getUserAccessTier(user.id)
  const modules = getAllModules()
  const userProgress = await getUserProgress(user.id)
  const completedIds = new Set(userProgress.map((p) => p.classId))
  const overall = await getOverallProgress(user.id)

  // Compute progress per module from already-fetched data (avoids N+1 query)
  const modulesWithProgress = modules.map((mod) => {
    const total = mod.classes.length
    const completed = mod.classes.filter((cls) => completedIds.has(cls.id)).length
    return {
      ...mod,
      progress: {
        total,
        completed,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    }
  })

  // Find current class
  let currentClassId: string | null = null
  let currentClassName: string | undefined
  for (const mod of modules) {
    for (const cls of mod.classes) {
      if (!completedIds.has(cls.id)) {
        currentClassId = cls.id
        currentClassName = cls.title
        break
      }
    }
    if (currentClassId) break
  }

  return c.html(
    renderPage(
      <CourseDashboard
        accessTier={accessTier}
        modules={modulesWithProgress}
        overallPercent={overall.percent}
        currentClassId={currentClassId}
        currentClassName={currentClassName}
      />,
      { title: 'Your Course — The Right Decision' },
    ),
  )
})

// ─── GET /courses/:slug/module/:num → Module Landing ────────────────────────
coursePageRoutes.get('/:slug/module/:num', async (c) => {
  const user = await getUser(c.req.raw.headers)
  if (!user) return c.redirect('/login')

  const moduleNum = Number.parseInt(c.req.param('num'), 10)
  const mod = getModule(moduleNum)
  if (!mod) return c.notFound()

  const courseSlug = c.req.param('slug')
  const userProgress = await getUserProgress(user.id)
  const completedIds = new Set(userProgress.map((p) => p.classId))

  // Find current class in this module
  let currentClassId: string | null = null
  for (const cls of mod.classes) {
    if (!completedIds.has(cls.id)) {
      currentClassId = cls.id
      break
    }
  }

  return c.html(
    renderPage(
      <ModuleLandingPage
        module={mod}
        courseSlug={courseSlug}
        completedClassIds={completedIds}
        currentClassId={currentClassId}
      />,
      { title: `Module ${mod.id}: ${mod.name} — The Right Decision` },
    ),
  )
})

// ─── GET /courses/:slug/class/:classId+ → Class View (Reading Room) ─────────
coursePageRoutes.get('/:slug/class/:classId{.+}', async (c) => {
  const user = await getUser(c.req.raw.headers)
  if (!user) return c.redirect('/login')

  const classId = c.req.param('classId')
  const cls = getClass(classId)
  if (!cls) return c.notFound()

  const moduleNum = getModuleFromClassId(classId)
  const accessTier = await getUserAccessTier(user.id)
  const isLocked = !canAccessClass(moduleNum, accessTier)

  const mod = getModule(moduleNum)
  const allClasses = mod?.classes ?? []
  const classIndex = allClasses.findIndex((cc) => cc.id === classId)

  const userProgress = await getUserProgress(user.id)
  const completedIds = new Set(userProgress.map((p) => p.classId))
  const isComplete = completedIds.has(classId)

  // Prev/next
  const prevCls = classIndex > 0 ? allClasses[classIndex - 1] : null
  const nextCls = classIndex < allClasses.length - 1 ? allClasses[classIndex + 1] : null

  // Decision
  let existingDecision = null
  if (cls.decisionPrompt) {
    const decision = await getDecision(user.id, classId)
    if (decision) {
      existingDecision = {
        response: decision.response,
        createdAt: decision.createdAt.toISOString(),
        editable: isDecisionEditable(decision.createdAt),
      }
    }
  }

  // Bookmark
  const bookmarked = await isBookmarked(user.id, classId)
  const modules = getAllModules()

  return c.html(
    renderPage(
      <ClassView
        cls={cls}
        isComplete={isComplete}
        isLocked={isLocked}
        isBookmarked={bookmarked}
        prevClass={prevCls ? { id: prevCls.id, title: prevCls.title } : null}
        nextClass={nextCls ? { id: nextCls.id, title: nextCls.title } : null}
        breadcrumb={{
          moduleNum,
          moduleName: mod?.name ?? '',
          classIndex: classIndex + 1,
          totalClasses: allClasses.length,
        }}
        accessTier={accessTier}
        modules={modules}
        existingDecision={existingDecision}
      />,
      { title: `${cls.title} — The Right Decision` },
    ),
  )
})

// ─── GET /journey → Your Journey Page ───────────────────────────────────────
coursePageRoutes.get('/journey', async (c) => {
  const user = await getUser(c.req.raw.headers)
  if (!user) return c.redirect('/login')

  const decisions = await getUserDecisions(user.id, 'life-decisions')
  const overall = await getOverallProgress(user.id)

  // Find current class
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
