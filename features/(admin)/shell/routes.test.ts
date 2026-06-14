import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import type { AppEnv } from '@/platform/types'
import { createAdminShellRoutes } from './routes'

type SessionRole = 'free' | 'pro' | 'admin' | null

function buildApp(role: SessionRole, overrides: Parameters<typeof createAdminShellRoutes>[0] = {}) {
  const shell = createAdminShellRoutes({
    getSession: async () => (role === null ? null : { user: { role } }),
    loadManifest: () => ({ admin: '/build/admin-deadbeef.js' }),
    signMediaUrl: async (key) => `https://r2.example/signed/${key}`,
    ...overrides,
  })
  return new Hono<AppEnv>().route('/admin', shell)
}

describe('feature: admin shell route', () => {
  test('unauthenticated → redirect to /login (same as other member pages)', async () => {
    const res = await buildApp(null).request('/admin')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/login')
  })

  test.each([
    'free',
    'pro',
  ] as const)('non-admin role %s → 404, never 403 (panel is not advertised)', async (role) => {
    const res = await buildApp(role).request('/admin')
    expect(res.status).toBe(404)
  })

  test('admin → 200 HTML shell with hashed bundle, styles and mount node', async () => {
    const res = await buildApp('admin').request('/admin')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
    const html = await res.text()
    expect(html).toContain('<div id="admin">')
    expect(html).toContain('/build/admin-deadbeef.js')
    expect(html).toContain('/styles.css')
    expect(html).toContain('noindex')
  })

  test('serves the same shell for SPA sub-paths (client router owns them)', async () => {
    const res = await buildApp('admin').request('/admin/courses/c-1/modules/m-2/lessons/l-3')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('/build/admin-deadbeef.js')
  })

  test('missing client build → 503 with an actionable message, not a crash', async () => {
    const res = await buildApp('admin', {
      loadManifest: () => {
        throw new Error('manifest.json not found')
      },
    }).request('/admin')
    expect(res.status).toBe(503)
    expect(await res.text()).toContain('bun run build:client')
  })

  test('/admin/media/* redirects the admin to a short-lived signed R2 URL', async () => {
    const res = await buildApp('admin').request('/admin/media/covers/candidates/module/m-1/a.png')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(
      'https://r2.example/signed/covers/candidates/module/m-1/a.png',
    )
  })

  test('/admin/media/* is role-gated like the shell (non-admin → 404)', async () => {
    const res = await buildApp('free').request('/admin/media/covers/x.png')
    expect(res.status).toBe(404)
  })

  test('empty media key → 404', async () => {
    const res = await buildApp('admin').request('/admin/media/')
    expect(res.status).toBe(404)
  })
})
