import { describe, expect, test } from 'bun:test'
import { renderPage } from './render'

describe('renderPage', () => {
  test('returns valid HTML document', () => {
    const html = renderPage(<div>Hello</div>)
    expect(html).toStartWith('<!DOCTYPE html>')
    expect(html).toContain('<html lang="en">')
    expect(html).toContain('</html>')
  })

  test('includes component HTML in main', () => {
    const html = renderPage(<div>Test content</div>)
    expect(html).toContain('<main id="main-content">')
    expect(html).toContain('Test content')
  })

  test('sets title from options', () => {
    const html = renderPage(<div />, { title: 'My Page' })
    expect(html).toContain('<title>My Page</title>')
  })

  test('uses default title when not provided', () => {
    const html = renderPage(<div />)
    expect(html).toContain('<title>The Right Decision</title>')
  })

  test('sets meta description', () => {
    const html = renderPage(<div />, { description: 'A description' })
    expect(html).toContain('content="A description"')
  })

  test('preloads self-hosted fonts', () => {
    const html = renderPage(<div />)
    expect(html).not.toContain('fonts.googleapis.com')
    expect(html).toContain('InstrumentSerif-Regular.woff2')
    expect(html).toContain('InstrumentSans-Regular.woff2')
    expect(html).toContain('rel="preload"')
  })

  test('includes /styles.css link', () => {
    const html = renderPage(<div />)
    expect(html).toContain('href="/styles.css"')
  })

  test('includes skip-navigation link', () => {
    const html = renderPage(<div />)
    expect(html).toContain('href="#main-content"')
    expect(html).toContain('Skip to content')
  })

  test('includes OG meta tags', () => {
    const html = renderPage(<div />, { title: 'T', description: 'D' })
    expect(html).toContain('og:title')
    expect(html).toContain('og:description')
    expect(html).toContain('og:type')
  })

  test('escapes XSS in title', () => {
    const html = renderPage(<div />, { title: '<script>alert("xss")</script>' })
    expect(html).not.toContain('<script>alert(')
    expect(html).toContain('&lt;script')
  })

  test('includes canonical when provided', () => {
    const html = renderPage(<div />, { canonical: 'https://example.com' })
    expect(html).toContain('rel="canonical"')
    expect(html).toContain('https://example.com')
  })

  test('includes og:image and twitter:image when provided', () => {
    const html = renderPage(<div />, { ogImage: 'https://example.com/img.png' })
    expect(html).toContain('og:image')
    expect(html).toContain('twitter:image')
    expect(html).toContain('twitter:card')
    expect(html).toContain('https://example.com/img.png')
  })

  test('uses ogType when provided', () => {
    const html = renderPage(<div />, { ogType: 'article' })
    expect(html).toContain('og:type" content="article"')
  })

  test('defaults ogType to website', () => {
    const html = renderPage(<div />)
    expect(html).toContain('og:type" content="website"')
  })

  test('includes PostHog script when posthogKey is provided', () => {
    const html = renderPage(<div />, {
      posthogKey: 'phc_test123',
      posthogHost: 'https://us.i.posthog.com',
    })
    expect(html).toContain('posthog.init')
    expect(html).toContain('phc_test123')
    expect(html).toContain('us-assets.i.posthog.com/static/array.js')
    expect(html).toContain('autocapture')
    expect(html).toContain('session_recording')
  })

  test('omits PostHog script when posthogKey is not provided', () => {
    const html = renderPage(<div />)
    expect(html).not.toContain('posthog.init')
  })

  test('escapes XSS in PostHog key', () => {
    const html = renderPage(<div />, { posthogKey: '<script>alert("xss")</script>' })
    expect(html).not.toContain('<script>alert')
    expect(html).toContain('\\u003cscript\\u003e')
  })

  test('escapes backslash in PostHog key (JS context)', () => {
    const html = renderPage(<div />, { posthogKey: "test\\'" })
    expect(html).not.toContain("test\\'")
    expect(html).toContain("test\\\\'")
  })
})
