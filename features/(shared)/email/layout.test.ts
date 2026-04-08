import { describe, expect, test } from 'bun:test'
import { ctaButton, emailLayout, escapeHtml, stripHtml } from './layout'

describe('emailLayout', () => {
  test('wraps content in branded HTML with header and footer', () => {
    const { html } = emailLayout('<p>Hello world</p>')
    expect(html).toContain('Right Decision')
    expect(html).toContain('#FAF8F5') // warm cream background
    expect(html).toContain('#FFFFFF') // white content card
    expect(html).toContain('#1A1714') // warm near-black text
    expect(html).toContain('Hello world')
    expect(html).toContain('PHYSICAL_ADDRESS_PLACEHOLDER')
  })

  test('includes preheader when provided', () => {
    const { html } = emailLayout('<p>Body</p>', { preheader: 'Preview text here' })
    expect(html).toContain('Preview text here')
    // Preheader should be hidden visually
    expect(html).toContain('display:none')
  })

  test('omits preheader when not provided', () => {
    const { html } = emailLayout('<p>Body</p>')
    expect(html).not.toContain('display:none')
  })

  test('uses table-based layout for email client compatibility', () => {
    const { html } = emailLayout('<p>Content</p>')
    expect(html).toContain('<table')
    expect(html).toContain('600')
  })

  test('includes font stack fallback', () => {
    const { html } = emailLayout('<p>Content</p>')
    expect(html).toContain('Instrument Sans')
    expect(html).toContain('Segoe UI')
    expect(html).toContain('Arial')
  })

  test('generates plain-text version without HTML tags', () => {
    const { text } = emailLayout('<p>Hello <strong>world</strong></p>')
    expect(text).not.toContain('<p>')
    expect(text).not.toContain('<strong>')
    expect(text).toContain('Hello world')
  })

  test('converts links to [text](url) format in plain-text', () => {
    const { text } = emailLayout('<a href="https://example.com">Click here</a>')
    expect(text).toContain('[Click here](https://example.com)')
    expect(text).not.toContain('<a')
  })

  test('plain-text includes footer', () => {
    const { text } = emailLayout('<p>Body</p>')
    expect(text).toContain('Right Decision')
  })
})

describe('ctaButton', () => {
  test('generates amber CTA button HTML', () => {
    const html = ctaButton('Click Me', 'https://example.com')
    expect(html).toContain('Click Me')
    expect(html).toContain('https://example.com')
    expect(html).toContain('#C4956A') // amber/gold
    expect(html).toContain('border-radius')
  })
})

describe('escapeHtml', () => {
  test('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    )
  })

  test('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
  })

  test('passes through safe strings unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World')
  })
})

describe('stripHtml', () => {
  test('removes all HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world')
  })

  test('converts <br> to newlines', () => {
    expect(stripHtml('Line 1<br>Line 2')).toContain('Line 1\nLine 2')
  })

  test('converts <a> to markdown links', () => {
    expect(stripHtml('<a href="https://x.com">Link</a>')).toBe('[Link](https://x.com)')
  })

  test('handles nested tags', () => {
    expect(stripHtml('<div><p><strong>Bold</strong> text</p></div>')).toBe('Bold text')
  })

  test('decodes HTML entities', () => {
    expect(stripHtml('&amp; &lt; &gt; &quot;')).toBe('& < > "')
  })
})
