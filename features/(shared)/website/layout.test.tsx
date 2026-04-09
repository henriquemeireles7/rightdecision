import { describe, expect, test } from 'bun:test'
import { renderToString } from 'preact-render-to-string'
import { Layout } from './layout'

describe('Layout', () => {
  test('renders header with logo and nav links', () => {
    const html = renderToString(
      <Layout>
        <p>Test content</p>
      </Layout>,
    )
    expect(html).toContain('The Right Decision')
    expect(html).toContain('href="/"')
    expect(html).toContain('href="/about"')
    expect(html).toContain('href="/blog"')
    expect(html).toContain('href="/method"')
    expect(html).toContain('href="/handbook"')
    expect(html).toContain('href="/life"')
  })

  test('renders Life Decisions CTA button', () => {
    const html = renderToString(
      <Layout>
        <p>Test</p>
      </Layout>,
    )
    expect(html).toContain('Life Decisions')
    expect(html).toContain('bg-gold')
  })

  test('renders footer with resources and legal links', () => {
    const html = renderToString(
      <Layout>
        <p>Test</p>
      </Layout>,
    )
    expect(html).toContain('href="/privacy"')
    expect(html).toContain('href="/terms"')
    expect(html).toContain('Privacy Policy')
    expect(html).toContain('Terms of Service')
    expect(html).toContain('2026 The Right Decision LLC')
  })

  test('renders children between header and footer', () => {
    const html = renderToString(
      <Layout>
        <div id="test-child">Hello</div>
      </Layout>,
    )
    const headerEnd = html.indexOf('</header>')
    const childPos = html.indexOf('test-child')
    const footerStart = html.indexOf('<footer')
    expect(headerEnd).toBeLessThan(childPos)
    expect(childPos).toBeLessThan(footerStart)
  })

  test('renders mobile hamburger menu', () => {
    const html = renderToString(
      <Layout>
        <p>Test</p>
      </Layout>,
    )
    expect(html).toContain('<details')
    expect(html).toContain('Menu')
  })

  test('nav has aria-label for accessibility', () => {
    const html = renderToString(
      <Layout>
        <p>Test</p>
      </Layout>,
    )
    expect(html).toContain('aria-label="Main navigation"')
  })
})
