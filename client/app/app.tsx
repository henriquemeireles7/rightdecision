/// <reference lib="dom" />
/**
 * AppRoot — route switch inside the shell. Pages own their containers so the
 * lesson/replay ink canvas can run full-bleed (ADR 19).
 */

import { Shell } from './components/shell'
import { EmptyState } from './components/states'
import { ChatPage } from './pages/chat'
import { HomePage } from './pages/home'
import { JournalPage } from './pages/journal'
import { LessonPage } from './pages/lesson'
import { LiveReplayPage } from './pages/live-replay'
import { LivesPage } from './pages/lives'
import { MaterialsPage } from './pages/materials'
import { PlaybookPage } from './pages/playbook'
import { PlaybookPageView } from './pages/playbook-page'
import { Link, useRoute } from './router'

function Page({ route }: { route: ReturnType<typeof useRoute> }) {
  switch (route.name) {
    case 'home':
      return <HomePage />
    case 'lesson':
      return <LessonPage lessonId={route.lessonId} />
    case 'playbook':
      return <PlaybookPage />
    case 'playbook-page':
      return <PlaybookPageView templateId={route.templateId} pageId={route.pageId} />
    case 'journal':
      return <JournalPage />
    case 'lives':
      return <LivesPage />
    case 'live':
      return <LiveReplayPage liveId={route.liveId} />
    case 'materials':
      return <MaterialsPage />
    case 'chat':
      return <ChatPage />
    case 'chat-conversation':
      return <ChatPage conversationId={route.conversationId} />
    case 'not-found':
      return (
        <div class="px-4 py-16">
          <EmptyState
            title="That page isn't here"
            body="The link may be old, or this part of the program hasn't opened yet."
            action={
              <Link
                href="/app"
                class="min-h-11 rounded-sm bg-gold px-6 py-2.5 font-medium text-ink motion-safe:transition-colors hover:bg-gold-hover"
              >
                Back to Home
              </Link>
            }
          />
        </div>
      )
  }
}

export function AppRoot() {
  const route = useRoute()
  return (
    <Shell route={route}>
      <Page route={route} />
    </Shell>
  )
}
