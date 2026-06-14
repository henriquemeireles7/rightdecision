import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render } from '@testing-library/preact'
import { lockedProgram, setTestUrl, unlockedProgram } from '../test-fixtures'
import { ContinueCard, PillBadge, PosterCard } from './cards'
import { PreviewSheet } from './preview-sheet'
import { Rail, RailItem } from './rail'
import { EmptyState, ErrorState, RailSkeleton, Skeleton } from './states'

afterEach(cleanup)

describe('component: states', () => {
  test('skeleton pulses only under motion-safe and pins its aspect', () => {
    const { container } = render(<Skeleton class="aspect-[2/3]" />)
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toContain('motion-safe:animate-pulse')
    expect(el.className).not.toMatch(/(^| )animate-pulse/)
    expect(el.className).toContain('aspect-[2/3]')
    expect(el.className).toContain('bg-sand')
  })

  test('rail skeleton renders poster-shaped placeholders', () => {
    const { container } = render(<RailSkeleton />)
    expect(container.querySelectorAll('[class*="aspect-"]').length).toBeGreaterThanOrEqual(4)
  })

  test('empty state carries warm copy and the primary action', () => {
    const { getByRole, getByText } = render(
      <EmptyState title="Nothing yet" body="It is coming." action={<a href="/app">Go home</a>} />,
    )
    expect(getByText('Nothing yet')).toBeTruthy()
    expect(getByRole('link', { name: 'Go home' })).toBeTruthy()
  })

  test('error state explains what/why/how and retries', () => {
    let retried = 0
    const { getByRole, getByText } = render(
      <ErrorState what="We couldn't load this" onRetry={() => retried++} />,
    )
    expect(getByRole('alert')).toBeTruthy()
    expect(getByText(/connection may have dropped/)).toBeTruthy()
    fireEvent.click(getByRole('button', { name: 'Try again' }))
    expect(retried).toBe(1)
  })

  test('gold contrast rule: buttons on gold use ink text, never white', () => {
    const { getByRole } = render(<ErrorState what="x" onRetry={() => {}} />)
    const button = getByRole('button', { name: 'Try again' })
    expect(button.className).toContain('bg-gold')
    expect(button.className).toContain('text-ink')
    expect(button.className).not.toContain('text-white')
  })
})

describe('component: cards', () => {
  test('pill badge is ink-on-cream', () => {
    const { getByText } = render(<PillBadge label="Full program" />)
    const pill = getByText('Full program')
    expect(pill.className).toContain('bg-cream')
    expect(pill.className).toContain('text-ink')
  })

  test('poster card: 2:3 cover, linen border, serif title BELOW (not overlaid)', () => {
    const { getByRole } = render(
      <PosterCard title="Seeing Clearly" coverImageKey="covers/m.png" onOpen={() => {}} />,
    )
    const button = getByRole('button')
    const cover = button.querySelector('[class*="aspect-[2/3]"]') as HTMLElement
    expect(cover.className).toContain('border-linen')
    expect(cover.querySelector('img')?.getAttribute('src')).toBe('/app/media/covers/m.png')
    const title = getByRole('button').querySelector('span.mt-2') as HTMLElement
    expect(title.textContent).toBe('Seeing Clearly')
    expect(title.className).toContain('font-display')
    expect(title.className).toContain('text-ink')
    expect(cover.contains(title)).toBe(false)
  })

  test('locked poster keeps the full-color cover (no grayscale/blur classes)', () => {
    const { getByRole } = render(
      <PosterCard title="X" coverImageKey="covers/x.png" badge="Full program" onOpen={() => {}} />,
    )
    expect(getByRole('button').innerHTML).not.toMatch(/grayscale|blur/)
    expect(getByRole('button').textContent).toContain('Full program')
  })

  test('poster hover is gold border + shadow, never zoom', () => {
    const { getByRole } = render(<PosterCard title="X" coverImageKey={null} onOpen={() => {}} />)
    const html = getByRole('button').outerHTML
    expect(html).toContain('group-hover:shadow-md')
    expect(html).toContain('group-hover:border-gold')
    expect(html).not.toMatch(/hover:scale|group-hover:scale/)
  })

  test('missing cover renders the warm placeholder, not a broken image', () => {
    const { getByRole } = render(
      <PosterCard title="Module" coverImageKey={null} onOpen={() => {}} />,
    )
    expect(getByRole('button').querySelector('img')).toBeNull()
    expect(getByRole('button').textContent).toContain('M')
  })

  test('continue card is 16:9 with a gold resume bar sized to progress', () => {
    setTestUrl('/app')
    const { getByRole } = render(
      <ContinueCard
        title="Lesson"
        thumbnailKey="thumbs/a.png"
        secondsWatched={120}
        durationSeconds={600}
        href="/app/lessons/a"
      />,
    )
    const link = getByRole('link')
    expect(link.querySelector('[class*="aspect-video"]')).toBeTruthy()
    const bar = link.querySelector('.bg-gold') as HTMLElement
    expect(bar.getAttribute('style')).toContain('20%')
  })
})

