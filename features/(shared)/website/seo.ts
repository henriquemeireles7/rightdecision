// ─── SEO Utilities ──────────────────────────────────────────────────────────

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

type SeoConfig = {
  title: string
  description: string
  canonical: string
  ogImage?: string
  keywords?: string[]
  type?: 'website' | 'article'
  author?: string
  datePublished?: string
  dateModified?: string
}

export function renderMetaTags(config: SeoConfig): string {
  const { title, description, canonical, ogImage, keywords, type = 'website' } = config

  const lines: string[] = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
  ]

  if (ogImage) {
    lines.push(`<meta property="og:image" content="${esc(ogImage)}" />`)
    lines.push(`<meta name="twitter:image" content="${esc(ogImage)}" />`)
  }

  if (keywords?.length) {
    lines.push(`<meta name="keywords" content="${esc(keywords.join(', '))}" />`)
  }

  return lines.join('\n  ')
}

// ─── JSON-LD ────────────────────────────────────────────────────────────────

export function renderJsonLd(schema: Record<string, unknown>): string {
  const data = { '@context': 'https://schema.org', ...schema }
  // Escape </script> to prevent XSS breakout in HTML context
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return `<script type="application/ld+json">${json}</script>`
}

// ─── Schema Builders ────────────────────────────────────────────────────────

const AUTHORS: Record<string, { name: string; jobTitle: string; description: string }> = {
  henry: {
    name: 'Henry Meireles',
    jobTitle: 'Technical Founder',
    description:
      'Founder of The Right Decision. Built multiple companies, coached 400+ founders, rebuilding after losing everything.',
  },
  indy: {
    name: 'Indy',
    jobTitle: 'Content & Brand',
    description: 'Content & Brand at The Right Decision. The voice, heart, and quality gate.',
  },
  'henry-and-indy': {
    name: 'Henry Meireles & Indy',
    jobTitle: 'Founders',
    description: 'Founders of The Right Decision.',
  },
}

export function buildArticleSchema(opts: {
  title: string
  description: string
  author: string
  datePublished: string
  dateModified?: string
  url: string
  baseUrl: string
}) {
  const authorInfo = AUTHORS[opts.author] ?? AUTHORS.henry!
  return {
    '@type': 'Article' as const,
    headline: opts.title,
    description: opts.description,
    author: {
      '@type': 'Person' as const,
      name: authorInfo.name,
      url: `${opts.baseUrl}/about`,
    },
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    publisher: {
      '@type': 'Organization' as const,
      name: 'The Right Decision',
    },
    mainEntityOfPage: opts.url,
  }
}

export function buildFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@type': 'FAQPage' as const,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question' as const,
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: faq.answer,
      },
    })),
  }
}

export function buildOrganizationSchema(baseUrl: string) {
  return {
    '@type': 'Organization' as const,
    name: 'The Right Decision',
    description:
      'Solving decision-making with AI. A methodology + AI platform for personal and business decisions.',
    url: baseUrl,
    // TODO: Replace with actual logo when designed (min 112x112px for Google Knowledge Panel)
    logo: `${baseUrl}/logo.png`,
    founders: [
      { '@type': 'Person' as const, name: 'Henry Meireles' },
      { '@type': 'Person' as const, name: 'Indy' },
    ],
  }
}

export function buildWebSiteSchema(baseUrl: string) {
  return {
    '@type': 'WebSite' as const,
    name: 'The Right Decision',
    url: baseUrl,
    // SearchAction deferred until blog search is implemented (V2)
  }
}

export function buildPersonSchema(person: 'henry' | 'indy', baseUrl: string) {
  const info = AUTHORS[person]!
  return {
    '@type': 'Person' as const,
    name: info.name,
    jobTitle: info.jobTitle,
    description: info.description,
    url: `${baseUrl}/about`,
    // TODO: Add LinkedIn, Crunchbase URLs when entity profiles are created (see action-plan.md)
    sameAs: [] as string[],
  }
}

export function buildProductSchema(baseUrl: string) {
  return {
    '@type': 'Product' as const,
    name: 'Life Decisions',
    description:
      'A 9-module course + AI decision-making skills. Learn the methodology, run the skills, make the decisions that change your life.',
    brand: {
      '@type': 'Organization' as const,
      name: 'The Right Decision',
    },
    offers: {
      '@type': 'Offer' as const,
      price: '197.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/life`,
    },
  }
}

export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@type': 'BreadcrumbList' as const,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem' as const,
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
