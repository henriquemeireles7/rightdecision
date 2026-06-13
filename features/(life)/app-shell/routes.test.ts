import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { createAppShellRoutes } from './routes'

const SESSION = {
  user: { id: 'user-1', email: 'm@example.com', name: 'M' },
  session: { id: 'session-1' },
}

function buildApp(overrides: Parameters<typeof createAppShellRoutes>[0] = {}) {
  const routes = createAppShellRoutes({
    getSession: async () => SESSION,
    readManifest: () => ({
      app: '/build/app-abc123.js',
      'player-hls': '/build/player-hls-def456.js',
    }),
    signUrl: async (key: string) => `https://r2.example.com/signed/${key}`,
    streamCustomerCode: 'cust123',
    ...overrides,
  })
  return new Hono().route('/app', routes)
}

describe('unit: app-shell routes', () => {
  test('serves the SPA shell at /app', async () => {
    const res = await buildApp().request('/app')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
    const html = await res.text()
    expect(html).toContain('<div id="app">')
    expect(html).toContain('/build/app-abc123.js')
    expect(html).toContain('/styles.css')
  })

  test('deep links serve the same shell (no 404 into marketing)', async () => {
    const res = await buildApp().request('/app/lessons/3f1a2b3c-4d5e-6f70-8192-a3b4c5d6e7f8')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<div id="app">')
  })

  test('injects window.__APP_CONFIG__ with manifest + stream customer code', async () => {
    const html = await (await buildApp().request('/app')).text()
    expect(html).toContain('window.__APP_CONFIG__')
    expect(html).toContain('player-hls-def456.js')
    expect(html).toContain('cust123')
  })

  test('escapes </script> sequences in the injected config JSON', async () => {
    const html = await (
      await buildApp({
        readManifest: () => ({ app: '/build/app-</script><script>alert(1)</script>.js' }),
      }).request('/app')
    ).text()
    expect(html).not.toContain('</script><script>alert(1)')
    expect(html).toContain('\\u003c/script')
  })

  test('members area is noindex', async () => {
    const html = await (await buildApp().request('/app')).text()
    expect(html).toContain('noindex')
  })

  test('unauthenticated → redirect to /login?next=<path>', async () => {
    const res = await buildApp({ getSession: async () => null }).request('/app/lives')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(`/login?next=${encodeURIComponent('/app/lives')}`)
  })

  test('missing manifest entry still serves the shell without a script tag', async () => {
    const html = await (await buildApp({ readManifest: () => ({}) }).request('/app')).text()
    expect(html).toContain('<div id="app">')
    expect(html).not.toContain('<script type="module"')
  })

  test('media: redirects to a signed URL for the requested key', async () => {
    const res = await buildApp().request('/app/media/covers/modules/abc/cover.png')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(
      'https://r2.example.com/signed/covers/modules/abc/cover.png',
    )
  })

  test('media: unauthenticated gets the JSON 401, never a signed URL', async () => {
    let signed = 0
    const res = await buildApp({
      getSession: async () => null,
      signUrl: async (key: string) => {
        signed++
        return key
      },
    }).request('/app/media/covers/x.png')
    expect(res.status).toBe(401)
    expect(signed).toBe(0)
  })

  test('media: empty key is a 404', async () => {
    const res = await buildApp().request('/app/media/')
    expect(res.status).toBe(404)
  })

  test('media: path traversal keys are rejected', async () => {
    const res = await buildApp().request('/app/media/..%2Fsecrets')
    expect(res.status).toBe(404)
  })

  test('media: signing failure (e.g. R2 unconfigured) is a clean 404, not a 500', async () => {
    const res = await buildApp({
      signUrl: async () => {
        throw new Error('R2 not configured')
      },
    }).request('/app/media/covers/x.png')
    expect(res.status).toBe(404)
  })
})
