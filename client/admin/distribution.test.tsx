import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import type { JSX } from 'preact'
import { ApiError } from '@/features/(shared)/api-client'
import type { AdminData } from './data'
import { DataContext } from './data'
import {
  DistributionRunScreen,
  DistributionScreen,
  PIPELINE_STEPS,
  stepStates,
} from './distribution'
import { makeClip, makeData, makeRun, makeRunDetail, setBrowserPath } from './test-fixtures'
import { type PutFile, PutFileContext } from './uploader'

afterEach(cleanup)

function withData(data: AdminData, ui: JSX.Element, putFile: PutFile = async () => {}) {
  return render(
    <DataContext.Provider value={data}>
      <PutFileContext.Provider value={putFile}>{ui}</PutFileContext.Provider>
    </DataContext.Provider>,
  )
}

function pickFile(container: Element, file: File) {
  const input = container.querySelector('input[type="file"]')
  if (!input) throw new Error('No file input rendered')
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  fireEvent.change(input)
}

const video = () => new File(['bytes'], 'My Episode.mp4', { type: 'video/mp4' })

// ─── stepStates (pure) ───

describe('stepStates', () => {
  test('queued → transcribe active, rest pending', () => {
    const s = stepStates({ status: 'queued' })
    expect(s.transcribe).toBe('active')
    expect(s.select).toBe('pending')
    expect(s.distribute).toBe('pending')
  })

  test('selected → transcribe+select done, cut pending', () => {
    const s = stepStates({ status: 'selected' })
    expect(s.transcribe).toBe('done')
    expect(s.select).toBe('done')
    expect(s.cut).toBe('pending')
  })

  test('completed → every step done', () => {
    const s = stepStates({ status: 'completed' })
    for (const step of PIPELINE_STEPS) expect(s[step.key]).toBe('done')
  })

  test('failed at clip-cut → earlier done, cut failed, later pending', () => {
    const s = stepStates({ status: 'failed', stepFailedAt: 'clip-cut' })
    expect(s.transcribe).toBe('done')
    expect(s.select).toBe('done')
    expect(s.cut).toBe('failed')
    expect(s.metadata).toBe('pending')
  })
})

// ─── DistributionScreen: list / empty / error / upload+flow ───

