import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import { setApiFetchForTests } from '../lib/api'
import { errorEnvelope, jsonFetch } from '../test-fixtures'
import { ChatPage } from './chat'

afterEach(() => {
  cleanup()
  setApiFetchForTests(null)
})

/** Build an SSE Response body from token texts + a done frame. */
function sseResponse(tokens: string[], doneInfo: Record<string, unknown>): Response {
  const frames = [
    ...tokens.map((t) => `event: token\ndata: ${t}\n\n`),
    `event: done\ndata: ${JSON.stringify(doneInfo)}\n\n`,
  ].join('')
  return new Response(frames, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  })
}

const conversationFixture = (messages: Array<{ id: string; role: string; content: string }>) => ({
  ok: true,
  data: {
    conversation: { id: 'c1', kind: 'chat', title: null },
    messages,
    notTherapy: 'This is not therapy. It helps you decide.',
  },
})

describe('page: Chat', () => {
  test('empty state invites the user to talk it through, with the not-therapy line', () => {
    setApiFetchForTests(jsonFetch({}))
    const { getByText } = render(<ChatPage />)
    expect(getByText(/Talk it through/i)).toBeTruthy()
    expect(getByText(/not therapy/i)).toBeTruthy()
  })

  test('the streaming region is announced politely (aria-live)', () => {
    setApiFetchForTests(jsonFetch({}))
    const { container } = render(<ChatPage />)
    expect(container.querySelector('[aria-live="polite"]')).toBeTruthy()
  })

  test('sending a message streams tokens then shows the assistant reply', async () => {
    setApiFetchForTests(
      jsonFetch({
        'POST /api/chat': () =>
          sseResponse(['You already ', 'decided.'], {
            conversationId: 'c1',
            crisis: false,
            dropped: false,
          }),
        'GET /api/chat/c1': conversationFixture([
          { id: 'u1', role: 'user', content: 'help' },
          { id: 'a1', role: 'assistant', content: 'You already decided.' },
        ]),
      }),
    )
    const { findByLabelText, findByText, getByRole } = render(<ChatPage />)
    const input = (await findByLabelText('Your message')) as HTMLTextAreaElement
    fireEvent.input(input, { target: { value: 'help' } })
    fireEvent.click(getByRole('button', { name: 'Send' }))
    expect(await findByText('You already decided.')).toBeTruthy()
  })

  test('a crisis reply renders in a CALM callout — NO alarm/red token', async () => {
    const crisisText =
      'I want to stop here. This is not the right place for what you are carrying. Call or text 988.'
    setApiFetchForTests(
      jsonFetch({
        'POST /api/chat': () =>
          sseResponse([crisisText], { conversationId: 'c1', crisis: true, dropped: false }),
        'GET /api/chat/c1': conversationFixture([
          { id: 'u1', role: 'user', content: 'crisis' },
          { id: 'a1', role: 'assistant', content: crisisText },
        ]),
      }),
    )
    const { findByLabelText, findByRole, getByRole } = render(<ChatPage />)
    const input = (await findByLabelText('Your message')) as HTMLTextAreaElement
    fireEvent.input(input, { target: { value: 'crisis' } })
    fireEvent.click(getByRole('button', { name: 'Send' }))
    const callout = await findByRole('note')
    expect(callout.textContent).toContain('988')
    // CALM treatment — no error/red token anywhere on the crisis callout.
    expect(callout.className).not.toMatch(/error|red/)
  })

  test('hitting the budget ceiling shows a DESIGNED warm state, not an error toast', async () => {
    setApiFetchForTests(
      jsonFetch({
        'POST /api/chat': () => errorEnvelope('AI_BUDGET_EXCEEDED', 429),
      }),
    )
    const { findByLabelText, findByText, getByRole } = render(<ChatPage />)
    const input = (await findByLabelText('Your message')) as HTMLTextAreaElement
    fireEvent.input(input, { target: { value: 'one more' } })
    fireEvent.click(getByRole('button', { name: 'Send' }))
    expect(await findByText(/used this month's conversations/i)).toBeTruthy()
    // It's a warm panel, not an alert.
    await waitFor(() => expect(document.querySelector('[role="alert"]')).toBeNull())
  })

  test('an existing conversation loads and shows its history', async () => {
    setApiFetchForTests(
      jsonFetch({
        'GET /api/chat/c1': conversationFixture([
          { id: 'u1', role: 'user', content: 'earlier question' },
          { id: 'a1', role: 'assistant', content: 'earlier answer' },
        ]),
      }),
    )
    const { findByText } = render(<ChatPage conversationId="c1" />)
    expect(await findByText('earlier question')).toBeTruthy()
    expect(await findByText('earlier answer')).toBeTruthy()
  })
})
