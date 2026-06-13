/**
 * Typed data access for every page — the ONLY place the SPA touches the API.
 * Types flow from AppRoutes (hono/client RPC) through unwrap(); no manual response types.
 */
import { unwrap } from '@/features/(shared)/api-client'
import { getApi, getApiFetch } from './api'

export function fetchCatalog() {
  return unwrap(getApi().api.catalog.$get())
}

export function fetchLives() {
  return unwrap(getApi().api.lives.$get())
}

export function fetchMaterials() {
  return unwrap(getApi().api.materials.$get())
}

export function fetchMaterialDownloadUrl(materialId: string) {
  return unwrap(
    getApi().api.materials[':materialId']['download-url'].$get({ param: { materialId } }),
  )
}

export function fetchLesson(lessonId: string) {
  return unwrap(getApi().api.player.lessons[':lessonId'].$get({ param: { lessonId } }))
}

export function answerDecisionPrompt(lessonId: string, answer: string) {
  return unwrap(
    getApi().api.player.lessons[':lessonId'].answer.$post({
      param: { lessonId },
      json: { answer },
    }),
  )
}

export function fetchLiveReplay(liveId: string) {
  return unwrap(getApi().api.lives[':liveId'].replay.$get({ param: { liveId } }))
}

export function postWatchEvents(events: Array<{ lessonId: string; secondsWatched: number }>) {
  return unwrap(getApi().api['watch-events'].$post({ json: { events } }))
}

export type Catalog = Awaited<ReturnType<typeof fetchCatalog>>
export type CatalogProgram = Catalog['programs'][number]
export type CatalogCourse = CatalogProgram['courses'][number]
export type CatalogModule = CatalogCourse['modules'][number]
export type CatalogLesson = CatalogModule['lessons'][number]
export type ContinueWatchingItem = Catalog['continueWatching'][number]
export type LiveItem = Awaited<ReturnType<typeof fetchLives>>['lives'][number]
export type MaterialItem = Awaited<ReturnType<typeof fetchMaterials>>['materials'][number]
export type LessonPayload = Awaited<ReturnType<typeof fetchLesson>>

/** Locked lessons carry only { id, title } (Lock-State UX) — narrow on a marker field. */
export function isUnlockedLesson(
  lesson: CatalogLesson,
): lesson is Extract<CatalogLesson, { videoStatus: unknown }> {
  return 'videoStatus' in lesson
}

/** "Decisions made" = completed lessons (answering the prompt completes, ADR 1). */
export function countDecisionsMade(catalog: Catalog): number {
  let count = 0
  for (const program of catalog.programs) {
    if (!program.unlocked) continue
    for (const course of program.courses) {
      for (const courseModule of course.modules) {
        for (const lesson of courseModule.lessons) {
          if (isUnlockedLesson(lesson) && lesson.progress?.completedAt) count++
        }
      }
    }
  }
  return count
}

/** POST /api/subscription/portal is registered statement-style (no RPC schema) — go through the wrapper. */
export async function fetchBillingPortalUrl(): Promise<string> {
  const data = (await unwrap(
    await getApiFetch()('/api/subscription/portal', { method: 'POST' }),
  )) as { url?: string }
  if (!data.url) throw new Error('No portal URL returned')
  return data.url
}

/** better-auth sign-out (untyped in AppRoutes) — cookie-credentialed wrapper fetch. */
export async function signOut(): Promise<void> {
  await getApiFetch()('/api/auth/sign-out', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
}