describe('screen: DistributionScreen', () => {
  test('skeleton then empty state invites the first upload', async () => {
    const data = makeData({ listRuns: async () => [] })
    const { findByText } = withData(data, <DistributionScreen />)
    expect(await findByText(/No videos yet/)).toBeTruthy()
    expect(await findByText('Upload your first video')).toBeTruthy()
  })

  test('list load failure → retryable error', async () => {
    const data = makeData({
      listRuns: async () => {
        throw new ApiError('INTERNAL_ERROR', 500, 'Runs query failed')
      },
    })
    const { findByText, findByRole } = withData(data, <DistributionScreen />)
    expect(await findByText('Runs query failed')).toBeTruthy()
    expect(await findByRole('button', { name: 'Try again' })).toBeTruthy()
  })

  test('renders runs with a status chip', async () => {
    const data = makeData({
      listRuns: async () => [makeRun({ inputVideoUrl: 'pipeline/x/show.mp4', status: 'posted' })],
    })
    const { findByText } = withData(data, <DistributionScreen />)
    expect(await findByText('pipeline/x/show.mp4')).toBeTruthy()
  })

  test('upload + flow start: presign → PUT (progress) → startRun(config.flow) → process → navigate', async () => {
    setBrowserPath('/admin/distribution')
    const presigns: Array<Record<string, unknown>> = []
    const starts: Array<Record<string, unknown>> = []
    const processed: string[] = []
    let sendProgress: (pct: number) => void = () => {}
    let finishPut: () => void = () => {}
    const putFile: PutFile = (_url, _file, onProgress) => {
      sendProgress = onProgress
      return new Promise((resolve) => {
        finishPut = resolve
      })
    }
    const data = makeData({
      listRuns: async () => [],
      requestVideoUploadUrl: async (json) => {
        presigns.push(json)
        return { uploadUrl: 'https://r2/put', fileKey: 'pipeline/uuid/My-Episode.mp4' }
      },
      startRun: async (json) => {
        starts.push(json)
        return { run: makeRun({ id: 'run-9' }) }
      },
      processRun: async (id) => {
        processed.push(id)
        return { run: { id: 'run-9', status: 'transcribing' as const } }
      },
    })
    const { container, findByRole, findByText } = withData(data, <DistributionScreen />, putFile)

    fireEvent.click(await findByRole('button', { name: 'Upload your first video' }))
    // default flow is "short"
    pickFile(container, video())
    fireEvent.click(await findByRole('button', { name: 'Upload and start' }))

    await waitFor(() => expect(presigns.length).toBe(1))
    expect(presigns[0]).toEqual({ fileName: 'My Episode.mp4', mimeType: 'video/mp4' })
    sendProgress(45)
    await findByText(/45%/)
    finishPut()

    await waitFor(() => expect(starts.length).toBe(1))
    expect(starts[0]).toEqual({ videoUrl: 'pipeline/uuid/My-Episode.mp4', flow: 'short' })
    await waitFor(() => expect(processed).toEqual(['run-9']))
    await waitFor(() => expect(window.location.pathname).toBe('/admin/distribution/run-9'))
  })

  test('long flow is recorded in the run config', async () => {
    const starts: Array<Record<string, unknown>> = []
    const data = makeData({
      listRuns: async () => [],
      requestVideoUploadUrl: async () => ({
        uploadUrl: 'https://r2/put',
        fileKey: 'pipeline/u/v.mp4',
      }),
      startRun: async (json) => {
        starts.push(json)
        return { run: makeRun({ id: 'run-2' }) }
      },
      processRun: async () => ({ run: { id: 'run-2', status: 'transcribing' as const } }),
    })
    const { container, findByRole } = withData(data, <DistributionScreen />)
    fireEvent.click(await findByRole('button', { name: 'Upload your first video' }))
    fireEvent.click(await findByRole('radio', { name: /Full episode/ }))
    pickFile(container, video())
    fireEvent.click(await findByRole('button', { name: 'Upload and start' }))
    await waitFor(() => expect(starts.length).toBe(1))
    expect(starts[0]).toMatchObject({ flow: 'long' })
  })

  test('presign failure is explained; pipeline never starts', async () => {
    const starts: unknown[] = []
    const data = makeData({
      listRuns: async () => [],
      requestVideoUploadUrl: async () => {
        throw new ApiError('INTERNAL_ERROR', 500, 'Presign failed')
      },
      startRun: async (j) => {
        starts.push(j)
        return { run: makeRun() }
      },
    })
    const { container, findByRole, findByText } = withData(data, <DistributionScreen />)
    fireEvent.click(await findByRole('button', { name: 'Upload your first video' }))
    pickFile(container, video())
    fireEvent.click(await findByRole('button', { name: 'Upload and start' }))
    expect(await findByText(/couldn't prepare the upload/i)).toBeTruthy()
    expect(starts).toHaveLength(0)
  })

  test('PUT failure is explained; pipeline never starts', async () => {
    const starts: unknown[] = []
    const data = makeData({
      listRuns: async () => [],
      requestVideoUploadUrl: async () => ({
        uploadUrl: 'https://r2/put',
        fileKey: 'pipeline/u/v.mp4',
      }),
      startRun: async (j) => {
        starts.push(j)
        return { run: makeRun() }
      },
    })
    const putFile: PutFile = async () => {
      throw new Error('The file upload was rejected (HTTP 403)')
    }
    const { container, findByRole, findByText } = withData(data, <DistributionScreen />, putFile)
    fireEvent.click(await findByRole('button', { name: 'Upload your first video' }))
    pickFile(container, video())
    fireEvent.click(await findByRole('button', { name: 'Upload and start' }))
    expect(await findByText(/never reached storage/i)).toBeTruthy()
    expect(starts).toHaveLength(0)
  })
})

// ─── DistributionRunScreen: dashboard + clip review + approval gate + distribute ───

describe('screen: DistributionRunScreen', () => {
  test('skeleton then status dashboard renders every step', async () => {
    const data = makeData({
      getRun: async () => makeRunDetail({ run: makeRun({ status: 'cut' }) }),
    })
    const { findByText } = withData(data, <DistributionRunScreen runId="run-1" />)
    expect(await findByText('Pipeline status')).toBeTruthy()
    for (const step of PIPELINE_STEPS) expect(await findByText(step.label)).toBeTruthy()
  })

  test('run load failure → retryable error', async () => {
    const data = makeData({
      getRun: async () => {
        throw new ApiError('NOT_FOUND', 404, 'Resource not found')
      },
    })
    const { findByRole, findByText } = withData(data, <DistributionRunScreen runId="run-1" />)
    expect(await findByText('Resource not found')).toBeTruthy()
    expect(await findByRole('button', { name: 'Try again' })).toBeTruthy()
  })

  test('failed run shows what/why/how-to-fix on the failing step', async () => {
    const data = makeData({
      getRun: async () =>
        makeRunDetail({
          run: makeRun({
            status: 'failed',
            stepFailedAt: 'post-distribute',
            errorMessage: 'Account token expired',
          }),
        }),
    })
    const { findByText } = withData(data, <DistributionRunScreen runId="run-1" />)
    expect(await findByText('Account token expired')).toBeTruthy()
    expect(await findByText(/expired account connection/i)).toBeTruthy()
  })

  test('empty clips state explains they appear after selection', async () => {
    const data = makeData({ getRun: async () => makeRunDetail({ clips: [] }) })
    const { findByText } = withData(data, <DistributionRunScreen runId="run-1" />)
    expect(await findByText(/No clips yet/)).toBeTruthy()
  })

  test('renders AI-selected clips for review', async () => {
    const data = makeData({
      getRun: async () =>
        makeRunDetail({
          clips: [
            makeClip({ id: 'c1', suggestedTitle: 'Clip A' }),
            makeClip({ id: 'c2', suggestedTitle: 'Clip B' }),
          ],
        }),
    })
    const { findByText } = withData(data, <DistributionRunScreen runId="run-1" />)
    expect(await findByText('Clip A')).toBeTruthy()
    expect(await findByText('Clip B')).toBeTruthy()
    expect(await findByText('0 of 2 approved')).toBeTruthy()
  })

  test('THE APPROVAL GATE: distribute is disabled and NOTHING distributes until a clip is approved', async () => {
    const distributed: string[] = []
    const data = makeData({
      getRun: async () =>
        makeRunDetail({
          clips: [makeClip({ id: 'c1', suggestedTitle: 'Clip A', approved: false })],
        }),
      setClipApproval: async (_runId, clipId, approved) => ({
        clip: makeClip({ id: clipId, approved }),
      }),
      distribute: async (runId) => {
        distributed.push(runId)
        return { posts: [] }
      },
    })
    const { findByRole } = withData(data, <DistributionRunScreen runId="run-1" />)

    // Gate closed: the distribute button is disabled, so no distribution can be triggered.
    const distributeBtn = (await findByRole('button', {
      name: /Distribute 0 approved/,
    })) as HTMLButtonElement
    expect(distributeBtn.disabled).toBe(true)
    fireEvent.click(distributeBtn)
    expect(distributed).toHaveLength(0)

    // Approve one clip → gate opens.
    fireEvent.click(await findByRole('button', { name: 'Approve Clip A' }))
    const enabled = (await findByRole('button', {
      name: /Distribute 1 approved clip/,
    })) as HTMLButtonElement
    await waitFor(() => expect(enabled.disabled).toBe(false))
  })

  test('approve then distribute sends approved clips to platforms', async () => {
    const approvals: Array<{ clipId: string; approved: boolean }> = []
    const distributed: string[] = []
    const data = makeData({
      getRun: async () =>
        makeRunDetail({
          clips: [makeClip({ id: 'c1', suggestedTitle: 'Clip A', approved: false })],
        }),
      setClipApproval: async (_runId, clipId, approved) => {
        approvals.push({ clipId, approved })
        return { clip: makeClip({ id: clipId, approved }) }
      },
      distribute: async (runId) => {
        distributed.push(runId)
        return { posts: [{ postId: 'post-1', success: true }] }
      },
    })
    const { findByRole, findByText } = withData(data, <DistributionRunScreen runId="run-1" />)

    fireEvent.click(await findByRole('button', { name: 'Approve Clip A' }))
    await waitFor(() => expect(approvals).toEqual([{ clipId: 'c1', approved: true }]))
    // Row now shows it's approved + a Reject affordance.
    expect(await findByText('Approved')).toBeTruthy()

    fireEvent.click(await findByRole('button', { name: /Distribute 1 approved clip/ }))
    await waitFor(() => expect(distributed).toEqual(['run-1']))
    expect(await findByText(/sent to your platforms/i)).toBeTruthy()
  })

  test('reject flips an approved clip back (and re-closes the gate)', async () => {
    const data = makeData({
      getRun: async () =>
        makeRunDetail({
          clips: [makeClip({ id: 'c1', suggestedTitle: 'Clip A', approved: true })],
        }),
      setClipApproval: async (_runId, clipId, approved) => ({
        clip: makeClip({ id: clipId, approved }),
      }),
    })
    const { findByRole } = withData(data, <DistributionRunScreen runId="run-1" />)
    expect(
      ((await findByRole('button', { name: /Distribute 1 approved/ })) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
    fireEvent.click(await findByRole('button', { name: 'Reject Clip A' }))
    const closed = (await findByRole('button', {
      name: /Distribute 0 approved/,
    })) as HTMLButtonElement
    await waitFor(() => expect(closed.disabled).toBe(true))
  })

  test('approval failure surfaces an inline error', async () => {
    const data = makeData({
      getRun: async () =>
        makeRunDetail({ clips: [makeClip({ id: 'c1', suggestedTitle: 'Clip A' })] }),
      setClipApproval: async () => {
        throw new ApiError('INTERNAL_ERROR', 500, 'Approval write failed')
      },
    })
    const { findByRole, findByText } = withData(data, <DistributionRunScreen runId="run-1" />)
    fireEvent.click(await findByRole('button', { name: 'Approve Clip A' }))
    expect(await findByText('Approval write failed')).toBeTruthy()
  })
})