describe('component: rail', () => {
  test('semantic section with a real h2 heading and a snap scroller', () => {
    const { getByRole, container } = render(
      <Rail heading="Continue watching">
        <RailItem>
          <span>card</span>
        </RailItem>
      </Rail>,
    )
    const heading = getByRole('heading', { level: 2, name: 'Continue watching' })
    expect(heading.className).toContain('font-display')
    const scroller = container.querySelector('ul') as HTMLElement
    expect(scroller.className).toContain('snap-x')
    expect(scroller.className).toContain('overflow-x-auto')
    expect(container.querySelector('section')?.getAttribute('aria-labelledby')).toBe(heading.id)
  })

  test('desktop arrows exist and never auto-scroll markup appears', () => {
    const { getByRole, container } = render(
      <Rail heading="Lives">
        <RailItem>x</RailItem>
      </Rail>,
    )
    expect(getByRole('button', { name: 'Scroll Lives back' })).toBeTruthy()
    expect(getByRole('button', { name: 'Scroll Lives forward' })).toBeTruthy()
    expect(container.innerHTML).not.toMatch(/marquee|autoplay|animation-/)
  })
})

describe('component: preview sheet', () => {
  const lockedModule = lockedProgram().courses[0]!.modules[0]!

  test('locked module: description, lesson titles, upgrade CTA to checkout', () => {
    const { getByRole, getByText } = render(
      <PreviewSheet module={lockedModule} locked onClose={() => {}} />,
    )
    expect(getByText('The Decision Audit')).toBeTruthy()
    expect(getByText('What you have been avoiding.')).toBeTruthy()
    expect(getByText('Naming the real decision')).toBeTruthy()
    expect(getByText('The cost of waiting')).toBeTruthy()
    const cta = getByRole('link', { name: 'Unlock the full program' })
    expect(cta.getAttribute('href')).toBe('/api/checkout/redirect')
    expect(cta.className).toContain('text-ink') // gold contrast rule
  })

  test('locked lessons are titles only — never links to lessons', () => {
    const { container } = render(<PreviewSheet module={lockedModule} locked onClose={() => {}} />)
    expect(container.querySelector('a[href^="/app/lessons/"]')).toBeNull()
  })

  test('unlocked module: lessons link to the player; processing lessons are marked', () => {
    setTestUrl('/app')
    const unlockedModule = unlockedProgram().courses[0]!.modules[0]!
    const { container, getByText, queryByRole } = render(
      <PreviewSheet module={unlockedModule} locked={false} onClose={() => {}} />,
    )
    expect(container.querySelector('a[href="/app/lessons/lesson-1"]')).toBeTruthy()
    expect(getByText('Processing')).toBeTruthy()
    expect(container.querySelector('a[href="/app/lessons/lesson-3"]')).toBeNull()
    expect(queryByRole('link', { name: 'Unlock the full program' })).toBeNull()
  })

  test('close button fires onClose', () => {
    let closed = 0
    const { getByRole } = render(
      <PreviewSheet module={lockedModule} locked onClose={() => closed++} />,
    )
    fireEvent.click(getByRole('button', { name: 'Close preview' }))
    expect(closed).toBe(1)
  })
})
