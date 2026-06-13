/// <reference lib="dom" />
/**
 * The Chat page (P6) — the personalized AI that "talks like it read your playbook".
 * Streaming answer in an aria-live="polite" region; ink-on-gold user bubbles, ink-on-sand
 * assistant bubbles; the "not therapy" disclosure is a persistent quiet line UNDER the input.
 * Crisis responses render in a CALM sand/gold callout (never alarm-red). The budget ceiling is
 * a DESIGNED warm state, not an error toast.
 */
import { useEffect, useRef, useState } from 'preact/hooks'
import { ErrorState, Skeleton } from '../components/states'
import {
  type ChatMessageView,
  fetchConversation,
  type SendChatEvents,
  sendChatMessage,
} from '../lib/data'
import { useQuery } from '../lib/use-query'

const NOT_THERAPY_FALLBACK =
  'This is not therapy. It helps you decide — it does not replace a doctor, a therapist, or a crisis line.'

/** A crisis message is the boundary-and-resources reply — render it calm, never alarm-red. */
function isCrisisContent(content: string): boolean {
  return content.includes('988') && content.toLowerCase().includes('not the right place')
}

function ChatBubble({ message }: { message: { role: 'user' | 'assistant'; content: string } }) {
  if (message.role === 'assistant' && isCrisisContent(message.content)) {
    return (
      <div
        role="note"
        // CALM treatment: sand background, gold border, ink text — NEVER error/red tokens.
        class="mr-auto max-w-[85%] whitespace-pre-line rounded-lg border border-gold bg-sand px-4 py-3 text-ink"
      >
        {message.content}
      </div>
    )
  }
  const mine = message.role === 'user'
  return (
    <div
      class={`max-w-[85%] whitespace-pre-line rounded-lg px-4 py-3 ${
        mine ? 'ml-auto bg-gold text-ink' : 'mr-auto bg-sand text-ink'
      }`}
    >
      {message.content}
    </div>
  )
}

/** The budget ceiling, as a DESIGNED warm state (not a toast). Calm, no shame. */
function BudgetCeiling() {
  return (
    <div class="mx-auto max-w-[480px] rounded-lg border border-linen bg-sand px-6 py-8 text-center">
      <h2 class="font-display text-2xl text-ink">You've used this month's conversations</h2>
      <p class="mt-2 text-body">
        It resets at the start of next month. Your playbook and journal are still here whenever you
        want them.
      </p>
    </div>
  )
}

type Draft = { role: 'assistant'; content: string }

function ChatThread({ conversationId }: { conversationId?: string }) {
  const [convId, setConvId] = useState<string | undefined>(conversationId)
  const { state, retry } = useQuery(
    () => (convId ? fetchConversation(convId) : Promise.resolve(null)),
    [convId],
  )

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [overBudget, setOverBudget] = useState(false)
  const [optimistic, setOptimistic] = useState<ChatMessageView[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const liveRef = useRef<HTMLDivElement>(null)

  if (state.status === 'error') {
    return (
      <ErrorState what="We couldn't open this conversation" error={state.error} onRetry={retry} />
    )
  }
  if (convId && state.status === 'loading') {
    return (
      <div class="space-y-3" aria-busy="true">
        <Skeleton class="h-12 w-2/3" label="Loading conversation" />
        <Skeleton class="ml-auto h-12 w-1/2" />
        <Skeleton class="h-12 w-3/4" />
      </div>
    )
  }

  const persisted: ChatMessageView[] =
    state.status === 'ready' && state.data ? state.data.messages : []
  const notTherapy =
    state.status === 'ready' && state.data ? state.data.notTherapy : NOT_THERAPY_FALLBACK
  const messages = [...persisted, ...optimistic]
  const empty = messages.length === 0 && !draft

  async function send() {
    const message = input.trim()
    if (!message || sending) return
    setSending(true)
    setInput('')
    setOptimistic((m) => [
      ...m,
      { id: `tmp-${Date.now()}`, role: 'user', content: message, createdAt: '' },
    ])
    setDraft({ role: 'assistant', content: '' })

    const events: SendChatEvents = {
      onToken: (text) =>
        setDraft((d) => ({ role: 'assistant', content: (d?.content ?? '') + text })),
      onDone: (info) => {
        setDraft(null)
        setSending(false)
        // Refetch the conversation so persisted rows replace the optimistic/draft state.
        setOptimistic([])
        if (!convId) setConvId(info.conversationId)
        else retry()
      },
      onError: (code) => {
        setDraft(null)
        setSending(false)
        if (code === 'AI_BUDGET_EXCEEDED') {
          setOverBudget(true)
          return
        }
        // Stream dropped — nothing was persisted server-side; drop the optimistic turn and
        // refetch so the recovered conversation shows. The user can retry.
        setOptimistic([])
        if (convId) retry()
      },
    }
    await sendChatMessage({ conversationId: convId, message }, events)
  }

  if (overBudget) return <BudgetCeiling />

  return (
    <div class="flex h-full flex-col">
      <div class="flex-1 space-y-3 overflow-y-auto pb-4">
        {empty ? (
          <div class="mx-auto max-w-[480px] py-12 text-center">
            <h2 class="font-display text-2xl text-ink">Talk it through</h2>
            <p class="mt-2 text-body">
              Ask about the decision you're stuck on. It has read your playbook and journal — it
              already knows the specifics.
            </p>
          </div>
        ) : null}

        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}

        {/* Streaming answer: announced politely; no animated typing indicator under reduced motion. */}
        <div ref={liveRef} aria-live="polite" aria-atomic="false">
          {draft ? (
            draft.content ? (
              <ChatBubble message={draft} />
            ) : (
              <div class="mr-auto max-w-[85%] rounded-lg bg-sand px-4 py-3 text-muted">
                <span class="motion-safe:animate-pulse">Thinking…</span>
              </div>
            )
          ) : null}
        </div>
      </div>

      <form
        class="border-t border-linen pt-3"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        <div class="flex gap-2">
          <label class="sr-only" for="chat-input">
            Your message
          </label>
          <textarea
            id="chat-input"
            value={input}
            disabled={sending}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            rows={2}
            placeholder="What are you deciding?"
            class="flex-1 resize-none rounded-md border border-linen bg-surface-white px-3 py-2 text-ink disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || input.trim().length === 0}
            class="min-h-11 self-end rounded-sm bg-gold px-5 py-2 font-medium text-ink motion-safe:transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send
          </button>
        </div>
        {/* The persistent "not therapy" disclosure — quiet line UNDER the input, never a modal. */}
        <p class="mt-2 text-center text-xs text-muted">{notTherapy}</p>
      </form>
    </div>
  )
}

export function ChatPage({ conversationId }: { conversationId?: string }) {
  // Reset thread when the route's conversationId changes.
  useEffect(() => {}, [conversationId])
  return (
    <div class="mx-auto flex h-[calc(100vh-12rem)] max-w-[var(--max-reading)] flex-col px-4 py-6">
      <h1 class="font-display text-3xl text-ink">Chat</h1>
      <div class="mt-4 flex-1 overflow-hidden">
        <ChatThread key={conversationId ?? 'new'} conversationId={conversationId} />
      </div>
    </div>
  )
}
