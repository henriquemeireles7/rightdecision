import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { getUserAccessTier } from '@/features/(life)/course/access'
import { env } from '@/platform/env'
import { renderPage } from '@/platform/server/render'
import { getClass } from '@/providers/content'
import { renderCourseMarkdown } from '@/providers/markdown'
import { FreeIntroLesson } from './lesson-view'
import { FreeIntroPaywall } from './paywall'

const FREE_INTRO_MODULE = 99

/**
 * Try to get the current user ID from Better Auth session cookie.
 * Returns null if not authenticated.
 */
async function tryGetUserId(c: {
  req: { header: (name: string) => string | undefined }
}): Promise<string | null> {
  try {
    const cookie = c.req.header('cookie')
    if (!cookie?.includes('better-auth.session_token')) return null
    // Lazy import to avoid circular deps
    const { db } = await import('@/platform/db/client')
    const { eq, gt } = await import('drizzle-orm')
    const tokenMatch = cookie.match(/better-auth\.session_token=([^;]+)/)
    if (!tokenMatch) return null
    const session = await db.query.sessions.findFirst({
      where: (s, { and }) => and(eq(s.token, tokenMatch[1]!), gt(s.expiresAt, new Date())),
    })
    return session?.userId ?? null
  } catch {
    return null
  }
}

export const freeIntroPageRoutes = new Hono()

/** Landing page for /free — redirects to lesson 1, or to course if paid */
freeIntroPageRoutes.get('/', async (c) => {
  // Returning user redirect: paid users go to their course
  const userId = await tryGetUserId(c)
  if (userId) {
    const tier = await getUserAccessTier(userId)
    if (tier === 'paid') {
      return c.redirect('/courses/life-decisions', 302)
    }
  }
  // Persist A/B variant if present
  const variant = c.req.query('v')
  if (variant) {
    setCookie(c, 'free_intro_variant', variant, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    })
  }
  return c.redirect('/free/1', 302)
})

/** Paywall page after lesson 3 — MUST be before /:lesson wildcard */
freeIntroPageRoutes.get('/paywall', (c) => {
  const baseUrl = env.PUBLIC_APP_URL

  return c.html(
    renderPage(<FreeIntroPaywall />, {
      title: 'Continue Your Journey — The Right Decision',
      description:
        'You made your first decision. The full program decomposes it into 9 modules of daily actions.',
      canonical: `${baseUrl}/free/paywall`,
    }),
  )
})

/** Render free intro lessons */
freeIntroPageRoutes.get('/:lesson', (c) => {
  const lessonNum = Number.parseInt(c.req.param('lesson') ?? '0', 10)
  if (lessonNum < 1 || lessonNum > 3) return c.redirect('/free/1', 302)

  const classId = `module-${String(FREE_INTRO_MODULE).padStart(2, '0')}/class-${String(lessonNum).padStart(2, '0')}`
  const courseClass = getClass(classId)

  if (!courseClass) {
    return c.html(
      renderPage(
        <div class="max-w-[640px] mx-auto px-md py-3xl">
          <h1 class="font-display text-2xl text-ink mb-md">Lesson not found</h1>
          <p class="text-secondary">This lesson doesn't exist yet. Check back soon.</p>
        </div>,
        { title: 'Lesson Not Found — The Right Decision' },
      ),
    )
  }

  // Render only the first segment (before any decision block)
  const firstSegment = courseClass.segments[0]
  const firstSegmentHtml =
    firstSegment?.type === 'content' && firstSegment.content
      ? renderCourseMarkdown(firstSegment.content)
      : ''

  // Collect decision blocks and their positions
  const blocks = courseClass.segments
    .filter((s) => s.type === 'decision-block' && s.block)
    .map((s) => s.block!)

  const baseUrl = env.PUBLIC_APP_URL

  return c.html(
    renderPage(
      <FreeIntroLesson
        lessonNum={lessonNum}
        title={courseClass.title}
        firstSegmentHtml={firstSegmentHtml}
        blocks={blocks}
        classId={classId}
        courseSlug={courseClass.courseSlug}
        isLastLesson={lessonNum === 3}
      />,
      {
        title: `${courseClass.title} — Free Intro — The Right Decision`,
        description: 'Experience the decision-making methodology for free. No signup required.',
        canonical: `${baseUrl}/free/${lessonNum}`,
        posthogKey: env.PUBLIC_POSTHOG_KEY,
        posthogHost: env.POSTHOG_HOST,
      },
    ),
  )
})
