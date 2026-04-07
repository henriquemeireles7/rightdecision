import { errors } from '@/platform/errors'

export type PipelineStatus =
  | 'queued' | 'transcribing' | 'transcribed'
  | 'selecting' | 'selected' | 'awaiting_clip_approval'
  | 'cutting' | 'cut' | 'generating_metadata'
  | 'metadata_ready' | 'awaiting_metadata_approval'
  | 'posting' | 'posted' | 'analyzing' | 'completed' | 'failed'

const validTransitions: Record<PipelineStatus, PipelineStatus[]> = {
  queued: ['transcribing', 'failed'],
  transcribing: ['transcribed', 'failed'],
  transcribed: ['selecting', 'failed'],
  selecting: ['selected', 'failed'],
  selected: ['awaiting_clip_approval', 'cutting', 'failed'],
  awaiting_clip_approval: ['cutting', 'failed'],
  cutting: ['cut', 'failed'],
  cut: ['generating_metadata', 'failed'],
  generating_metadata: ['metadata_ready', 'failed'],
  metadata_ready: ['awaiting_metadata_approval', 'posting', 'failed'],
  awaiting_metadata_approval: ['posting', 'failed'],
  posting: ['posted', 'failed'],
  posted: ['analyzing', 'completed', 'failed'],
  analyzing: ['completed', 'failed'],
  completed: [],
  failed: [
    'queued', 'transcribing', 'selecting', 'cutting', 'generating_metadata', 'posting', 'analyzing',
  ],
}

export function assertTransition(current: PipelineStatus, next: PipelineStatus): void {
  const allowed = validTransitions[current]
  if (!allowed || !allowed.includes(next)) {
    throw new InvalidTransitionError(current, next)
  }
}

export function getValidTransitions(status: PipelineStatus): PipelineStatus[] {
  return validTransitions[status] ?? []
}

export class InvalidTransitionError extends Error {
  constructor(
    public from: PipelineStatus,
    public to: PipelineStatus,
  ) {
    super(`Invalid status transition: ${from} → ${to}`)
    this.name = 'InvalidTransitionError'
  }
}
