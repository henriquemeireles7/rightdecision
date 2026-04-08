import { Hono } from 'hono'
import { renderPage } from '@/platform/server/render'
import { LandingPage } from './landing'

export const landingRoutes = new Hono()

landingRoutes.get('/', (c) => {
  return c.html(
    renderPage(<LandingPage />, {
      title: 'The Right Decision — Life Decisions Course',
      description:
        'A methodology + AI that turns stuck goals into clear decisions. $197/year. 7-day guarantee.',
    }),
  )
})
