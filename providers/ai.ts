import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/platform/env'

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

const SUGGESTION_TIMEOUT_MS = 10_000
const SUGGESTION_COUNT = 3

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
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
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
