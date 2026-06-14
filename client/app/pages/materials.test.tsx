import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import { setApiFetchForTests } from '../lib/api'
import { errorEnvelope, jsonFetch, materialFixture, setTestUrl } from '../test-fixtures'
import { MaterialsPage } from './materials'

afterEach(() => {
  cleanup()
  setApiFetchForTests(null)
})

describe('page: Materials', () => {
  test('loading shows pinned-height skeletons', () => {
    setApiFetchForTests(jsonFetch({}))
    const { container } = render(<MaterialsPage />)
    expect(container.querySelectorAll('[class*="motion-safe:animate-pulse"]').length).toBe(3)
  })

  test('error explains and retries', async () => {
    setApiFetchForTests(
      jsonFetch({ 'GET /api/materials': () => errorEnvelope('INTERNAL_ERROR', 500) }),
    )
    const { findByRole } = render(<MaterialsPage />)
    expect(await findByRole('alert')).toBeTruthy()
    expect(await findByRole('button', { name: 'Try again' })).toBeTruthy()
  })

  test('empty state is warm with a way home', async () => {
    setTestUrl('/app/materials')
    setApiFetchForTests(jsonFetch({ 'GET /api/materials': { ok: true, data: { materials: [] } } }))
    const { findByText } = render(<MaterialsPage />)
    expect(await findByText('Nothing to download yet')).toBeTruthy()
  })

  test('lists materials with title, description and human size', async () => {
    setApiFetchForTests(
      jsonFetch({
        'GET /api/materials': { ok: true, data: { materials: [materialFixture('m1')] } },
      }),
    )
    const { findByText } = render(<MaterialsPage />)
    expect(await findByText('Workbook m1')).toBeTruthy()
    expect(await findByText('1.2 MB')).toBeTruthy()
  })

  test('download fetches a signed URL per click and opens it', async () => {
    const opened: string[] = []
    setApiFetchForTests(
      jsonFetch({
        'GET /api/materials': { ok: true, data: { materials: [materialFixture('m1')] } },
        'GET /api/materials/m1/download-url': {
          ok: true,
          data: {
            url: 'https://r2.example.com/signed/workbook.pdf',
            title: 'W',
            mimeType: 'application/pdf',
          },
        },
      }),
    )
    const { findByRole } = render(<MaterialsPage openUrl={(url) => opened.push(url)} />)
    fireEvent.click(await findByRole('button', { name: 'Download' }))
    await waitFor(() => expect(opened).toEqual(['https://r2.example.com/signed/workbook.pdf']))
  })

  test('failed signing shows a what/why/how message and stays retryable', async () => {
    setApiFetchForTests(
      jsonFetch({
        'GET /api/materials': { ok: true, data: { materials: [materialFixture('m1')] } },
        'GET /api/materials/m1/download-url': () => errorEnvelope('ENROLLMENT_REQUIRED', 403),
      }),
    )
    const { findByRole } = render(<MaterialsPage openUrl={() => {}} />)
    fireEvent.click(await findByRole('button', { name: 'Download' }))
    expect(await findByRole('alert')).toBeTruthy()
    expect(await findByRole('button', { name: 'Download' })).toBeTruthy()
  })
})
