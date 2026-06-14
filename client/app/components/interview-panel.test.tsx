import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import { setApiFetchForTests } from '../lib/api'
import { errorEnvelope, jsonFetch } from '../test-fixtures'
import { InterviewPanel } from './interview-panel'

afterEach(() => {
  cleanup()
  setApiFetchForTests(null)
})

const fields = [
  { id: 'one-true-thing', label: 'The one true thing' },
  { id: 'the-fear', label: 'The fear underneath' },
]

/** Envelope helper for the interview POST/GET request/response endpoints. */
function ok(data: unknown): Response {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

describe('component: InterviewPanel (wires the interview flow end-to-end)', () => {
  test('mount starts a page-scoped interview and asks the first question', async () => {
    const started: Array<{ documentId: string; pageId: string }> = []
    setApiFetchForTests(
      jsonFetch({
        'POST /api/interview': ({ init }: { init?: RequestInit }) => {
          started.push(JSON.parse(String(init?.body)))
          return ok({ interview: { id: 'iv-1' }, conversationId: 'cv-1' })
        },
        'POST /api/interview/iv-1/messages': () => ok({ ok: true }),
      }),
    )
    const { findByText } = render(
      <InterviewPanel documentId="doc-1" pageId="pg-1" fields={fields} />,
    )
    // The first scripted question (the field's label) appears once the interview is live.
    expect(await findByText(/The one true thing/i)).toBeTruthy()
    await waitFor(() => expect(started.length).toBe(1))
    expect(started[0]).toEqual({ documentId: 'doc-1', pageId: 'pg-1' })
  })

  test('loading state shows while the interview starts', () => {
    // A never-resolving start keeps the panel in its loading state.
    setApiFetchForTests(() => new Promise<Response>(() => {}))
    const { getByRole } = render(
      <InterviewPanel documentId="doc-1" pageId="pg-1" fields={fields} />,
    )
    expect(getByRole('status')).toBeTruthy()
  })

  test('a failed start renders the error state with retry', async () => {
    setApiFetchForTests(
      jsonFetch({ 'POST /api/interview': () => errorEnvelope('DOCUMENT_NOT_FOUND', 404) }),
    )
    const { findByRole } = render(
      <InterviewPanel documentId="doc-1" pageId="pg-1" fields={fields} />,
    )
    expect(await findByRole('alert')).toBeTruthy()
  })

  test('answering walks the question loop, then distills into suggested fields (sand-tinted, NOT saved)', async () => {
    const posted: Array<{ role: string; content: string }> = []
    let distilled = false
    setApiFetchForTests(
      jsonFetch({
        'POST /api/interview': () => ok({ interview: { id: 'iv-1' }, conversationId: 'cv-1' }),
        'POST /api/interview/iv-1/messages': ({ init }: { init?: RequestInit }) => {
          posted.push(JSON.parse(String(init?.body)))
          return ok({ ok: true })
        },
        'POST /api/interview/iv-1/distill': () => {
          distilled = true
          return ok({
            status: 'awaiting_confirmation',
            distilledFields: {
              'one-true-thing': 'Open my own studio',
              'the-fear': 'Money runs out',
            },
          })
        },
      }),
    )
    const { findByLabelText, getByRole, findByText } = render(
      <InterviewPanel documentId="doc-1" pageId="pg-1" fields={fields} />,
    )

    // Answer question 1.
    const input1 = await findByLabelText(/your answer/i)
    fireEvent.input(input1, { target: { value: 'Open my own studio' } })
    fireEvent.click(getByRole('button', { name: /next|continue|done/i }))

    // Answer question 2 (the loop advanced to the second field).
    await findByText(/The fear underneath/i)
    const input2 = await findByLabelText(/your answer/i)
    fireEvent.input(input2, { target: { value: 'Money runs out' } })
    fireEvent.click(getByRole('button', { name: /next|continue|done/i }))

    // After the last answer the panel distills and shows the ADR 11 confirm UI.
    await waitFor(() => expect(distilled).toBe(true))
    expect(await findByText(/Nothing is saved yet/i)).toBeTruthy()
    expect(await findByText('Open my own studio')).toBeTruthy()

    // The user's answers were persisted as 'user' turns (plus the 'assistant' questions).
    expect(posted.filter((p) => p.role === 'user').map((p) => p.content)).toEqual([
      'Open my own studio',
      'Money runs out',
    ])
    // NOTHING was written to document_answers yet — no confirm call happened.
    // (confirm is only triggered by InterviewConfirm's explicit accept.)
  })

  test('accepting in the confirm step writes via confirm and reports the confirmed ids', async () => {
    const confirmed: Array<{ acceptedFieldIds: string[] }> = []
    let onConfirmedIds: string[] | null = null
    setApiFetchForTests(
      jsonFetch({
        'POST /api/interview': () => ok({ interview: { id: 'iv-1' }, conversationId: 'cv-1' }),
        'POST /api/interview/iv-1/messages': () => ok({ ok: true }),
        'POST /api/interview/iv-1/distill': () =>
          ok({
            status: 'awaiting_confirmation',
            distilledFields: { 'one-true-thing': 'Open my own studio' },
          }),
        'POST /api/interview/iv-1/confirm': ({ init }: { init?: RequestInit }) => {
          const body = JSON.parse(String(init?.body))
          confirmed.push(body)
          return ok({ status: 'confirmed', confirmedFieldIds: body.acceptedFieldIds })
        },
      }),
    )
    const single = [{ id: 'one-true-thing', label: 'The one true thing' }]
    const { findByLabelText, getByRole, findByText } = render(
      <InterviewPanel
        documentId="doc-1"
        pageId="pg-1"
        fields={single}
        onConfirmed={(ids) => {
          onConfirmedIds = ids
        }}
      />,
    )

    const input = await findByLabelText(/your answer/i)
    fireEvent.input(input, { target: { value: 'Open my own studio' } })
    fireEvent.click(getByRole('button', { name: /next|continue|done/i }))

    // Confirm UI rendered; accept.
    const accept = await findByText(/Add 1 to my playbook/i)
    fireEvent.click(accept)

    await waitFor(() => expect(confirmed.length).toBe(1))
    expect(confirmed[0]?.acceptedFieldIds).toEqual(['one-true-thing'])
    expect(await findByText(/Added to your playbook/i)).toBeTruthy()
    await waitFor(() => expect(onConfirmedIds).toEqual(['one-true-thing']))
  })

  test('an INTERVIEW_INVALID_STATE on distill surfaces a calm error, never a crash', async () => {
    setApiFetchForTests(
      jsonFetch({
        'POST /api/interview': () => ok({ interview: { id: 'iv-1' }, conversationId: 'cv-1' }),
        'POST /api/interview/iv-1/messages': () => ok({ ok: true }),
        'POST /api/interview/iv-1/distill': () =>
          errorEnvelope('INTERVIEW_INVALID_STATE', 409, 'cannot distill from "abandoned"'),
      }),
    )
    const single = [{ id: 'one-true-thing', label: 'The one true thing' }]
    const { findByLabelText, getByRole, findByRole } = render(
      <InterviewPanel documentId="doc-1" pageId="pg-1" fields={single} />,
    )
    const input = await findByLabelText(/your answer/i)
    fireEvent.input(input, { target: { value: 'Open my own studio' } })
    fireEvent.click(getByRole('button', { name: /next|continue|done/i }))

    expect(await findByRole('alert')).toBeTruthy()
  })
})
