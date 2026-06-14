import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import { ApiError } from '@/features/(shared)/api-client'
import type { AdminData, AdminLesson } from './data'
import { DataContext } from './data'
import { LessonEditorScreen, publishBlockers } from './lesson-editor'
import { makeCourse, makeData, makeLesson, makeModule } from './test-fixtures'
import { type Uploader, UploaderContext } from './uploader'

afterEach(cleanup)

const noUploader: Uploader = {
  upload: () => {
    throw new Error('uploader should not be used in this test')
  },
}

function renderEditor(
  data: AdminData,
  options: { pollIntervalMs?: number; uploader?: Uploader } = {},
) {
  return render(
    <DataContext.Provider value={data}>
      <UploaderContext.Provider value={options.uploader ?? noUploader}>
        <LessonEditorScreen
          courseId="c-1"
          moduleId="m-1"
          lessonId="l-1"
          pollIntervalMs={options.pollIntervalMs ?? 60_000}
        />
      </UploaderContext.Provider>
    </DataContext.Provider>,
  )
}

function detailWith(lesson: AdminLesson) {
  return { course: makeCourse(), modules: [makeModule({}, [lesson])] }
}

describe('client/admin lesson-editor: publishBlockers', () => {
  test('all three gates missing → three reasons', () => {
    const blockers = publishBlockers(makeLesson())
    expect(blockers.length).toBe(3)
    expect(blockers.join(' ')).toMatch(/video/i)
    expect(blockers.join(' ')).toMatch(/captions/i)
    expect(blockers.join(' ')).toMatch(/decision prompt/i)
  })

  test('each gate clears its own reason', () => {
    expect(publishBlockers(makeLesson({ videoStatus: 'ready' })).length).toBe(2)
    expect(publishBlockers(makeLesson({ videoStatus: 'ready', captionsReady: true })).length).toBe(
      1,
    )
    expect(
      publishBlockers(
        makeLesson({
          videoStatus: 'ready',
          captionsReady: true,
          decisionPrompt: 'What will you decide?',
        }),
      ),
    ).toEqual([])
  })
})

