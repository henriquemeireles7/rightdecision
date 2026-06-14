import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  ListSkeleton,
  mediaUrl,
  StatusChip,
  useLoad,
} from './ui'

afterEach(cleanup)

describe('client/admin ui: ListSkeleton', () => {
  test('announces loading to assistive tech and renders placeholder rows', () => {
    const { container } = render(<ListSkeleton rows={3} />)
    const region = container.querySelector('[aria-busy="true"]')
    expect(region).not.toBeNull()
    expect(region?.querySelectorAll('[data-skeleton-row]').length).toBe(3)
  })
})

describe('client/admin ui: EmptyState', () => {
  test('shows warm copy and a primary action', () => {
    let clicked = 0
    const { getByRole, getByText } = render(
      <EmptyState
        title="No courses yet"
        body="Courses hold your modules and lessons."
        actionLabel="Create your first course"
        onAction={() => {
          clicked += 1
        }}
      />,
    )
    expect(getByText('No courses yet')).toBeTruthy()
    fireEvent.click(getByRole('button', { name: 'Create your first course' }))
    expect(clicked).toBe(1)
  })
})

describe('client/admin ui: ErrorState', () => {
  test('explains what happened and offers retry', () => {
    let retried = 0
    const { getByRole, getByText } = render(
      <ErrorState
        message="We couldn't load your courses."
        detail="The server said: timeout"
        onRetry={() => {
          retried += 1
        }}
      />,
    )
    expect(getByText("We couldn't load your courses.")).toBeTruthy()
    expect(getByText('The server said: timeout')).toBeTruthy()
    fireEvent.click(getByRole('button', { name: 'Try again' }))
    expect(retried).toBe(1)
  })
})

describe('client/admin ui: StatusChip', () => {
  test.each([
    ['draft', 'Draft'],
    ['uploading', 'Uploading'],
    ['processing', 'Processing'],
    ['ready', 'Ready'],
    ['error', 'Error'],
    ['published', 'Published'],
  ] as const)('renders a text label for %s (never color alone)', (status, label) => {
    const { getByText } = render(<StatusChip status={status} />)
    expect(getByText(label)).toBeTruthy()
  })
})

describe('client/admin ui: ConfirmDialog', () => {
  test('renders a native dialog with confirm and cancel', () => {
    let confirmed = 0
    let cancelled = 0
    const { getByRole, container } = render(
      <ConfirmDialog
        title="Cancel this live?"
        body="Members keep the replay protocol."
        confirmLabel="Cancel the live"
        cancelLabel="Keep it"
        onConfirm={() => {
          confirmed += 1
        }}
        onCancel={() => {
          cancelled += 1
        }}
      />,
    )
    expect(container.querySelector('dialog[open]')).not.toBeNull()
    fireEvent.click(getByRole('button', { name: 'Keep it' }))
    expect(cancelled).toBe(1)
    fireEvent.click(getByRole('button', { name: 'Cancel the live' }))
    expect(confirmed).toBe(1)
  })
})

describe('client/admin ui: mediaUrl', () => {
  test('maps an R2 key to the gated /admin/media path', () => {
    expect(mediaUrl('covers/candidates/module/m-1/x.png')).toBe(
      '/admin/media/covers/candidates/module/m-1/x.png',
    )
  })
})

describe('client/admin ui: useLoad', () => {
  function Probe({ load }: { load: () => Promise<{ value: string }> }) {
    const { state, reload } = useLoad(load, [])
    if (state.status === 'loading') return <p>loading…</p>
    if (state.status === 'error')
      return (
        <button type="button" onClick={reload}>
          retry: {state.message}
        </button>
      )
    return <p>value: {state.data.value}</p>
  }

  test('loading → ready', async () => {
    const { getByText, findByText } = render(<Probe load={async () => ({ value: 'ok' })} />)
    expect(getByText('loading…')).toBeTruthy()
    expect(await findByText('value: ok')).toBeTruthy()
  })

  test('loading → error → retry → ready', async () => {
    let attempt = 0
    const load = async () => {
      attempt += 1
      if (attempt === 1) throw new Error('nope')
      return { value: 'second try' }
    }
    const { findByRole, findByText } = render(<Probe load={load} />)
    const retry = await findByRole('button')
    expect(retry.textContent).toContain('nope')
    fireEvent.click(retry)
    await waitFor(async () => expect(await findByText('value: second try')).toBeTruthy())
  })
})
