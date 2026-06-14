import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import { setApiFetchForTests } from '../lib/api'
import { todayLocalDate } from '../lib/format'
import {
  EVENING_PROMPT_FIXTURE,
  errorEnvelope,
  journalEntryFixture,
  journalFixture,
  jsonFetch,
  MORNING_PROMPT_FIXTURE,
  setTestUrl,
} from '../test-fixtures'
import { JournalPage } from './journal'

afterEach(() => {
  cleanup()
  setApiFetchForTests(null)
})

const ready = (data: unknown = journalFixture()) =>
  setApiFetchForTests(jsonFetch({ 'GET /api/journal': { ok: true, data } }))

describe('page: Journal', () => {
  test('loading shows calm skeletons', () => {
    setApiFetchForTests(jsonFetch({}))
    const { container } = render(<JournalPage />)
    expect(
      container.querySelectorAll('[class*="motion-safe:animate-pulse"]').length,
    ).toBeGreaterThan(0)
  })

  test('error explains and retries', async () => {
    setApiFetchForTests(
      jsonFetch({ 'GET /api/journal': () => errorEnvelope('INTERNAL_ERROR', 500) }),
    )
    const { findByRole } = render(<JournalPage />)
    expect(await findByRole('alert')).toBeTruthy()
    expect(await findByRole('button', { name: 'Try again' })).toBeTruthy()
  })

  test("today's morning and evening cards carry the API prompts and labeled textareas", async () => {
    setTestUrl('/app/journal')
    ready()
    const { findByText, findByLabelText } = render(<JournalPage />)
    expect(await findByText(MORNING_PROMPT_FIXTURE)).toBeTruthy()
    expect(await findByText(EVENING_PROMPT_FIXTURE)).toBeTruthy()
    expect(((await findByLabelText('Morning')) as HTMLElement).tagName).toBe('TEXTAREA')
    expect(((await findByLabelText('Evening')) as HTMLElement).tagName).toBe('TEXTAREA')
  })

  test('the counts line is cumulative — and NO streaks, flames or shame anywhere', async () => {
    ready()
    const { findByText, container } = render(<JournalPage />)
    expect(await findByText('47 mornings · 31 evenings · 52 days')).toBeTruthy()
    expect(container.textContent).not.toMatch(/streak/i)
    expect(container.textContent).not.toContain('🔥')
    expect(container.textContent).not.toMatch(/don't break|keep it up|missed/i)
  })

  test("blur saves today's morning entry with the CLIENT-computed local entryDate", async () => {
    const puts: Array<Record<string, unknown>> = []
    setApiFetchForTests(
      jsonFetch({
        'GET /api/journal': { ok: true, data: journalFixture() },
        'PUT /api/journal/entries': ({ init }: { init?: RequestInit }) => {
          const body = JSON.parse(String(init?.body))
          puts.push(body)
          return new Response(JSON.stringify({ ok: true, data: { entry: body, created: true } }), {
            headers: { 'content-type': 'application/json' },
          })
        },
      }),
    )
    const { findByLabelText, findByText } = render(<JournalPage />)
    const morning = await findByLabelText('Morning')
    fireEvent.input(morning, { target: { value: 'Today I decide to call.' } })
    fireEvent.blur(morning)
    await waitFor(() =>
      expect(puts).toEqual([
        { entryDate: todayLocalDate(), kind: 'morning', content: 'Today I decide to call.' },
      ]),
    )
    expect(await findByText('Saved')).toBeTruthy()
  })

  test("today's existing entries prefill their cards for free editing", async () => {
    const today = todayLocalDate()
    ready(
      journalFixture({
        entries: [journalEntryFixture(today, 'morning', { content: 'Already wrote this.' })],
      }),
    )
    const { findByLabelText } = render(<JournalPage />)
    const morning = (await findByLabelText('Morning')) as HTMLTextAreaElement
    expect(morning.value).toBe('Already wrote this.')
  })

  test('history groups past days, most recent first, and excludes today', async () => {
    const today = todayLocalDate()
    ready(
      journalFixture({
        entries: [
          journalEntryFixture(today, 'morning', { content: 'Today words.' }),
          journalEntryFixture('2026-06-10', 'morning', { content: 'June ten morning.' }),
          journalEntryFixture('2026-06-10', 'evening', { content: 'June ten evening.' }),
          journalEntryFixture('2026-06-08', 'evening', { content: 'June eight evening.' }),
        ],
      }),
    )
    const { findByText, queryAllByText, container } = render(<JournalPage />)
    await findByText('June ten morning.')
    expect(await findByText('June ten evening.')).toBeTruthy()
    expect(await findByText('June eight evening.')).toBeTruthy()
    // today's content lives in the editable card only, not duplicated in history
    expect(queryAllByText('Today words.').length).toBe(0)
    const text = container.textContent ?? ''
    expect(text.indexOf('June ten morning.')).toBeLessThan(text.indexOf('June eight evening.'))
  })

  test('history is range-paged — Show earlier asks for an earlier from date', async () => {
    const froms: Array<string | null> = []
    setApiFetchForTests(
      jsonFetch({
        'GET /api/journal': ({ url }: { url: URL }) => {
          froms.push(url.searchParams.get('from'))
          return new Response(JSON.stringify({ ok: true, data: journalFixture() }), {
            headers: { 'content-type': 'application/json' },
          })
        },
      }),
    )
    const { findByRole } = render(<JournalPage />)
    fireEvent.click(await findByRole('button', { name: 'Show earlier entries' }))
    await waitFor(() => expect(froms.length).toBe(2))
    expect(froms[0]).toBeTruthy()
    expect(froms[1]).toBeTruthy()
    expect(String(froms[1]) < String(froms[0])).toBe(true)
  })

  test('an empty history is an invitation, never a guilt trip', async () => {
    ready(
      journalFixture({
        counts: { totalMornings: 0, totalEvenings: 0, totalDaysJournaled: 0 },
      }),
    )
    const { findByText, container } = render(<JournalPage />)
    expect(await findByText('0 mornings · 0 evenings · 0 days')).toBeTruthy()
    expect(await findByText(/first entry/i)).toBeTruthy()
    expect(container.textContent).not.toMatch(/streak|behind|missed/i)
  })
})
