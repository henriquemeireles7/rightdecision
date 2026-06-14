import { z } from 'zod'

export const workflowConfigSchema = z.object({
  // Distribution flow chosen in the admin UI: 'short' → clips → TikTok/IG/Shorts,
  // 'long' → YouTube. Recorded on the run; no separate column (P7).
  flow: z.enum(['short', 'long']).optional(),
  dryRun: z.boolean().default(false),
  autoApproveClips: z.boolean().default(true),
  autoApproveMetadata: z.boolean().default(true),
  maxClipsPerEpisode: z.number().min(1).max(30).default(15),
  clipScoreThreshold: z.number().min(1).max(10).default(6),
  targetPlatforms: z.array(z.string()).optional(),
  targetAccountIds: z.array(z.string().uuid()).optional(),
  schedulingMode: z.enum(['immediate', 'scheduled']).default('immediate'),
})
