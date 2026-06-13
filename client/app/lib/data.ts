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

// ─── Playbook (P5 — ADR 20 book UX) ───

export function fetchPlaybook() {
  return unwrap(getApi().api.playbook.$get())
}

export function fetchPlaybookPage(templateId: string, pageId: string) {
  return unwrap(
    getApi().api.playbook[':templateId'].pages[':pageId'].$get({ param: { templateId, pageId } }),
  )
}

/** Autosave write path — upserts one answer row (blur/debounce call this). */
export function savePlaybookAnswer(templateId: string, fieldId: string, value: string) {
  return unwrap(
    getApi().api.playbook[':templateId'].answers.$put({
      param: { templateId },
      json: { fieldId, value },
    }),
  )
}

/** Print-ready HTML export — opened in a new tab, browser print-to-PDF. */
export function playbookExportUrl(templateId: string): string {
  return `/api/playbook/${templateId}/export`
}

// ─── Journal (P5 — cumulative counts, NO streaks anywhere) ───

export function fetchJournal(range: { from?: string; to?: string } = {}) {
  return unwrap(getApi().api.journal.$get({ query: range }))
}

/** entryDate is the CLIENT-computed local calendar day (todayLocalDate). */
export function saveJournalEntry(entry: {
  entryDate: string
  kind: 'morning' | 'evening'
  content: string
}) {
  return unwrap(getApi().api.journal.entries.$put({ json: entry }))
}

export function fetchLiveReplay(liveId: string) {
  return unwrap(getApi().api.lives[':liveId'].replay.$get({ param: { liveId } }))
}

// ─── AI Chat (P6 — context-assembled advice; SSE streaming send) ───
// These go through the raw api-client fetch (still mockable via setApiFetchForTests) rather
// than the typed hc<AppRoutes> RPC, because the /api/chat + /api/interview routes are mounted
// by the parent router in the same PR — the local response shapes below mirror the route
// success payloads exactly (service.ts return types).

export type ChatMessageView = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}
export type ConversationView = {
  conversation: { id: string; kind: 'chat' | 'interview'; title: string | null }
  messages: ChatMessageView[]
  notTherapy: string
}
export type ConversationListItem = { id: string; title: string | null; updatedAt: string }

async function getJson<T>(path: string): Promise<T> {
  return (await unwrap(getApiFetch()(path, { method: 'GET' }))) as T
}

export function fetchConversations() {
  return getJson<{ conversations: ConversationListItem[]; notTherapy: string }>('/api/chat')
}

export function fetchConversation(conversationId: string) {
  return getJson<ConversationView>(`/api/chat/${conversationId}`)
}

export type SendChatEvents = {
  onToken: (text: string) => void
  onDone: (info: { conversationId: string; crisis: boolean; dropped: boolean }) => void
  onError: (code: string) => void
}

/**
 * Send a chat message over SSE. The typed RPC client can't stream, so this goes through the
 * raw api-client fetch (mockable via the same setApiFetchForTests seam). It parses the SSE
 * `event:`/`data:` frames: `token` → onToken, `done` → onDone, `error` → onError. A network
 * drop mid-stream surfaces as onError('STREAM_DROPPED') so the caller refetches the conversation.
 */
export async function sendChatMessage(
  input: { conversationId?: string; message: string },
  events: SendChatEvents,
): Promise<void> {
  const response = await getApiFetch()('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (response.status === 429) {
    events.onError('AI_BUDGET_EXCEEDED')
    return
  }
  if (!response.body) {
    events.onError('STREAM_DROPPED')
    return
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          const data = line.slice(5).replace(/^ /, '')
          if (currentEvent === 'token') events.onToken(data)
          else if (currentEvent === 'error') events.onError(data)
          else if (currentEvent === 'done') {
            try {
              events.onDone(JSON.parse(data))
            } catch {
              events.onError('STREAM_DROPPED')
            }
          }
        }
      }
    }
  } catch {
    // The stream dropped mid-flight (deploy severed it) — nothing was persisted server-side;
    // the caller treats this as retriable and refetches the conversation.
    events.onError('STREAM_DROPPED')
  }
}

// ─── Interview (P6 — ADR 11 distill → confirm trust flow) ───

export type InterviewView = {
  interview: {
    id: string
    status: 'active' | 'distilling' | 'awaiting_confirmation' | 'confirmed' | 'abandoned'
    pageId: string
    documentId: string
    distilledFields: Record<string, string>
  }
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  return (await unwrap(
    getApiFetch()(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  )) as T
}

export function startInterview(input: { documentId: string; pageId: string }) {
  return postJson<{ interview: { id: string }; conversationId: string }>('/api/interview', input)
}

export function fetchInterview(interviewId: string) {
  return getJson<InterviewView>(`/api/interview/${interviewId}`)
}

export function distillInterview(interviewId: string) {
  return postJson<{ status: string; distilledFields: Record<string, string> }>(
    `/api/interview/${interviewId}/distill`,
  )
}

export function confirmInterview(interviewId: string, acceptedFieldIds: string[]) {
  return postJson<{ status: string; confirmedFieldIds: string[] }>(
    `/api/interview/${interviewId}/confirm`,
    { acceptedFieldIds },
  )
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
export type Playbook = Awaited<ReturnType<typeof fetchPlaybook>>
export type PlaybookDocument = Playbook['documents'][number]
export type PlaybookPagePayload = Awaited<ReturnType<typeof fetchPlaybookPage>>
export type PlaybookPageField = PlaybookPagePayload['page']['fields'][number]
export type Journal = Awaited<ReturnType<typeof fetchJournal>>
export type JournalEntry = Journal['entries'][number]
export type JournalCounts = Journal['counts']

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
