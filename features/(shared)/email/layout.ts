/**
 * Shared email layout — branded HTML + plain-text generation.
 * Every email uses this wrapper for consistent branding.
 *
 * Design: Ethereal Warmth (from decisions/design.md)
 * - Warm cream background (#FAF8F5)
 * - White content card (#FFFFFF)
 * - Warm near-black text (#1A1714)
 * - Amber/gold CTA (#C4956A)
 * - Georgia serif for headings (web-safe fallback for Instrument Serif)
 */

const FONT_STACK = "'Instrument Sans', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
const SERIF_STACK = "Georgia, 'Times New Roman', serif"

export function emailLayout(
	content: string,
	options?: { preheader?: string },
): { html: string; text: string } {
	const preheaderBlock = options?.preheader
		? `<div style="display:none;font-size:1px;color:#FAF8F5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${options.preheader}</div>`
		: ''

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Right Decision</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:${FONT_STACK};">
${preheaderBlock}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF8F5;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="padding:24px 0;text-align:center;">
<span style="font-family:${SERIF_STACK};font-size:24px;color:#1A1714;letter-spacing:0.02em;">Right Decision</span>
</td></tr>

<!-- Content Card -->
<tr><td style="background-color:#FFFFFF;border-radius:12px;padding:32px;color:#1A1714;font-size:16px;line-height:1.6;">
${content}
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 0;text-align:center;color:#A69D91;font-size:12px;line-height:1.5;">
Right Decision<br>
{PHYSICAL_ADDRESS_PLACEHOLDER}
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

	const text = generatePlainText(content)

	return { html, text }
}

export function ctaButton(label: string, url: string): string {
	return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="background-color:#C4956A;border-radius:8px;padding:14px 28px;text-align:center;">
<a href="${url}" style="color:#FFFFFF;font-family:${FONT_STACK};font-size:16px;font-weight:600;text-decoration:none;display:inline-block;">${label}</a>
</td></tr>
</table>`
}

export function stripHtml(html: string): string {
	let text = html
	// Convert <br> and block elements to newlines
	text = text.replace(/<br\s*\/?>/gi, '\n')
	text = text.replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
	// Convert <a> to markdown links
	text = text.replace(/<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '[$2]($1)')
	// Remove all remaining HTML tags
	text = text.replace(/<[^>]+>/g, '')
	// Decode HTML entities
	text = text.replace(/&amp;/g, '&')
	text = text.replace(/&lt;/g, '<')
	text = text.replace(/&gt;/g, '>')
	text = text.replace(/&quot;/g, '"')
	text = text.replace(/&#39;/g, "'")
	text = text.replace(/&nbsp;/g, ' ')
	// Clean up multiple newlines
	text = text.replace(/\n{3,}/g, '\n\n')
	return text.trim()
}

function generatePlainText(content: string): string {
	const body = stripHtml(content)
	return `${body}\n\n---\nRight Decision\n{PHYSICAL_ADDRESS_PLACEHOLDER}`
}
