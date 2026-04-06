import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from '@/platform/env'
import { mountRoutes } from './routes'

const app = new Hono()

// Middleware stack
app.use('*', logger())
app.use('*', cors({ origin: env.PUBLIC_APP_URL, credentials: true }))

// Mount all routes
const appRoutes = mountRoutes(app)

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Something went wrong' }, 500)
})

// Health check
app.get('/health', (c) => c.json({ ok: true, timestamp: new Date().toISOString() }))

// Export type for hono/client RPC
export type AppRoutes = typeof appRoutes

// Start server
const port = env.PORT
console.log(`Right Decision server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
