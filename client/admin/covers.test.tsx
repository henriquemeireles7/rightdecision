import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import { CoverSection } from './covers'
import type { AdminData } from './data'
import { DataContext } from './data'
import { makeData } from './test-fixtures'

afterEach(cleanup)

const CANDIDATES = [
  'covers/candidates/module/m-1/a.png',
  'covers/candidates/module/m-1/b.png',
  'covers/candidates/module/m-1/c.png',
  'covers/candidates/module/m-1/d.png',
]

function renderSection(
  data: AdminData,
  options: { currentKey?: string | null; onPicked?: (key: string) => void } = {},
) {
  return render(
    <DataContext.Provider value={data}>
      <CoverSection
        kind="module"
        targetId="m-1"
        targetTitle="Boundaries"
        currentKey={options.currentKey ?? null}
        siblings={[
          { id: 'm-2', title: 'Clarity', key: 'covers/picked/clarity.png' },
          { id: 'm-3', title: 'Grief', key: 'covers/picked/grief.png' },
          { id: 'm-4', title: 'Money', key: null },
        ]}
        onPicked={options.onPicked ?? (() => {})}
      />
    </DataContext.Provider>,
  )
}

describe('component: CoverSection', () => {
  test('no cover yet → placeholder copy + generate button with prefilled subject', () => {
    const { container, getByRole, getByLabelText } = renderSection(makeData())
    expect(container.textContent).toContain('No cover yet')
    expect((getByLabelText('Cover subject') as HTMLInputElement).value).toBe('Boundaries')
    expect(getByRole('button', { name: 'Generate covers' })).toBeTruthy()
  })

  test('existing cover renders through the gated media route', () => {
    const { container } = renderSection(makeData(), { currentKey: 'covers/picked/current.png' })
    const img = container.querySelector('img[alt="Current cover"]')
    expect(img?.getAttribute('src')).toBe('/admin/media/covers/picked/current.png')
  })

  test('generation shows a slow-operation loading state with 4 pinned placeholder tiles', async () => {
    let resolve: (v: {
      candidates: string[]
      aspect: '2:3' | '16:9'
      promptVersion: string
    }) => void = () => {}
    const data = makeData({
      generateCovers: () =>
        new Promise((r) => {
          resolve = r
        }),
    })
    const { container, getByRole, findByText } = renderSection(data)
    fireEvent.click(getByRole('button', { name: 'Generate covers' }))
    expect(await findByText(/Generating 4 covers/i)).toBeTruthy()
    expect(container.querySelectorAll('[data-skeleton-tile]').length).toBe(4)
    expect(container.textContent).toMatch(/minute/i)
    resolve({ candidates: CANDIDATES, aspect: '2:3', promptVersion: 'v1' })
    await waitFor(() => expect(container.querySelectorAll('img[alt^="Candidate"]').length).toBe(4))
  })

  test('picker renders the 4 candidates ALONGSIDE existing sibling covers (in context)', async () => {
    const calls: Array<{ kind: string; id: string; subject: string }> = []
    const data = makeData({
      generateCovers: async (input) => {
        calls.push(input)
        return { candidates: CANDIDATES, aspect: '2:3' as const, promptVersion: 'v1' }
      },
    })
    const { container, getByRole, findByText } = renderSection(data)
    fireEvent.click(getByRole('button', { name: 'Generate covers' }))
    await findByText(/pick the one/i)
    expect(calls).toEqual([{ kind: 'module', id: 'm-1', subject: 'Boundaries' }])

    const picker = container.querySelector('[data-cover-picker]')
    if (!picker) throw new Error('No picker region rendered')
    // 4 candidates…
    expect(picker.querySelectorAll('img[alt^="Candidate"]').length).toBe(4)
    // …next to the siblings that already have covers, labelled by module title
    expect(picker.querySelector('img[alt="Clarity"]')?.getAttribute('src')).toBe(
      '/admin/media/covers/picked/clarity.png',
    )
    expect(picker.querySelector('img[alt="Grief"]')).not.toBeNull()
    // siblings without covers show a placeholder, not a broken image
    expect(picker.textContent).toContain('Money')
    expect(picker.querySelector('img[alt="Money"]')).toBeNull()
  })

  test('generation failure → what/why/how-to-fix + retry calls the API again', async () => {
    let attempts = 0
    const data = makeData({
      generateCovers: async () => {
        attempts += 1
        if (attempts === 1) throw new Error('image service unavailable')
        return { candidates: CANDIDATES, aspect: '2:3' as const, promptVersion: 'v1' }
      },
    })
    const { container, getByRole, findByRole } = renderSection(data)
    fireEvent.click(getByRole('button', { name: 'Generate covers' }))
    const alert = await findByRole('alert')
    expect(alert.textContent).toContain("couldn't generate covers")
    expect(alert.textContent).toContain('image service unavailable')
    fireEvent.click(getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(container.querySelectorAll('img[alt^="Candidate"]').length).toBe(4))
    expect(attempts).toBe(2)
  })

  test('selecting a candidate and confirming persists the pick', async () => {
    const picks: Array<{ kind: string; id: string; key: string }> = []
    const pickedKeys: string[] = []
    const data = makeData({
      generateCovers: async () => ({
        candidates: CANDIDATES,
        aspect: '2:3' as const,
        promptVersion: 'v1',
      }),
      pickCover: async (input) => {
        picks.push(input)
        return { coverImageKey: input.key }
      },
    })
    const { getByRole, findByText, findByRole } = renderSection(data, {
      onPicked: (key) => {
        pickedKeys.push(key)
      },
    })
    fireEvent.click(getByRole('button', { name: 'Generate covers' }))
    await findByText(/pick the one/i)
    // confirm is disabled until a candidate is chosen
    const confirm = getByRole('button', { name: 'Use this cover' }) as HTMLButtonElement
    expect(confirm.disabled).toBe(true)
    fireEvent.click(await findByRole('button', { name: 'Candidate 2' }))
    expect(confirm.disabled).toBe(false)
    fireEvent.click(confirm)
    await findByText('Cover saved.')
    expect(picks).toEqual([{ kind: 'module', id: 'm-1', key: CANDIDATES[1] as string }])
    expect(pickedKeys).toEqual([CANDIDATES[1] as string])
  })

  test('pick failure keeps the picker open with a retryable error', async () => {
    const data = makeData({
      generateCovers: async () => ({
        candidates: CANDIDATES,
        aspect: '2:3' as const,
        promptVersion: 'v1',
      }),
      pickCover: async () => {
        throw new Error('R2 write failed')
      },
    })
    const { container, getByRole, findByText, findByRole } = renderSection(data)
    fireEvent.click(getByRole('button', { name: 'Generate covers' }))
    await findByText(/pick the one/i)
    fireEvent.click(await findByRole('button', { name: 'Candidate 1' }))
    fireEvent.click(getByRole('button', { name: 'Use this cover' }))
    const alert = await findByRole('alert')
    expect(alert.textContent).toContain("couldn't save")
    expect(alert.textContent).toContain('R2 write failed')
    // picker still open — she can retry without regenerating
    expect(container.querySelectorAll('img[alt^="Candidate"]').length).toBe(4)
  })
})
