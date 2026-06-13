import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import type { JSX } from 'preact'
import { ApiError } from '@/features/(shared)/api-client'
import type { AdminData } from './data'
import { DataContext } from './data'
import { deriveLiveState, LivesScreen } from './lives'
import { makeData, makeLive, makeProgram } from './test-fixtures'
import { type Uploader, UploaderContext, type UploadHandlers } from './uploader'

afterEach(cleanup)

const NOW = new Date('2026-06-13T12:00:00.000Z')

function withData(data: AdminData, ui: JSX.Element, uploader?: Uploader) {
  const noUploader: Uploader = {
    upload: () => {
      throw new Error('uploader not scripted')
    },
  }
  return render(
    <DataContext.Provider value={data}>
      <UploaderContext.Provider value={uploader ?? noUploader}>{ui}</UploaderContext.Provider>
    </DataContext.Provider>,
  )
}

describe('client/admin lives: deriveLiveState', () => {
  test('cancellation wins over everything', () => {
    expect(
      deriveLiveState(
        makeLive({ cancelledAt: '2026-06-01T00:00:00.000Z', replayStatus: 'ready' }),
        NOW,
      ),
    ).toBe('cancelled')
  })
  test('future → upcoming', () => {
    expect(deriveLiveState(makeLive({ scheduledAt: '2026-06-20T17:00:00.000Z' }), NOW)).toBe(
      'upcoming',
    )
  })
  test('past without replay → awaiting replay', () => {
    expect(deriveLiveState(makeLive({ scheduledAt: '2026-06-01T17:00:00.000Z' }), NOW)).toBe(
      'awaiting replay',
    )
  })
  test('replay pipeline states derive from replayStatus', () => {
    expect(
      deriveLiveState(
        makeLive({ scheduledAt: '2026-06-01T17:00:00.000Z', replayStatus: 'processing' }),
        NOW,
      ),
    ).toBe('replay processing')
    expect(
      deriveLiveState(
        makeLive({ scheduledAt: '2026-06-01T17:00:00.000Z', replayStatus: 'ready' }),
        NOW,
      ),
    ).toBe('replay ready')
  })
})

function baseData(overrides: Partial<AdminData> = {}) {
  return makeData({
    listPrograms: async () => ({ programs: [makeProgram()] }),
    listLives: async () => ({
      lives: [
        makeLive({ id: 'lv-up', title: 'July Live', scheduledAt: '2026-07-18T17:00:00.000Z' }),
        makeLive({ id: 'lv-past', title: 'May Live', scheduledAt: '2026-05-16T17:00:00.000Z' }),
      ],
    }),
    ...overrides,
  })
}

