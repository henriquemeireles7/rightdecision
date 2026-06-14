import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/platform/env'

/**
 * Lazily constructed so merely IMPORTING this module (e.g. to reference the `chat`
 * function as a default provider) never instantiates the SDK. The feature layer injects
 * fixture providers in tests and never calls these functions, so the live client is
 * constructed only on a real API call — which keeps the SDK's browser-guard from tripping
 * under the happy-dom test preload, and keeps module import side-effect-free.
 */
let clientInstance: Anthropic | null = null
function getClient(): Anthropic {
  if (!clientInstance) clientInstance = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  return clientInstance
}

const SUGGESTION_TIMEOUT_MS = 10_000
const SUGGESTION_COUNT = 3
/**
 * Idle watchdog for the chat stream: if the Anthropic socket yields no event for this long
 * the stream is aborted and the iterator throws. A hung socket therefore degrades cleanly —
 * runChatTurn's catch maps the throw to dropped:true (nothing persisted). Mirrors the 10s
 * timeout posture of generateSuggestions/distill, but per-chunk so a long answer can still stream.
 */
const CHAT_STREAM_IDLE_TIMEOUT_MS = 30_000

/**
 * Model tiering (ADR 10): a LARGE model for advice (chat), a SMALL model for
 * interviews/suggestions/distillation. Selection is by `kind` — the COGS target
 * (≤$2/user/mo on a $197/yr price) demands that cheap kinds never hit the large model.
 *
 * Capability-named, vendor-pinned in ONE place. Swap a model here, not in features.
 */
export const AI_MODELS = {
  /** Advice: the personalized chat answer that "talks like it read your playbook". */
  large: 'claude-opus-4-8',
  /** Interviews, suggestions, distillation — cheap, high-volume. */
  small: 'claude-haiku-4-5',
} as const

export type AiKind = 'chat' | 'interview' | 'distill' | 'suggestion'

/** LARGE for advice (chat); SMALL for everything else (ADR 10). Tested by kind. */
export function modelForKind(kind: AiKind): string {
  return kind === 'chat' ? AI_MODELS.large : AI_MODELS.small
}

export type ChatRole = 'user' | 'assistant'
export type ChatMessage = { role: ChatRole; content: string }

/** A streamed chunk: incremental text, then a terminal usage frame on completion. */
export type ChatChunk =
  | { type: 'text'; text: string }
  | { type: 'done'; inputTokens: number; outputTokens: number; model: string }

export type ChatParams = {
  kind: AiKind
  system: string
  messages: ChatMessage[]
}

/**
 * SSE seam (DX Convention 4): chat is an AsyncIterable<ChatChunk>. The feature layer
 * owns persist-on-completion as a pure function; this provider only yields chunks.
 * The real Anthropic stream lives behind the env/key seam and is NEVER hit in tests —
 * tests iterate a FIXTURE AsyncIterable injected at the feature layer.
 *
 * Yields text chunks as they stream, then exactly one terminal `done` chunk carrying
 * token usage. A mid-stream throw (deploy severs the socket) propagates to the caller,
 * which persists NOTHING (eng-schema S3).
 */
export async function* chat(params: ChatParams): AsyncIterable<ChatChunk> {
  const model = modelForKind(params.kind)
  let inputTokens = 0
  let outputTokens = 0

  // Idle watchdog: a hung Anthropic socket must NOT stall the SSE request forever. We abort the
  // stream if no event arrives within CHAT_STREAM_IDLE_TIMEOUT_MS; the abort surfaces as a throw
  // from the for-await, which runChatTurn maps to dropped:true (nothing persisted).
  const controller = new AbortController()
  let watchdog: ReturnType<typeof setTimeout> | undefined
  const armWatchdog = () => {
    if (watchdog) clearTimeout(watchdog)
    watchdog = setTimeout(
      () => controller.abort(new Error('AI chat stream idle timeout')),
      CHAT_STREAM_IDLE_TIMEOUT_MS,
    )
  }

  const stream = getClient().messages.stream(
    {
      model,
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: params.system,
      messages: params.messages,
    },
    { signal: controller.signal },
  )

  try {
    armWatchdog()
    for await (const event of stream) {
      armWatchdog()
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text', text: event.delta.text }
      } else if (event.type === 'message_start') {
        inputTokens = event.message.usage.input_tokens
      } else if (event.type === 'message_delta') {
        outputTokens = event.usage.output_tokens
      }
    }
  } finally {
    if (watchdog) clearTimeout(watchdog)
  }

  yield { type: 'done', inputTokens, outputTokens, model }
}

export type DistillResult = {
  /** fieldId → distilled value. Validated/filtered by the feature layer against the template. */
  fields: Record<string, string>
  inputTokens: number
  outputTokens: number
  model: string
}

/**
 * Distillation (ADR 11): collapse an interview transcript into proposed field values.
 * SMALL model (kind='distill'). Returns the proposed fields + usage; the feature layer
 * validates fieldIds against the pinned template and writes NOTHING until the user confirms.
 * Returns empty fields on any failure (the interview simply yields no suggestions).
 */
export async function distill(system: string, transcript: ChatMessage[]): Promise<DistillResult> {
  const model = modelForKind('distill')
  try {
    const response = await getClient().messages.create({
      model,
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system,
      messages: transcript,
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              fields: {
                type: 'object',
                additionalProperties: { type: 'string' },
              },
            },
            required: ['fields'],
            additionalProperties: false,
          },
        },
      },
    })
    const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
    const parsed = JSON.parse(text) as { fields?: Record<string, unknown> }
    const fields: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed.fields ?? {})) {
      fields[key] = String(value)
    }
    return {
      fields,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model,
    }
  } catch (error) {
    console.warn('[ai] Distillation failed, returning no fields:', error)
    return { fields: {}, inputTokens: 0, outputTokens: 0, model }
  }
}

/**
 * Generate personalized decision block suggestions.
 *
 * Takes the fixed question and all previous user answers as context,
 * returns 3 suggestion strings. Falls back to generic suggestions on
 * any failure (timeout, rate limit, malformed response, empty).
 */
export async function generateSuggestions(
  question: string,
  previousContext: string[],
): Promise<string[]> {
  const genericFallback = [
    'Something I have been avoiding for a while',
    'A change I know I need to make',
    'The thing I keep thinking about but never act on',
  ]

  try {
    const contextBlock =
      previousContext.length > 0
        ? `The user's previous answers (most recent first):\n${previousContext.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n`
        : ''

    const response = await Promise.race([
      getClient().messages.create({
        model: modelForKind('suggestion'),
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `${contextBlock}Generate exactly ${SUGGESTION_COUNT} short answer suggestions (1-2 sentences each) for this decision question: "${question}"

${previousContext.length > 0 ? 'Make suggestions specific to what the user has shared previously. Reference their words.' : 'Make suggestions relatable and specific, not generic.'}

Return ONLY a JSON array of ${SUGGESTION_COUNT} strings. No explanation, no markdown.`,
          },
        ],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI suggestion timeout')), SUGGESTION_TIMEOUT_MS),
      ),
    ])

    const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : ''

    if (!text) return genericFallback

    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed) || parsed.length < SUGGESTION_COUNT) return genericFallback

    return parsed.slice(0, SUGGESTION_COUNT).map((s: unknown) => String(s).slice(0, 200))
  } catch (error) {
    console.warn('[ai] Suggestion generation failed, using generic fallback:', error)
    return genericFallback
  }
}
