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
        }),
      ),
    }
  },
}))

// Must import AFTER mock
const { generateSuggestions } = await import('./ai')

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
