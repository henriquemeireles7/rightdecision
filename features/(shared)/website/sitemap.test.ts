import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { sitemapRoutes } from './sitemap'

const app = new Hono().route('/', sitemapRoutes)

describe('robots.txt', () => {
  test('returns correct directives', async () => {
    const res = await app.request('/robots.txt')
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('User-agent: *')
    expect(text).toContain('Allow: /')
    expect(text).toContain('Disallow: /api/')
    expect(text).toContain('Disallow: /app/')
    expect(text).toContain('Disallow: /admin/')
    expect(text).toContain('Disallow: /purchase/')
    expect(text).toContain('User-agent: GPTBot')
    expect(text).toContain('User-agent: ClaudeBot')
    expect(text).toContain('User-agent: Google-Extended')
    expect(text).toContain('Sitemap:')
    expect(res.headers.get('Content-Type')).toContain('text/plain')
  })
})

describe('sitemap.xml', () => {
  test('returns valid XML with static pages', async () => {
    const res = await app.request('/sitemap.xml')
    expect(res.status).toBe(200)
    const xml = await res.text()
    expect(xml).toContain('<?xml version="1.0"')
    expect(xml).toContain('<urlset')
    expect(xml).toContain('rightdecisions.io/')
    expect(xml).toContain('rightdecisions.io/about')
    expect(xml).toContain('rightdecisions.io/life')
    expect(xml).toContain('rightdecisions.io/blog')
    expect(xml).toContain('rightdecisions.io/concepts')
    expect(res.headers.get('Content-Type')).toContain('application/xml')
  })
})

describe('rss.xml', () => {
  test('returns valid RSS feed', async () => {
    const res = await app.request('/rss.xml')
    expect(res.status).toBe(200)
    const xml = await res.text()
    expect(xml).toContain('<?xml version="1.0"')
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<channel>')
    expect(xml).toContain('The Right Decision Blog')
    expect(res.headers.get('Content-Type')).toContain('application/rss+xml')
  })
})