describe('screen: LessonEditorScreen', () => {
  test('loads the lesson and autosaves the decision prompt on blur', async () => {
    const patches: Array<Record<string, unknown>> = []
    const data = makeData({
      getCourse: async () => detailWith(makeLesson()),
      updateLesson: async (_id, json) => {
        patches.push(json)
        return { lesson: makeLesson({ decisionPrompt: String(json.decisionPrompt) }) }
      },
    })
    const { findByLabelText, findByText } = renderEditor(data)
    const prompt = (await findByLabelText('Decision prompt')) as HTMLTextAreaElement
    fireEvent.input(prompt, { target: { value: 'What is the one decision?' } })
    fireEvent.blur(prompt)
    expect(await findByText('Saved')).toBeTruthy()
    expect(patches).toEqual([{ decisionPrompt: 'What is the one decision?' }])
  })

  test('autosave failure tells her how to recover', async () => {
    const data = makeData({
      getCourse: async () => detailWith(makeLesson()),
      updateLesson: async () => {
        throw new ApiError(
          'VALIDATION_ERROR',
          400,
          'Validation failed',
          'must keep its decision prompt',
        )
      },
    })
    const { findByLabelText, findByRole } = renderEditor(data)
    const title = (await findByLabelText('Lesson title')) as HTMLInputElement
    fireEvent.input(title, { target: { value: 'New title' } })
    fireEvent.blur(title)
    const alert = await findByRole('alert')
    expect(alert.textContent).toContain("Couldn't save")
    expect(alert.textContent).toContain('decision prompt')
  })

  test('publish disabled with all three explained reasons when nothing is ready', async () => {
    const data = makeData({ getCourse: async () => detailWith(makeLesson()) })
    const { findByRole, findByText } = renderEditor(data)
    const publish = (await findByRole('button', { name: 'Publish lesson' })) as HTMLButtonElement
    expect(publish.disabled).toBe(true)
    expect(await findByText(/Video isn't ready yet/)).toBeTruthy()
    expect(await findByText(/Captions aren't ready/)).toBeTruthy()
    expect(await findByText(/Add a decision prompt/)).toBeTruthy()
  })

  test('publish disabled with only the remaining reason when two gates pass', async () => {
    const data = makeData({
      getCourse: async () => detailWith(makeLesson({ videoStatus: 'ready', captionsReady: true })),
    })
    const { container, findByRole, findByText } = renderEditor(data)
    expect(
      ((await findByRole('button', { name: 'Publish lesson' })) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(await findByText(/Add a decision prompt/)).toBeTruthy()
    expect(container.textContent).not.toContain("Video isn't ready yet")
    expect(container.textContent).not.toContain("Captions aren't ready")
  })

  test('publish enabled when the invariant is satisfied; success shows Published', async () => {
    const ready = makeLesson({
      videoStatus: 'ready',
      captionsReady: true,
      decisionPrompt: 'Decide.',
    })
    const published: string[] = []
    const data = makeData({
      getCourse: async () => detailWith(ready),
      publishLesson: async (id) => {
        published.push(id)
        return { lesson: { ...ready, status: 'published' as const } }
      },
    })
    const { findByRole, findByText } = renderEditor(data)
    const publish = (await findByRole('button', { name: 'Publish lesson' })) as HTMLButtonElement
    expect(publish.disabled).toBe(false)
    fireEvent.click(publish)
    expect(await findByText('Published')).toBeTruthy()
    expect(await findByText(/live for members/i)).toBeTruthy()
    expect(published).toEqual(['l-1'])
  })

  test('the API stays the enforcer — its rejection is surfaced verbatim', async () => {
    const ready = makeLesson({
      videoStatus: 'ready',
      captionsReady: true,
      decisionPrompt: 'Decide.',
    })
    const data = makeData({
      getCourse: async () => detailWith(ready),
      publishLesson: async () => {
        throw new ApiError('CAPTIONS_REQUIRED', 422, 'Captions are required before publishing')
      },
    })
    const { findByRole, findByText } = renderEditor(data)
    fireEvent.click(await findByRole('button', { name: 'Publish lesson' }))
    expect(await findByText(/Captions are required before publishing/)).toBeTruthy()
  })

  test('captions: generate disabled with reason until video is ready', async () => {
    const data = makeData({ getCourse: async () => detailWith(makeLesson()) })
    const { findByRole, findByText } = renderEditor(data)
    const generate = (await findByRole('button', {
      name: 'Generate captions',
    })) as HTMLButtonElement
    expect(generate.disabled).toBe(true)
    expect(await findByText(/once the video finishes processing/i)).toBeTruthy()
  })

  test('captions: generate → guidance, then mark ready flips the indicator', async () => {
    const lesson = makeLesson({ videoStatus: 'ready', streamVideoId: 'sv-1' })
    const readyCalls: boolean[] = []
    const data = makeData({
      getCourse: async () => detailWith(lesson),
      generateCaptions: async () => ({ generation: { language: 'en', status: 'inprogress' } }),
      setCaptionsReady: async (_id, ready) => {
        readyCalls.push(ready)
        return { lesson: { ...lesson, captionsReady: ready } }
      },
    })
    const { findByRole, findByText } = renderEditor(data)
    expect(await findByText('No captions yet')).toBeTruthy()
    fireEvent.click(await findByRole('button', { name: 'Generate captions' }))
    expect(await findByText(/few minutes/i)).toBeTruthy()
    fireEvent.click(await findByRole('button', { name: 'Mark captions ready' }))
    expect(await findByText('Captions ready')).toBeTruthy()
    expect(readyCalls).toEqual([true])
  })

  test('polls while processing and flips to Ready automatically', async () => {
    let calls = 0
    const processing = makeLesson({ videoStatus: 'processing', streamVideoId: 'sv-1' })
    const data = makeData({
      getCourse: async () => {
        calls += 1
        return detailWith(
          calls >= 2 ? { ...processing, videoStatus: 'ready' as const } : processing,
        )
      },
    })
    const { findByText } = renderEditor(data, { pollIntervalMs: 10 })
    expect(await findByText('Processing')).toBeTruthy()
    await waitFor(async () => expect(await findByText('Ready')).toBeTruthy(), { timeout: 2000 })
    expect(calls).toBeGreaterThanOrEqual(2)
  })

  test('unknown lesson id → clear error, not a blank page', async () => {
    const data = makeData({ getCourse: async () => detailWith(makeLesson({ id: 'l-other' })) })
    const { findByText } = renderEditor(data)
    expect(await findByText(/lesson doesn't exist/i)).toBeTruthy()
  })
})
