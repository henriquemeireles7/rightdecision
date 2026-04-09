import { describe, expect, it } from 'bun:test'
import { splitIntoSegments } from './content'

describe('splitIntoSegments', () => {
  it('returns single segment for content with no decision blocks', () => {
    const content = '# Hello World\n\nSome content here.'
    const segments = splitIntoSegments(content)
    expect(segments).toHaveLength(1)
    expect(segments[0]!.type).toBe('content')
    expect(segments[0]!.content).toContain('Hello World')
  })

  it('splits content at decision block markers', () => {
    const content = `Some intro text.

:::decision-block{question="What area feels stuck?" blockId="q1"}

Some follow-up text.`

    const segments = splitIntoSegments(content)
    expect(segments).toHaveLength(3)
    expect(segments[0]!.type).toBe('content')
    expect(segments[0]!.content).toContain('intro text')
    expect(segments[1]!.type).toBe('decision-block')
    expect(segments[1]!.block!.question).toBe('What area feels stuck?')
    expect(segments[1]!.block!.blockId).toBe('q1')
    expect(segments[2]!.type).toBe('content')
    expect(segments[2]!.content).toContain('follow-up text')
  })

  it('handles multiple decision blocks', () => {
    const content = `Intro.

:::decision-block{question="Q1?" blockId="b1"}

Middle.

:::decision-block{question="Q2?" blockId="b2"}

End.`

    const segments = splitIntoSegments(content)
    expect(segments).toHaveLength(5)
    expect(segments[0]!.type).toBe('content')
    expect(segments[1]!.type).toBe('decision-block')
    expect(segments[1]!.block!.blockId).toBe('b1')
    expect(segments[2]!.type).toBe('content')
    expect(segments[3]!.type).toBe('decision-block')
    expect(segments[3]!.block!.blockId).toBe('b2')
    expect(segments[4]!.type).toBe('content')
  })

  it('skips malformed markers (missing attributes)', () => {
    const content = `Before.

:::decision-block{question="Q1?"}

After.`

    const segments = splitIntoSegments(content)
    // Malformed marker (no blockId) → treated as plain content, but marker line is consumed
    // The function returns content before + content after, marker is skipped
    expect(segments.length).toBeGreaterThanOrEqual(2)
  })

  it('handles empty content', () => {
    const segments = splitIntoSegments('')
    expect(segments).toHaveLength(0)
  })

  it('handles content with only whitespace between blocks', () => {
    const content = `:::decision-block{question="Q1?" blockId="b1"}

:::decision-block{question="Q2?" blockId="b2"}`

    const segments = splitIntoSegments(content)
    const blockCount = segments.filter((s) => s.type === 'decision-block').length
    expect(blockCount).toBe(2)
  })
})
