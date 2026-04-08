import { describe, expect, test } from 'bun:test'
import { renderPage } from '@/platform/server/render'
import { LandingPage } from './landing'

// Test the landing page components directly (no env vars needed)
// The route + cookie logic is tested via the renderPage integration

describe('Landing Page', () => {
  function renderLanding(variant: 'a' | 'b' | 'c' | 'd' = 'a') {
    return renderPage(<LandingPage variant={variant} />, {
      title: 'The Right Decision — Life Decisions Course',
      description: 'A methodology + AI that turns stuck goals into clear decisions.',
    })
  }

  test('renders valid HTML document', () => {
    const html = renderLanding()
    expect(html).toStartWith('<!DOCTYPE html>')
    expect(html).toContain('<html lang="en">')
  })

  test('contains hero section with default headline', () => {
    const html = renderLanding('a')
    expect(html).toContain('transforms your life')
  })

  test('variant B renders correct headline', () => {
    const html = renderLanding('b')
    expect(html).toContain('You already know what to do')
  })

  test('variant C renders correct headline', () => {
    const html = renderLanding('c')
    expect(html).toContain('Stop preparing. Start deciding.')
  })

  test('variant D renders correct headline', () => {
    const html = renderLanding('d')
    expect(html).toContain("You don't need another course")
  })

  test('contains CTA link to checkout redirect', () => {
    const html = renderLanding()
    expect(html).toContain('/api/checkout/redirect')
  })

  test('contains problem section copy', () => {
    const html = renderLanding()
    expect(html).toContain("You've done the work")
  })

  test('contains mechanism section', () => {
    const html = renderLanding()
    expect(html).toContain('See Clearly')
    expect(html).toContain('Decide')
    expect(html).toContain('Move')
  })

  test('contains transformation section with Maria numbers', () => {
    const html = renderLanding()
    expect(html).toContain('18/50')
    expect(html).toContain('35/50')
  })

  test('contains curriculum with module titles', () => {
    const html = renderLanding()
    expect(html).toContain('The Wake-Up Call')
    expect(html).toContain('The Decision')
    expect(html).toContain('Resolution')
  })

  test('contains founder section', () => {
    const html = renderLanding()
    expect(html).toContain("I'm Henry")
  })

  test('contains honest social proof', () => {
    const html = renderLanding()
    expect(html).toContain('fake testimonials')
  })

  test('contains offer section with pricing', () => {
    const html = renderLanding()
    expect(html).toContain('$197/year')
    expect(html).toContain('7-day money-back guarantee')
  })

  test('contains FAQ section', () => {
    const html = renderLanding()
    expect(html).toContain('How long does the course take')
  })

  test('contains final CTA', () => {
    const html = renderLanding()
    expect(html).toContain('The only thing missing is the decision')
  })

  test('contains Google Fonts link', () => {
    const html = renderLanding()
    expect(html).toContain('fonts.googleapis.com')
    expect(html).toContain('Instrument')
  })

  test('contains /styles.css link', () => {
    const html = renderLanding()
    expect(html).toContain('/styles.css')
  })

  test('contains meta description', () => {
    const html = renderLanding()
    expect(html).toContain('meta name="description"')
    expect(html).toContain('stuck goals into clear decisions')
  })

  test('contains disqualification section', () => {
    const html = renderLanding()
    expect(html).toContain('This is NOT for everyone')
  })
})
