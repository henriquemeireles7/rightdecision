import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, render } from '@testing-library/preact'
import { setApiFetchForTests } from '../lib/api'
import {
  errorEnvelope,
  jsonFetch,
  playbookDocumentFixture,
  playbookFixture,
  setTestUrl,
} from '../test-fixtures'
import { PlaybookPage } from './playbook'

afterEach(() => {
  cleanup()
  setApiFetchForTests(null)
})

const ready = (data: unknown = playbookFixture()) =>
  setApiFetchForTests(jsonFetch({ 'GET /api/playbook': { ok: true, data } }))

describe('page: Playbook contents (the book spine)', () => {
  test('loading shows calm skeletons', () => {
    setApiFetchForTests(jsonFetch({}))
    const { container } = render(<PlaybookPage />)
    expect(
      container.querySelectorAll('[class*="motion-safe:animate-pulse"]').length,
    ).toBeGreaterThan(0)
  })

  test('error explains and retries', async () => {
    setApiFetchForTests(
      jsonFetch({ 'GET /api/playbook': () => errorEnvelope('INTERNAL_ERROR', 500) }),
    )
    const { findByRole } = render(<PlaybookPage />)
    expect(await findByRole('alert')).toBeTruthy()
    expect(await findByRole('button', { name: 'Try again' })).toBeTruthy()
  })

  test('no documents yet is a warm invitation, not a dead end', async () => {
    setTestUrl('/app/playbook')
    ready({ documents: [] })
    const { findByText, findByRole } = render(<PlaybookPage />)
    expect(await findByText('Your playbook is on its way')).toBeTruthy()
    expect(await findByRole('link', { name: 'Back to Home' })).toBeTruthy()
  })

  test('renders the book title in serif with chapters and page links', async () => {
    setTestUrl('/app/playbook')
    ready()
    const { findByRole, findByText } = render(<PlaybookPage />)
    const title = await findByRole('heading', { name: 'Starter Notebook' })
    expect(title.className).toContain('font-display')
    expect(await findByText('Seeing Clearly')).toBeTruthy()
    expect(await findByText('Deciding')).toBeTruthy()
    const pageLink = await findByRole('link', { name: /Where You Are/ })
    expect(pageLink.getAttribute('href')).toBe('/app/playbook/tpl-1/pg-where-you-are')
  })

  test('progress is quiet numerals — NO progress bars, NO percentages', async () => {
    ready()
    const { findByText, container, queryByRole } = render(<PlaybookPage />)
    expect(await findByText('3 of 3')).toBeTruthy()
    expect(await findByText('0 of 2')).toBeTruthy()
    expect(queryByRole('progressbar')).toBeNull()
    expect(container.querySelector('progress')).toBeNull()
    expect(container.textContent).not.toContain('%')
  })

  test('the privacy reassurance line is in the shell', async () => {
    ready()
    const { findByText } = render(<PlaybookPage />)
    expect(await findByText('Only you and your AI see this.')).toBeTruthy()
  })

  test('Export / Print opens the export HTML in a new tab', async () => {
    ready()
    const { findByRole } = render(<PlaybookPage />)
    const link = await findByRole('link', { name: 'Export / Print' })
    expect(link.getAttribute('href')).toBe('/api/playbook/tpl-1/export')
    expect(link.getAttribute('target')).toBe('_blank')
  })

  test('renders BOTH books when the member has two documents', async () => {
    ready(
      playbookFixture({
        documents: [
          playbookDocumentFixture(),
          playbookDocumentFixture({
            templateId: 'tpl-2',
            slug: 'life-playbook',
            title: 'Life Playbook',
          }),
        ],
      }),
    )
    const { findByRole } = render(<PlaybookPage />)
    expect(await findByRole('heading', { name: 'Starter Notebook' })).toBeTruthy()
    expect(await findByRole('heading', { name: 'Life Playbook' })).toBeTruthy()
  })
})
