import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import { setApiFetchForTests } from '../lib/api'
import {
  errorEnvelope,
  jsonFetch,
  playbookField,
  playbookFixture,
  playbookPageFixture,
  setTestUrl,
} from '../test-fixtures'
import { PlaybookPageView } from './playbook-page'

afterEach(() => {
  cleanup()
  setApiFetchForTests(null)
})

type Routes = Record<string, unknown>

const withApi = (extra: Routes = {}) =>
  setApiFetchForTests(
    jsonFetch({
      'GET /api/playbook': { ok: true, data: playbookFixture() },
      'GET /api/playbook/tpl-1/pages/pg-where-you-are': {
        ok: true,
        data: playbookPageFixture(),
      },
      ...extra,
    }),
  )

const view = (pageId = 'pg-where-you-are') => (
  <PlaybookPageView templateId="tpl-1" pageId={pageId} />
)

describe('page: Playbook page view (one scrollable section, 640px column)', () => {
  test('loading shows calm skeletons', () => {
    setApiFetchForTests(jsonFetch({}))
    const { container } = render(view())
    expect(
      container.querySelectorAll('[class*="motion-safe:animate-pulse"]').length,
    ).toBeGreaterThan(0)
  })

  test('error explains and retries', async () => {
    withApi({
      'GET /api/playbook/tpl-1/pages/pg-where-you-are': () => errorEnvelope('NOT_FOUND', 404),
    })
    const { findByRole } = render(view())
    expect(await findByRole('alert')).toBeTruthy()
    expect(await findByRole('button', { name: 'Try again' })).toBeTruthy()
  })

  test('renders the reading column, serif heading and instruction prose leading', async () => {
    setTestUrl('/app/playbook/tpl-1/pg-where-you-are')
    withApi()
    const { findByRole, findByText, container } = render(view())
    const heading = await findByRole('heading', { level: 1, name: 'Where You Are' })
    expect(heading.className).toContain('font-display')
    expect(await findByText('Seeing Clearly')).toBeTruthy()
    expect(
      await findByText('Start with what is true right now. Plain words are enough.'),
    ).toBeTruthy()
    expect(container.querySelector('[class*="max-w-[var(--max-reading)]"]')).not.toBeNull()
  })

  test('the privacy reassurance line stays in the page shell', async () => {
    withApi()
    const { findByText } = render(view())
    expect(await findByText('Only you and your AI see this.')).toBeTruthy()
  })

  test('renders every field with a visible label', async () => {
    withApi({
      'GET /api/playbook/tpl-1/pages/pg-where-you-are': {
        ok: true,
        data: playbookPageFixture({
          page: {
            id: 'pg-where-you-are',
            title: 'Where You Are',
            instruction: 'Two questions.',
            fields: [
              playbookField('f-text', 'short_text', { label: 'One true sentence' }),
              playbookField('f-scale', 'scale_1_10', { label: 'How sure are you' }),
            ],
          },
        }),
      },
    })
    const { findByLabelText, findByRole } = render(view())
    expect(await findByLabelText('One true sentence')).toBeTruthy()
    expect(await findByRole('group', { name: 'How sure are you' })).toBeTruthy()
  })

  test('blur autosaves through PUT /answers and shows the quiet Saved', async () => {
    const puts: Array<Record<string, unknown>> = []
    withApi({
      'PUT /api/playbook/tpl-1/answers': ({ init }: { init?: RequestInit }) => {
        puts.push(JSON.parse(String(init?.body)))
        return new Response(JSON.stringify({ ok: true, data: { document: {}, progress: {} } }), {
          headers: { 'content-type': 'application/json' },
        })
      },
    })
    const { findByLabelText, findByText } = render(view())
    const input = await findByLabelText('Question one-true-thing')
    fireEvent.input(input, { target: { value: 'It is time.' } })
    fireEvent.blur(input)
    await waitFor(() => expect(puts).toEqual([{ fieldId: 'one-true-thing', value: 'It is time.' }]))
    expect(await findByText('Saved')).toBeTruthy()
  })

  test('book navigation: prev/next across the chapter boundary + back to contents', async () => {
    withApi({
      'GET /api/playbook/tpl-1/pages/pg-what-you-avoid': {
        ok: true,
        data: playbookPageFixture({
          chapter: { id: 'ch-seeing', title: 'Seeing Clearly' },
          page: { id: 'pg-what-you-avoid', title: 'What You Avoid', fields: [] },
        }),
      },
    })
    const { findByRole } = render(view('pg-what-you-avoid'))
    const prev = await findByRole('link', { name: /Where You Are/ })
    expect(prev.getAttribute('href')).toBe('/app/playbook/tpl-1/pg-where-you-are')
    const next = await findByRole('link', { name: /The Decision/ })
    expect(next.getAttribute('href')).toBe('/app/playbook/tpl-1/pg-the-decision')
    const contents = await findByRole('link', { name: 'Contents' })
    expect(contents.getAttribute('href')).toBe('/app/playbook')
  })

  test('the first page has no previous link; the last has no next', async () => {
    withApi({
      'GET /api/playbook/tpl-1/pages/pg-the-decision': {
        ok: true,
        data: playbookPageFixture({
          chapter: { id: 'ch-deciding', title: 'Deciding' },
          page: { id: 'pg-the-decision', title: 'The Decision', fields: [] },
        }),
      },
    })
    const first = render(view('pg-where-you-are'))
    await first.findByRole('heading', { level: 1, name: 'Where You Are' })
    expect(first.queryByText(/Previous/)).toBeNull()
    cleanup()

    withApi({
      'GET /api/playbook/tpl-1/pages/pg-the-decision': {
        ok: true,
        data: playbookPageFixture({
          chapter: { id: 'ch-deciding', title: 'Deciding' },
          page: { id: 'pg-the-decision', title: 'The Decision', fields: [] },
        }),
      },
    })
    const last = render(view('pg-the-decision'))
    await last.findByRole('heading', { level: 1, name: 'The Decision' })
    expect(last.queryByText(/Next/)).toBeNull()
  })
})
