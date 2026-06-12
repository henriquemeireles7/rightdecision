import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { tick } from '@/features/(shared)/scheduler/tick'
import { env } from '@/platform/env'
import { track } from '@/providers/analytics'
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
app.use('*', secureHeaders())
app.use('*', cors({ origin: env.PUBLIC_APP_URL, credentials: true }))
app.use('/*', serveStatic({ root: './public' }))

// Mount all routes
const appRoutes = mountRoutes(app)

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  track('error_occurred', {
    error_code: 'INTERNAL_ERROR',
    path: c.req.path,
    method: c.req.method,
    message: err.message,
  })
  return c.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Something went wrong' }, 500)
})

// Export type for hono/client RPC
export type AppRoutes = typeof appRoutes

// Start server
const port = env.PORT
console.log(`Right Decision server running on http://localhost:${port}`)

// In-process scheduler — single Railway instance, idempotent jobs.
// Guarded by import.meta.main so tests importing app.fetch never start the ticker.
// Jobs catch up on the next tick after deploy restarts (see features/(shared)/scheduler/CLAUDE.md).
if (import.meta.main) {
  setInterval(() => void tick(new Date()), 60_000)
}

export default {
  port,
  fetch: app.fetch,
}