describe('screen: LivesScreen', () => {
  test('renders lives with derived state chips', async () => {
    const { findByText } = withData(baseData(), <LivesScreen now={NOW} />)
    expect(await findByText('July Live')).toBeTruthy()
    expect(await findByText('Upcoming')).toBeTruthy()
    expect(await findByText('Awaiting replay')).toBeTruthy()
  })

  test('schedule form converts the local datetime to an ISO instant', async () => {
    const scheduled: Array<Record<string, unknown>> = []
    const data = baseData({
      scheduleLive: async (json) => {
        scheduled.push(json)
        return {
          live: makeLive({ id: 'lv-new', title: json.title, scheduledAt: json.scheduledAt }),
        }
      },
    })
    const { findByLabelText, findByRole, findByText } = withData(data, <LivesScreen now={NOW} />)
    fireEvent.input(await findByLabelText('Live title'), { target: { value: 'August AMA' } })
    fireEvent.input(await findByLabelText('Scheduled at'), {
      target: { value: '2026-08-15T18:30' },
    })
    fireEvent.input(await findByLabelText('YouTube URL'), {
      target: { value: 'https://youtube.com/live/xyz' },
    })
    fireEvent.click(await findByRole('button', { name: 'Schedule live' }))
    await waitFor(() => expect(scheduled.length).toBe(1))
    expect(scheduled[0]?.scheduledAt).toBe(new Date('2026-08-15T18:30').toISOString())
    expect(scheduled[0]?.youtubeUrl).toBe('https://youtube.com/live/xyz')
    expect(await findByText('August AMA')).toBeTruthy()
  })

  test('cancel asks for confirmation with the replays-month-protocol wording', async () => {
    const cancelled: string[] = []
    const data = baseData({
      cancelLive: async (id) => {
        cancelled.push(id)
        return { live: makeLive({ id, cancelledAt: NOW.toISOString() }) }
      },
    })
    const { findByRole, findByText } = withData(data, <LivesScreen now={NOW} />)
    fireEvent.click(await findByRole('button', { name: 'Cancel July Live' }))
    expect(await findByText(/replays month protocol/i)).toBeTruthy()
    fireEvent.click(await findByRole('button', { name: 'Cancel the live' }))
    await waitFor(() => expect(cancelled).toEqual(['lv-up']))
    expect(await findByText('Cancelled')).toBeTruthy()
  })

  test('keeping the live dismisses the dialog without calling the API', async () => {
    const data = baseData()
    const { container, findByRole } = withData(data, <LivesScreen now={NOW} />)
    fireEvent.click(await findByRole('button', { name: 'Cancel July Live' }))
    fireEvent.click(await findByRole('button', { name: 'Keep it' }))
    await waitFor(() => expect(container.querySelector('dialog')).toBeNull())
  })

  test('replay upload: requests a tus URL with the file size, success → replay processing', async () => {
    const uploads: Array<{ file: File; url: string; handlers: UploadHandlers }> = []
    const uploader: Uploader = {
      upload(file, url, handlers) {
        uploads.push({ file, url, handlers })
        return { pause: () => {}, resume: () => {}, abort: () => {} }
      },
    }
    const requested: Array<[string, number]> = []
    const data = baseData({
      requestReplayUploadUrl: async (id, bytes) => {
        requested.push([id, bytes])
        return { uploadUrl: 'https://stream.example/replay-upload', streamVideoId: 'sv-replay' }
      },
    })
    const { container, findByText } = withData(data, <LivesScreen now={NOW} />, uploader)
    await findByText('May Live')
    const input = container.querySelector('li[data-live-id="lv-past"] input[type="file"]')
    if (!input) throw new Error('No replay file input for the past live')
    const file = new File(['replay-bytes'], 'replay.mp4', { type: 'video/mp4' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    fireEvent.change(input)
    await waitFor(() => expect(uploads.length).toBe(1))
    expect(requested).toEqual([['lv-past', 12]])
    expect(uploads[0]?.url).toBe('https://stream.example/replay-upload')
    act(() => uploads[0]?.handlers.onSuccess())
    expect(await findByText('Replay processing')).toBeTruthy()
  })

  test('upcoming and cancelled lives offer no replay upload', async () => {
    const data = baseData({
      listLives: async () => ({
        lives: [
          makeLive({ id: 'lv-up', title: 'July Live', scheduledAt: '2026-07-18T17:00:00.000Z' }),
          makeLive({
            id: 'lv-x',
            title: 'Dead Live',
            scheduledAt: '2026-05-01T17:00:00.000Z',
            cancelledAt: '2026-04-30T00:00:00.000Z',
          }),
        ],
      }),
    })
    const { container, findByText } = withData(data, <LivesScreen now={NOW} />)
    await findByText('Dead Live')
    expect(container.querySelector('li[data-live-id="lv-up"] input[type="file"]')).toBeNull()
    expect(container.querySelector('li[data-live-id="lv-x"] input[type="file"]')).toBeNull()
  })

  test('empty lives → schedule-your-first copy', async () => {
    const data = baseData({ listLives: async () => ({ lives: [] }) })
    const { findByText } = withData(data, <LivesScreen now={NOW} />)
    expect(await findByText(/No lives scheduled yet/)).toBeTruthy()
  })

  test('schedule failure surfaces the API message', async () => {
    const data = baseData({
      scheduleLive: async () => {
        throw new ApiError('PROGRAM_NOT_FOUND', 404, 'Program not found')
      },
    })
    const { findByLabelText, findByRole, findByText } = withData(data, <LivesScreen now={NOW} />)
    fireEvent.input(await findByLabelText('Live title'), { target: { value: 'X' } })
    fireEvent.input(await findByLabelText('Scheduled at'), {
      target: { value: '2026-08-15T18:30' },
    })
    fireEvent.click(await findByRole('button', { name: 'Schedule live' }))
    expect(await findByText(/Program not found/)).toBeTruthy()
  })
})
