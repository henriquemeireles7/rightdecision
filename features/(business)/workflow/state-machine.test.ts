import { describe, expect, it } from 'bun:test'
import {
  assertTransition,
  getValidTransitions,
  InvalidTransitionError,
  type PipelineStatus,
} from './state-machine'

describe('assertTransition', () => {
  it('allows queued → transcribing', () => {
    expect(() => assertTransition('queued', 'transcribing')).not.toThrow()
  })

  it('allows transcribed → selecting', () => {
    expect(() => assertTransition('transcribed', 'selecting')).not.toThrow()
  })

  it('allows selected → cutting (auto-approve)', () => {
    expect(() => assertTransition('selected', 'cutting')).not.toThrow()
  })

  it('allows selected → awaiting_clip_approval', () => {
    expect(() => assertTransition('selected', 'awaiting_clip_approval')).not.toThrow()
  })

  it('allows metadata_ready → posting (auto-approve)', () => {
    expect(() => assertTransition('metadata_ready', 'posting')).not.toThrow()
  })

  it('allows metadata_ready → awaiting_metadata_approval', () => {
    expect(() => assertTransition('metadata_ready', 'awaiting_metadata_approval')).not.toThrow()
  })

  it('allows any step to transition to failed', () => {
    const steps: PipelineStatus[] = [
      'queued',
      'transcribing',
      'transcribed',
      'selecting',
      'selected',
      'cutting',
      'cut',
      'generating_metadata',
      'metadata_ready',
      'posting',
      'posted',
    ]
    for (const step of steps) {
      expect(() => assertTransition(step, 'failed')).not.toThrow()
    }
  })

  it('allows failed to retry by transitioning back to step statuses', () => {
    expect(() => assertTransition('failed', 'transcribing')).not.toThrow()
    expect(() => assertTransition('failed', 'selecting')).not.toThrow()
    expect(() => assertTransition('failed', 'cutting')).not.toThrow()
  })

  it('throws on invalid transition: queued → posting', () => {
    expect(() => assertTransition('queued', 'posting')).toThrow(InvalidTransitionError)
  })

  it('throws on invalid transition: completed → transcribing', () => {
    expect(() => assertTransition('completed', 'transcribing')).toThrow(InvalidTransitionError)
  })

  it('throws on invalid transition: transcribing → cutting (skipping steps)', () => {
    expect(() => assertTransition('transcribing', 'cutting')).toThrow(InvalidTransitionError)
  })
})

describe('getValidTransitions', () => {
  it('returns valid transitions for queued', () => {
    const transitions = getValidTransitions('queued')
    expect(transitions).toContain('transcribing')
    expect(transitions).toContain('failed')
    expect(transitions).not.toContain('posting')
  })

  it('returns empty array for completed', () => {
    expect(getValidTransitions('completed')).toEqual([])
  })
})
