/// <reference lib="dom" />
/**
 * Distribution data layer — the BD pipeline endpoints (already mounted under /api/*) plus the
 * Project-7 admin glue module. Same injectable seam as createAdminData: screens consume it via
 * DataContext, tests inject scripted fakes per method. NEVER hand-rolled fetch — every call goes
 * through the api-client (unwrap).
 *
 * The admin glue module (features/(admin)/distribution/routes.ts) is mounted by the founder at
 * /api/admin/distribution. Because it is not yet in AppRoutes, we type a dedicated sub-client
 * from its exported route type — browser-safe (`import type` only), fully typed.
 */

import type { adminDistributionRoutes } from '@/features/(admin)/distribution/routes'
import { api, createApiClient, unwrap } from '@/features/(shared)/api-client'

/** The flow the founder chose — recorded in the run config; routes nothing server-side. */
export type DistributionFlow = 'short' | 'long'

export function createDistributionData(
  client: typeof api = api,
  distClient = createApiClient<typeof adminDistributionRoutes>('/api/admin/distribution'),
) {
  const runs = client.api['pipeline-runs']
  return {
    // ─── Runs (existing transcribe/pipeline-run endpoints) ───
    listRuns: () => unwrap(runs.$get({ query: {} })),
    /** Aggregated run + clips + posts (admin glue) — one read for the dashboard. */
    getRun: (runId: string) => unwrap(distClient.runs[':runId'].$get({ param: { runId } })),
    listClips: (runId: string) => unwrap(runs[':id'].clips.$get({ param: { id: runId } })),

    // ─── Video ingest → start run ───
    requestVideoUploadUrl: (json: { fileName: string; mimeType: string }) =>
      unwrap(distClient['upload-url'].$post({ json })),
    /** videoUrl is the R2 KEY returned by requestVideoUploadUrl; flow is recorded in config. */
    startRun: (json: { videoUrl: string; flow: DistributionFlow }) =>
      unwrap(runs.$post({ json: { videoUrl: json.videoUrl, config: { flow: json.flow } } })),
    processRun: (runId: string) => unwrap(runs[':id'].process.$post({ param: { id: runId } })),

    // ─── Approval gate (admin glue — the only writer of clips.approved) ───
    setClipApproval: (runId: string, clipId: string, approved: boolean) =>
      unwrap(
        distClient.runs[':runId'].clips[':clipId'].approval.$patch({
          param: { runId, clipId },
          json: { approved },
        }),
      ),

    // ─── Distribute approved clips (existing post-distribute endpoint) ───
    distribute: (runId: string) =>
      unwrap(client.api['post-distribute'].$post({ json: { pipelineRunId: runId } })),
  }
}

export type DistributionData = ReturnType<typeof createDistributionData>

// Inferred row aliases (types flow from the routes — never defined manually).
export type DistributionRun = Awaited<ReturnType<DistributionData['listRuns']>>[number]
export type DistributionRunDetail = Awaited<ReturnType<DistributionData['getRun']>>
export type DistributionClip = DistributionRunDetail['clips'][number]
export type DistributionPost = DistributionRunDetail['posts'][number]
