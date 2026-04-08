import { z } from 'zod'

export const workflowConfigSchema = z.object({
  dryRun: z.boolean().default(false),
  autoApproveClips: z.boolean().default(true),
  autoApproveMetadata: z.boolean().default(true),
  maxClipsPerEpisode: z.number().min(1).max(30).default(15),
  clipScoreThreshold: z.number().min(1).max(10).default(6),
  targetPlatforms: z.array(z.string()).optional(),
  targetAccountIds: z.array(z.string().uuid()).optional(),
  schedulingMode: z.enum(['immediate', 'scheduled']).default('immediate'),
})

export type WorkflowConfig = z.infer<typeof workflowConfigSchema>

export const defaultConfig: WorkflowConfig = workflowConfigSchema.parse({})
