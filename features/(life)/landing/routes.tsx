import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { getNextCohort } from '@/features/(life)/join/service'
import {
  buildOrganizationSchema,
  buildProductSchema,
  renderJsonLd,
} from '@/features/(shared)/website/seo'
import { isV2CutoverEnabled } from '@/platform/auth/enrollment'
import { env } from '@/platform/env'
import { FREE_PROGRAM_SLUG } from '@/platform/programs'
import { renderPage } from '@/platform/server/render'
import { LandingPage } from './landing'

/**
 * P4 cohort slot data: only fetched post-cutover; any failure degrades to the
 * exact pre-cutover landing (the sales page must never break on a DB hiccup).
 */
async function fetchNextCohortStartsAt(): Promise<Date | null> {
  if (!isV2CutoverEnabled()) return null
  try {
    const next = await getNextCohort(FREE_PROGRAM_SLUG)
    return next?.cohort.startsAt ?? null
  } catch (error) {
    console.error('[landing] next-cohort fetch failed (rendering without it):', error)
    return null
  }
}

const VARIANTS = ['a', 'b', 'c', 'd'] as const
type Variant = (typeof VARIANTS)[number]

export const landingRoutes = new Hono()

landingRoutes.get('/', async (c) => {
  let variant = c.req.query('v') as Variant | undefined

  if (!variant || !VARIANTS.includes(variant)) {
    variant = getCookie(c, 'lp_variant') as Variant | undefined
  }

  if (!variant || !VARIANTS.includes(variant)) {
    variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)]
  }

  const finalVariant: Variant = variant ?? 'a'

  setCookie(c, 'lp_variant', finalVariant, {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  })

  const baseUrl = env.PUBLIC_APP_URL
  const jsonLd = [
    renderJsonLd(buildProductSchema(baseUrl)),
    renderJsonLd(buildOrganizationSchema(baseUrl)),
  ].join('\n')

  const nextCohortStartsAt = await fetchNextCohortStartsAt()

  return c.html(
    renderPage(
      <LandingPage
        variant={finalVariant}
        nextCohortStartsAt={nextCohortStartsAt}
        cohortTimezone={env.COHORT_TIMEZONE}
      />,
      {
        title: 'The Right Decision — Life Decisions Course',
        description:
          'A methodology + AI that turns stuck goals into clear decisions. $197/year. 7-day guarantee.',
        ogImage: `${baseUrl}/og/why-we-built-the-right-decision.png`,
        canonical: `${baseUrl}/life`,
        posthogKey: env.PUBLIC_POSTHOG_KEY,
        posthogHost: env.POSTHOG_HOST,
      },
    ).replace('</head>', `${jsonLd}\n</head>`),
  )
})
