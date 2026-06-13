import { escapeHtml } from '@/features/(shared)/email/layout'
import type { TemplateSchema } from '@/platform/db/schema'

/**
 * The v1 "PDF export": a self-contained, print-ready HTML document the user prints
 * to PDF from the browser (see this folder's CLAUDE.md for why this beats a satori
 * PDF binary). Print rules: WHITE background, ink text, Instrument Serif heads,
 * gold ONLY for rules/accents — cream wastes ink printed.
 *
 * escapeHtml is the single canonical impl from email/layout.ts (DSA: extract on 3rd dup).
 */

const INK = '#1A1A1A'
const GOLD = '#C4956A'

const styles = `
  * { box-sizing: border-box; }
  body {
    background: #fff;
    color: ${INK};
    font-family: 'Instrument Sans', -apple-system, sans-serif;
    font-size: 12pt;
    line-height: 1.6;
    max-width: 640px;
    margin: 0 auto;
    padding: 48px 24px;
  }
  h1, h2, h3 { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; color: ${INK}; }
  h1 { font-size: 30pt; margin: 0 0 4px; }
  h2 { font-size: 20pt; margin: 36px 0 4px; padding-top: 18px; border-top: 2px solid ${GOLD}; }
  h3 { font-size: 15pt; margin: 24px 0 4px; }
  .byline { margin: 0 0 8px; }
  .instruction { font-style: italic; margin: 0 0 12px; }
  .field { margin: 0 0 14px; }
  .label { font-size: 9.5pt; letter-spacing: 0.04em; text-transform: uppercase; margin: 0 0 2px; }
  .answer { margin: 0; white-space: pre-wrap; }
  .unanswered { margin: 0; border-bottom: 1px solid ${GOLD}; min-height: 1.6em; }
  @media print {
    body { padding: 0; }
    h2 { break-after: avoid; }
    h3 { break-after: avoid; }
    .field { break-inside: avoid; }
  }
  @page { margin: 2cm; }
`

type ExportInput = {
  title: string
  userName: string
  schema: TemplateSchema
  answersByFieldId: Map<string, string>
}

export function renderExportHtml({
  title,
  userName,
  schema,
  answersByFieldId,
}: ExportInput): string {
  const chapters = schema.chapters
    .map((chapter) => {
      const pages = chapter.pages
        .map((page) => {
          const fields = page.fields
            .map((field) => {
              const value = answersByFieldId.get(field.id)
              const body =
                value !== undefined
                  ? `<p class="answer">${escapeHtml(value)}</p>`
                  : '<p class="unanswered"></p>'
              return `<div class="field"><p class="label">${escapeHtml(field.label)}</p>${body}</div>`
            })
            .join('\n')
          const instruction = page.instruction
            ? `<p class="instruction">${escapeHtml(page.instruction)}</p>`
            : ''
          return `<section><h3>${escapeHtml(page.title)}</h3>${instruction}\n${fields}</section>`
        })
        .join('\n')
      return `<section><h2>${escapeHtml(chapter.title)}</h2>\n${pages}</section>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${styles}</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p class="byline">${escapeHtml(userName)}</p>
${chapters}
</body>
</html>`
}
