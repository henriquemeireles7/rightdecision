import { describe, expect, test } from 'bun:test'
import { buildTestTemplateSchema } from '@/platform/test/factories'
import { renderExportHtml } from './export'

describe('renderExportHtml', () => {
  const html = renderExportHtml({
    title: 'Life Playbook',
    userName: 'Maria',
    schema: buildTestTemplateSchema(),
    answersByFieldId: new Map([['f-required', 'Leave the job by March.']]),
  })

  test('is a full print-ready HTML document with the filled answers', () => {
    expect(html).toStartWith('<!doctype html>')
    expect(html).toContain('Life Playbook')
    expect(html).toContain('Leave the job by March.')
    expect(html).toContain('Test Chapter')
    expect(html).toContain('Test Page')
    expect(html).toContain('Write the true thing, not the polite thing.')
  })

  test('carries a print stylesheet: white background, ink text, Instrument Serif heads', () => {
    expect(html).toContain('@media print')
    expect(html).toContain('@page')
    expect(html).toMatch(/background:\s*#fff/i)
    expect(html).toContain('Instrument Serif')
    // gold appears for rules/accents only — never as a background
    expect(html).toContain('#C4956A')
    expect(html).not.toMatch(/background[^;]*#C4956A/i)
  })

  test('unanswered fields render as an invitation line, not an empty hole', () => {
    expect(html).toContain('The optional field')
    expect(html).toContain('class="unanswered"')
  })

  test('escapes user-supplied answer values', () => {
    const hostile = renderExportHtml({
      title: 'Life Playbook',
      userName: '<b>Eve</b>',
      schema: buildTestTemplateSchema(),
      answersByFieldId: new Map([['f-required', '<script>alert(1)</script> & "quotes"']]),
    })
    expect(hostile).not.toContain('<script>alert(1)</script>')
    expect(hostile).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;')
    expect(hostile).not.toContain('<b>Eve</b>')
  })
})
