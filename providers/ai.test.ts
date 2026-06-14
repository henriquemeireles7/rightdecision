import { describe, expect, it, mock, spyOn } from 'bun:test'

// Mock the Anthropic SDK before importing
mock.module('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: mock(() =>
        Promise.resolve({
          content: [
            {
              type: 'text',
              text: '["Making the career change","Having the money talk","Saying no"]',
            },
          ],
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      ),
      // chat() streams; provided so importing the module never touches the network.
      stream: mock(() => (async function* () {})()),
    }
  },
}))

// Must import AFTER mock
const { generateSuggestions, modelForKind, AI_MODELS } = await import('./ai')
type AiKind = import('./ai').AiKind
type ChatChunk = import('./ai').ChatChunk
type ChatParams = import('./ai').ChatParams

describe('generateSuggestions', () => {
  it('returns 3 suggestions on success', async () => {
    const result = await generateSuggestions("What's one area where you feel stuck?", [])
    expect(result).toHaveLength(3)
    expect(result[0]).toContain('career')
  })

  it('returns generic fallback on empty response', async () => {
    const mod = await import('@anthropic-ai/sdk')
    const instance = new mod.default()
    spyOn(instance.messages, 'create').mockResolvedValueOnce({
      content: [{ type: 'text', text: '' }],
    } as never)

    const result = await generateSuggestions('test', [])
    expect(result).toHaveLength(3)
  })

  it('returns generic fallback on malformed JSON', async () => {
    const mod = await import('@anthropic-ai/sdk')
    const instance = new mod.default()
    spyOn(instance.messages, 'create').mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not json' }],
    } as never)

    const result = await generateSuggestions('test', [])
    expect(result).toHaveLength(3)
  })

  it('includes previous context in prompt', async () => {
    const result = await generateSuggestions("What's blocking you?", [
      'Career feels stuck',
      'Want to change jobs',
    ])
    expect(result).toHaveLength(3)
  })
})

describe('model tiering (ADR 10)', () => {
  it('chat (advice) uses the LARGE model', () => {
    expect(modelForKind('chat')).toBe(AI_MODELS.large)
  })

  it('interview, distill, suggestion use the SMALL model', () => {
    for (const kind of ['interview', 'distill', 'suggestion'] as AiKind[]) {
      expect(modelForKind(kind)).toBe(AI_MODELS.small)
    }
  })

  it('LARGE and SMALL are distinct (a cheap kind never hits the large model)', () => {
    expect(AI_MODELS.large).not.toBe(AI_MODELS.small)
  })
})

/**
 * The fixture provider the feature layer injects in place of the live chat().
 * Satisfies the exact AsyncIterable<ChatChunk> contract: text chunks then ONE terminal
 * `done` frame. ALL stream tests iterate this — never a socket.
 */
export function fixtureChat(
  texts: string[],
  usage = { inputTokens: 100, outputTokens: 50 },
): (params: ChatParams) => AsyncIterable<ChatChunk> {
  return (params) =>
    (async function* () {
      for (const text of texts) yield { type: 'text', text }
      yield {
        type: 'done',
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        model: modelForKind(params.kind),
      }
    })()
}

describe('chat AsyncIterable contract (the fixture seam)', () => {
  it('yields text chunks then exactly one terminal done frame', async () => {
    const provider = fixtureChat(['Hel', 'lo'], { inputTokens: 42, outputTokens: 7 })
    const chunks: ChatChunk[] = []
    for await (const chunk of provider({ kind: 'chat', system: 's', messages: [] })) {
      chunks.push(chunk)
    }
    expect(chunks).toEqual([
      { type: 'text', text: 'Hel' },
      { type: 'text', text: 'lo' },
      { type: 'done', inputTokens: 42, outputTokens: 7, model: AI_MODELS.large },
    ])
  })

  it('a mid-stream throw (severed socket) propagates with no terminal done frame', async () => {
    async function* dropping(): AsyncIterable<ChatChunk> {
      yield { type: 'text', text: 'partial' }
      throw new Error('socket severed')
    }
    const seen: ChatChunk[] = []
    let threw = false
    try {
      for await (const chunk of dropping()) seen.push(chunk)
    } catch {
      threw = true
    }
    expect(threw).toBe(true)
    expect(seen).toEqual([{ type: 'text', text: 'partial' }])
    expect(seen.some((c) => c.type === 'done')).toBe(false)
  })
})
