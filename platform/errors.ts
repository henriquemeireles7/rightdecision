import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export const errors = {
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401, message: 'Authentication required' },
  FORBIDDEN: { code: 'FORBIDDEN', status: 403, message: 'Insufficient permissions' },
  SESSION_EXPIRED: { code: 'SESSION_EXPIRED', status: 401, message: 'Session expired' },
  PAYMENT_FAILED: {
    code: 'PAYMENT_FAILED',
    status: 402,
    message: 'Payment could not be processed',
  },
  NO_SUBSCRIPTION: { code: 'NO_SUBSCRIPTION', status: 403, message: 'Active purchase required' },
  NOT_FOUND: { code: 'NOT_FOUND', status: 404, message: 'Resource not found' },
  LESSON_LOCKED: { code: 'LESSON_LOCKED', status: 403, message: 'Complete previous lessons first' },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 400, message: 'Invalid input' },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', status: 500, message: 'Something went wrong' },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    status: 429,
    message: 'Too many requests, try again later',
  },
  ONBOARDING_SESSION_EXPIRED: {
    code: 'ONBOARDING_SESSION_EXPIRED',
    status: 410,
    message: 'Onboarding session has expired, please start again',
  },
  ONBOARDING_SESSION_NOT_FOUND: {
    code: 'ONBOARDING_SESSION_NOT_FOUND',
    status: 404,
    message: 'Onboarding session not found',
  },
  ONBOARDING_INCOMPLETE: {
    code: 'ONBOARDING_INCOMPLETE',
    status: 400,
    message: 'Please complete all onboarding steps first',
  },
  WIN_RATE_LIMITED: {
    code: 'WIN_RATE_LIMITED',
    status: 429,
    message: 'You can share up to 3 wins per day',
  },
  WIN_TOO_LONG: {
    code: 'WIN_TOO_LONG',
    status: 400,
    message: 'Win description must be 280 characters or less',
  },
  SUBSCRIPTION_REQUIRED: {
    code: 'SUBSCRIPTION_REQUIRED',
    status: 403,
    message: 'An active subscription is required',
  },
  SUBSCRIPTION_NOT_FOUND: {
    code: 'SUBSCRIPTION_NOT_FOUND',
    status: 404,
    message: 'Subscription not found',
  },
  MODULE_LOCKED: {
    code: 'MODULE_LOCKED',
    status: 403,
    message: 'Complete previous classes to unlock this content',
  },
  BOOKMARK_DUPLICATE: {
    code: 'BOOKMARK_DUPLICATE',
    status: 409,
    message: 'This class is already bookmarked',
  },
  CLASS_NOT_FOUND: {
    code: 'CLASS_NOT_FOUND',
    status: 404,
    message: 'Class not found',
  },
  COURSE_NOT_FOUND: {
    code: 'COURSE_NOT_FOUND',
    status: 404,
    message: 'Course not found',
  },
  // ─── LD Course: Micro-Decisions ───
  DECISION_LOCKED: {
    code: 'DECISION_LOCKED',
    status: 403,
    message: 'This decision can no longer be edited',
  },
  DECISION_NOT_FOUND: {
    code: 'DECISION_NOT_FOUND',
    status: 404,
    message: 'Decision not found',
  },
  DECISION_VALIDATION_ERROR: {
    code: 'DECISION_VALIDATION_ERROR',
    status: 400,
    message: 'Invalid decision data',
  },
  // ─── LD Course: Share ───
  SHARE_NOT_FOUND: {
    code: 'SHARE_NOT_FOUND',
    status: 404,
    message: 'Share content not found',
  },
  SHARE_GENERATION_FAILED: {
    code: 'SHARE_GENERATION_FAILED',
    status: 500,
    message: 'Failed to generate share image',
  },
  // ─── BD Pipeline: Generic ───
  PIPELINE_INVALID_STATE: {
    code: 'PIPELINE_INVALID_STATE',
    status: 409,
    message: 'Pipeline run is not in the correct state for this operation',
  },
  // ─── BD Pipeline: Transcribe (Step 1) ───
  TRANSCRIBE_VIDEO_NOT_FOUND: {
    code: 'TRANSCRIBE_VIDEO_NOT_FOUND',
    status: 404,
    message: 'Source video not found in storage',
  },
  TRANSCRIBE_INVALID_FORMAT: {
    code: 'TRANSCRIBE_INVALID_FORMAT',
    status: 400,
    message: 'Video format not supported. Use MP4, WebM, or WAV',
  },
  TRANSCRIBE_PROCESSING_FAILED: {
    code: 'TRANSCRIBE_PROCESSING_FAILED',
    status: 500,
    message: 'Transcription failed',
  },
  TRANSCRIBE_TIMEOUT: {
    code: 'TRANSCRIBE_TIMEOUT',
    status: 504,
    message: 'Transcription timed out',
  },
  TRANSCRIBE_EMPTY_RESULT: {
    code: 'TRANSCRIBE_EMPTY_RESULT',
    status: 422,
    message: 'Transcription returned no text',
  },
  // ─── BD Pipeline: Clip Select (Step 2) ───
  CLIP_SELECT_INVALID_STATE: {
    code: 'CLIP_SELECT_INVALID_STATE',
    status: 409,
    message: 'Pipeline run is not in the correct state for clip selection',
  },
  CLIP_SELECT_NO_TRANSCRIPT: {
    code: 'CLIP_SELECT_NO_TRANSCRIPT',
    status: 422,
    message: 'No transcript available for clip selection',
  },
  CLIP_SELECT_VALIDATION_FAILED: {
    code: 'CLIP_SELECT_VALIDATION_FAILED',
    status: 422,
    message: 'Clip selection data failed validation',
  },
  CLIP_SELECT_NO_CLIPS: {
    code: 'CLIP_SELECT_NO_CLIPS',
    status: 422,
    message: 'No viable clips found in transcript',
  },
  CLIP_SELECT_INVALID_TIMESTAMPS: {
    code: 'CLIP_SELECT_INVALID_TIMESTAMPS',
    status: 422,
    message: 'Clip timestamps exceed video duration',
  },
  // ─── BD Pipeline: Clip Cut (Step 3) ───
  CLIP_CUT_VIDEO_NOT_FOUND: {
    code: 'CLIP_CUT_VIDEO_NOT_FOUND',
    status: 404,
    message: 'Source video not found for cutting',
  },
  CLIP_CUT_FFMPEG_MISSING: {
    code: 'CLIP_CUT_FFMPEG_MISSING',
    status: 500,
    message: 'ffmpeg not available',
  },
  CLIP_CUT_PROCESSING_FAILED: {
    code: 'CLIP_CUT_PROCESSING_FAILED',
    status: 500,
    message: 'ffmpeg clip cutting failed',
  },
  CLIP_CUT_UPLOAD_FAILED: {
    code: 'CLIP_CUT_UPLOAD_FAILED',
    status: 502,
    message: 'Failed to upload cut clip to storage',
  },
  CLIP_CUT_NO_APPROVED_CLIPS: {
    code: 'CLIP_CUT_NO_APPROVED_CLIPS',
    status: 422,
    message: 'No approved clips to cut',
  },
  CLIP_CUT_PARTIAL_FAILURE: {
    code: 'CLIP_CUT_PARTIAL_FAILURE',
    status: 207,
    message: 'Some clips failed to cut',
  },
  // ─── BD Pipeline: Metadata Generate (Step 4) ───
  METADATA_NO_TRANSCRIPT: {
    code: 'METADATA_NO_TRANSCRIPT',
    status: 422,
    message: 'Clip has no transcript for metadata generation',
  },
  METADATA_VALIDATION_FAILED: {
    code: 'METADATA_VALIDATION_FAILED',
    status: 422,
    message: 'Metadata data failed validation',
  },
  METADATA_CHAR_LIMIT_EXCEEDED: {
    code: 'METADATA_CHAR_LIMIT_EXCEEDED',
    status: 422,
    message: 'Generated metadata exceeds platform character limit',
  },
  METADATA_UNKNOWN_PLATFORM: {
    code: 'METADATA_UNKNOWN_PLATFORM',
    status: 400,
    message: 'Unknown platform specified',
  },
  METADATA_ALREADY_EXISTS: {
    code: 'METADATA_ALREADY_EXISTS',
    status: 409,
    message: 'Metadata already generated for this clip and account',
  },
  // ─── BD Pipeline: Post Distribute (Step 5) ───
  POST_AUTH_FAILED: {
    code: 'POST_AUTH_FAILED',
    status: 401,
    message: 'Upload-Post authentication failed',
  },
  POST_RATE_LIMITED: {
    code: 'POST_RATE_LIMITED',
    status: 429,
    message: 'Posting rate limited, will retry',
  },
  POST_SERVICE_UNAVAILABLE: {
    code: 'POST_SERVICE_UNAVAILABLE',
    status: 503,
    message: 'Upload-Post service unavailable',
  },
  POST_CLIP_NOT_FOUND: {
    code: 'POST_CLIP_NOT_FOUND',
    status: 404,
    message: 'Clip file not found in storage',
  },
  POST_REJECTED: { code: 'POST_REJECTED', status: 422, message: 'Post rejected by platform' },
  POST_PLATFORM_ERROR: {
    code: 'POST_PLATFORM_ERROR',
    status: 422,
    message: 'Platform-specific posting error',
  },
  POST_PARTIAL_FAILURE: { code: 'POST_PARTIAL_FAILURE', status: 207, message: 'Some posts failed' },
  POST_MISSING_ID: {
    code: 'POST_MISSING_ID',
    status: 500,
    message: 'Post succeeded but no tracking ID returned',
  },
  // ─── BD Pipeline: Analytics Collect (Step 6) ───
  ANALYTICS_SERVICE_UNAVAILABLE: {
    code: 'ANALYTICS_SERVICE_UNAVAILABLE',
    status: 503,
    message: 'Analytics service unavailable',
  },
  ANALYTICS_POST_DELETED: {
    code: 'ANALYTICS_POST_DELETED',
    status: 410,
    message: 'Post no longer exists on platform',
  },
  ANALYTICS_RATE_LIMITED: {
    code: 'ANALYTICS_RATE_LIMITED',
    status: 429,
    message: 'Analytics API rate limited',
  },
  // ─── BD Pipeline: Insight Generate (Step 7) ───
  INSIGHT_NO_DATA: {
    code: 'INSIGHT_NO_DATA',
    status: 422,
    message: 'No analytics data in specified date range',
  },
  INSIGHT_INSUFFICIENT_DATA: {
    code: 'INSIGHT_INSUFFICIENT_DATA',
    status: 422,
    message: 'Not enough data for meaningful insights',
  },
  INSIGHT_VALIDATION_FAILED: {
    code: 'INSIGHT_VALIDATION_FAILED',
    status: 422,
    message: 'Insight data failed validation',
  },
  // ─── BD Pipeline: Workflow Orchestrator ───
  WORKFLOW_UPLOAD_FAILED: {
    code: 'WORKFLOW_UPLOAD_FAILED',
    status: 502,
    message: 'Video upload to storage failed',
  },
  WORKFLOW_INVALID_CONFIG: {
    code: 'WORKFLOW_INVALID_CONFIG',
    status: 400,
    message: 'Invalid workflow configuration',
  },
  WORKFLOW_DUPLICATE: {
    code: 'WORKFLOW_DUPLICATE',
    status: 409,
    message: 'A workflow is already running for this video',
  },
} as const satisfies Record<string, { code: string; status: number; message: string }>

export type ErrorCode = keyof typeof errors

export function throwError(c: Context, errorCode: ErrorCode, details?: string) {
  const { status, ...body } = errors[errorCode]
  return c.json(
    { ok: false as const, ...body, ...(details ? { details } : {}) },
    status as ContentfulStatusCode,
  )
}
