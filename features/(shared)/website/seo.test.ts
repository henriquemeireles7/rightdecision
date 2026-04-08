import { describe, expect, test } from 'bun:test'
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildOrganizationSchema,
  buildPersonSchema,
  buildProductSchema,
  buildWebSiteSchema,
  renderJsonLd,
  renderMetaTags,
} from './seo'

describe('renderMetaTags', () => {
  test('renders basic meta tags', () => {
    const html = renderMetaTags({
      title: 'Test Page',
      description: 'A test description',
      canonical: 'https://rightdecisions.io/test',
    })
    expect(html).toContain('<title>Test Page</title>')
    expect(html).toContain('name="description" content="A test description"')
    expect(html).toContain('rel="canonical" href="https://rightdecisions.io/test"')
  })

  test('renders OG tags', () => {
    const html = renderMetaTags({
      title: 'Test',
      description: 'Desc',
      canonical: 'https://rightdecisions.io/test',
      ogImage: 'https://rightdecisions.io/og/test.png',
    })
    expect(html).toContain('property="og:title" content="Test"')
    expect(html).toContain('property="og:description" content="Desc"')
    expect(html).toContain('property="og:image" content="https://rightdecisions.io/og/test.png"')
    expect(html).toContain('property="og:url" content="https://rightdecisions.io/test"')
  })

  test('renders Twitter Card tags', () => {
    const html = renderMetaTags({
      title: 'Test',
      description: 'Desc',
      canonical: 'https://rightdecisions.io/test',
    })
    expect(html).toContain('name="twitter:card" content="summary_large_image"')
    expect(html).toContain('name="twitter:title" content="Test"')
  })

  test('renders keywords meta tag', () => {
    const html = renderMetaTags({
      title: 'Test',
      description: 'Desc',
      canonical: 'https://rightdecisions.io/test',
      keywords: ['seo', 'test'],
    })
    expect(html).toContain('name="keywords" content="seo, test"')
  })

  test('renders article type', () => {
    const html = renderMetaTags({
      title: 'Test',
      description: 'Desc',
      canonical: 'https://rightdecisions.io/test',
      type: 'article',
    })
    expect(html).toContain('property="og:type" content="article"')
  })

  test('escapes HTML in values', () => {
    const html = renderMetaTags({
      title: 'Test "with" quotes & <tags>',
      description: 'Desc',
      canonical: 'https://rightdecisions.io/test',
    })
    expect(html).toContain('&amp;')
    expect(html).toContain('&quot;')
    expect(html).not.toContain('<tags>')
  })
})

describe('renderJsonLd', () => {
  test('renders valid JSON-LD script tag', () => {
    const html = renderJsonLd({ '@type': 'Organization', name: 'Test' })
    expect(html).toContain('<script type="application/ld+json">')
    expect(html).toContain('"@context":"https://schema.org"')
    expect(html).toContain('"@type":"Organization"')
    expect(html).toContain('"name":"Test"')
  })
})

describe('buildArticleSchema', () => {
  test('builds correct Article schema', () => {
    const schema = buildArticleSchema({
      title: 'Test Article',
      description: 'A test',
      author: 'henry',
      datePublished: '2026-04-07',
      url: 'https://rightdecisions.io/blog/test',
      baseUrl: 'https://rightdecisions.io',
    })
    expect(schema['@type']).toBe('Article')
    expect(schema.headline).toBe('Test Article')
    expect(schema.author['@type']).toBe('Person')
    expect(schema.author.name).toBe('Henry Meireles')
    expect(schema.author.url).toBe('https://rightdecisions.io/about')
    expect(schema.publisher['@type']).toBe('Organization')
  })
})

