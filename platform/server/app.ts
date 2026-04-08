import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from '@/platform/env'
import { checkHealth } from './health'
import { mountRoutes } from './routes'

const app = new Hono()

// Health checks — before middleware so they always respond
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  }),
)
app.get('/health/ready', async (c) => {
  const { httpStatus, body } = await checkHealth()
  return c.json(body, httpStatus as 200)
})

// Middleware stack
app.use('*', logger())
app.use('*', cors({ origin: env.PUBLIC_APP_URL, credentials: true }))
app.use('/*', serveStatic({ root: './public' }))

// Mount all routes
const appRoutes = mountRoutes(app)

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Something went wrong' }, 500)
})

// Export type for hono/client RPC
export type AppRoutes = typeof appRoutes

// Start server
const port = env.PORT
console.log(`Right Decision server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
