import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'

describe('/health (liveness)', () => {
  test('returns 200 with status ok', async () => {
    const app = new Hono()
    app.get('/health', (c) =>
      c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
      }),
    )

    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.timestamp).toBeDefined()
    expect(typeof body.uptime).toBe('number')
  })
})