describe('buildFaqSchema', () => {
  test('builds FAQPage schema from Q&A pairs', () => {
    const schema = buildFaqSchema([
      { question: 'What is this?', answer: 'A test.' },
      { question: 'Why?', answer: 'Because.' },
    ])
    expect(schema['@type']).toBe('FAQPage')
    expect(schema.mainEntity).toHaveLength(2)
    expect(schema.mainEntity[0]!['@type']).toBe('Question')
    expect(schema.mainEntity[0]!.name).toBe('What is this?')
    expect(schema.mainEntity[0]!.acceptedAnswer['@type']).toBe('Answer')
    expect(schema.mainEntity[0]!.acceptedAnswer.text).toBe('A test.')
  })
})

describe('buildOrganizationSchema', () => {
  test('builds Organization schema with logo', () => {
    const schema = buildOrganizationSchema('https://rightdecisions.io')
    expect(schema['@type']).toBe('Organization')
    expect(schema.name).toBe('The Right Decision')
    expect(schema.url).toBe('https://rightdecisions.io')
    expect(schema.logo).toBe('https://rightdecisions.io/logo.png')
    expect(schema.founders).toHaveLength(2)
  })
})

describe('buildPersonSchema', () => {
  test('builds Person schema for Henry with description', () => {
    const schema = buildPersonSchema('henry', 'https://rightdecisions.io')
    expect(schema['@type']).toBe('Person')
    expect(schema.name).toBe('Henry Meireles')
    expect(schema.jobTitle).toBe('Technical Founder')
    expect(schema.description).toContain('Founder of The Right Decision')
    expect(schema.url).toBe('https://rightdecisions.io/about')
    expect(schema.sameAs).toEqual([])
  })

  test('builds Person schema for Indy with description', () => {
    const schema = buildPersonSchema('indy', 'https://rightdecisions.io')
    expect(schema.name).toBe('Indy')
    expect(schema.jobTitle).toBe('Content & Brand')
    expect(schema.description).toContain('Content & Brand')
  })
})

describe('buildProductSchema', () => {
  test('builds Product schema with price', () => {
    const schema = buildProductSchema('https://rightdecisions.io')
    expect(schema['@type']).toBe('Product')
    expect(schema.name).toBe('Life Decisions')
    expect(schema.offers.price).toBe('197.00')
    expect(schema.offers.priceCurrency).toBe('USD')
    expect(schema.offers.availability).toBe('https://schema.org/InStock')
    expect(schema.offers.url).toBe('https://rightdecisions.io/life')
  })

  test('includes brand Organization', () => {
    const schema = buildProductSchema('https://rightdecisions.io')
    expect(schema.brand['@type']).toBe('Organization')
    expect(schema.brand.name).toBe('The Right Decision')
  })

  test('uses baseUrl parameter', () => {
    const schema = buildProductSchema('https://staging.example.com')
    expect(schema.offers.url).toBe('https://staging.example.com/life')
  })
})

describe('buildWebSiteSchema', () => {
  test('builds WebSite schema', () => {
    const schema = buildWebSiteSchema('https://rightdecisions.io')
    expect(schema['@type']).toBe('WebSite')
    expect(schema.name).toBe('The Right Decision')
    expect(schema.url).toBe('https://rightdecisions.io')
  })

  test('uses baseUrl parameter', () => {
    const schema = buildWebSiteSchema('https://staging.example.com')
    expect(schema.url).toBe('https://staging.example.com')
  })
})

describe('buildBreadcrumbSchema', () => {
  test('builds BreadcrumbList schema', () => {
    const schema = buildBreadcrumbSchema([
      { name: 'Home', url: 'https://rightdecisions.io/' },
      { name: 'Blog', url: 'https://rightdecisions.io/blog' },
      { name: 'My Post', url: 'https://rightdecisions.io/blog/my-post' },
    ])
    expect(schema['@type']).toBe('BreadcrumbList')
    expect(schema.itemListElement).toHaveLength(3)
    expect(schema.itemListElement[0]!.position).toBe(1)
    expect(schema.itemListElement[2]!.position).toBe(3)
  })
})
