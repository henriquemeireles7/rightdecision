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

  test('includes Google Fonts link', () => {
    const html = renderPage(<div />)
    expect(html).toContain('fonts.googleapis.com')
    expect(html).toContain('Instrument+Serif')
    expect(html).toContain('Instrument+Sans')
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

  test('includes og:image when provided', () => {
    const html = renderPage(<div />, { ogImage: 'https://example.com/img.png' })
    expect(html).toContain('og:image')
    expect(html).toContain('https://example.com/img.png')
  })
})
