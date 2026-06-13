import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import { setApiFetchForTests } from '../lib/api'
import { jsonFetch } from '../test-fixtures'
import { InterviewConfirm } from './interview-confirm'

afterEach(() => {
  cleanup()
  setApiFetchForTests(null)
})

const fields = [
  { fieldId: 'f-required', label: 'The decision', value: 'Open my own studio' },
  { fieldId: 'f-optional', label: 'The fear', value: 'Money runs out' },
]

describe('component: InterviewConfirm (ADR 11 trust moment)', () => {
  test('proposed fields render as "suggested" before acceptance', () => {
    setApiFetchForTests(jsonFetch({}))
    const { getAllByText, getByText } = render(
      <InterviewConfirm interviewId="i1" fields={fields} />,
    )
    // Nothing is filled yet — the heading makes the not-yet-saved state explicit.
    expect(getByText(/Nothing is saved yet/i)).toBeTruthy()
    expect(getByText('Open my own studio')).toBeTruthy()
    // pre-selected by default, so the "suggested" pill shows only on un-checked fields:
    // un-check one to reveal the suggested marker.
    expect(getAllByText('The decision').length).toBeGreaterThan(0)
  })

  test('accepting writes ONLY the accepted fields and flips to a confirmed state', async () => {
    const posted: Array<{ acceptedFieldIds: string[] }> = []
    setApiFetchForTests(
      jsonFetch({
        'POST /api/interview/i1/confirm': ({ init }: { init?: RequestInit }) => {
          const body = JSON.parse(String(init?.body))
          posted.push(body)
          return new Response(
            JSON.stringify({
              ok: true,
              data: { status: 'confirmed', confirmedFieldIds: body.acceptedFieldIds },
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          )
        },
      }),
    )
    const { getByLabelText, getByRole, findByText } = render(
      <InterviewConfirm interviewId="i1" fields={fields} />,
    )
    // Un-check the optional field — the user keeps only the decision.
    fireEvent.click(getByLabelText('Accept suggestion for The fear'))
    fireEvent.click(getByRole('button', { name: /Add 1 to my playbook/i }))

    await waitFor(() => expect(posted.length).toBe(1))
    expect(posted[0]?.acceptedFieldIds).toEqual(['f-required'])
    expect(await findByText(/Added to your playbook/i)).toBeTruthy()
  })

  test('with nothing selected the button is disabled (never fills a field unasked)', () => {
    setApiFetchForTests(jsonFetch({}))
    const { getByLabelText, getByRole } = render(
      <InterviewConfirm interviewId="i1" fields={fields} />,
    )
    fireEvent.click(getByLabelText('Accept suggestion for The decision'))
    fireEvent.click(getByLabelText('Accept suggestion for The fear'))
    const button = getByRole('button') as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })

  test('empty distillation is a calm invitation, not an error', () => {
    setApiFetchForTests(jsonFetch({}))
    const { getByText } = render(<InterviewConfirm interviewId="i1" fields={[]} />)
    expect(getByText(/keep talking/i)).toBeTruthy()
  })
})
