import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { renderPage } from '@/platform/server/render'
import { LandingPage } from './landing'

const VARIANTS = ['a', 'b', 'c', 'd'] as const
type Variant = (typeof VARIANTS)[number]

export const landingRoutes = new Hono()

landingRoutes.get('/', (c) => {
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
    sameSite: 'Lax',
  })

  return c.html(
    renderPage(<LandingPage variant={finalVariant} />, {
      title: 'The Right Decision — Life Decisions Course',
      description:
        'A methodology + AI that turns stuck goals into clear decisions. $197/year. 7-day guarantee.',
    }),
  )
})
