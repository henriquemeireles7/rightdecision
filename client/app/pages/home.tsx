/// <reference lib="dom" />
/**
 * Home — the first viewport answers "what do I do next" (continue-watching hero or
 * next live). Rails order (Lock-State UX): Continue Watching → Your Program (unlocked
 * course rails) → Lives → locked program rails BELOW the fold. Pre-start cohorts get
 * the warm welcome (localized start date + first live date), never empty rails.
 */
import { useState } from 'preact/hooks'
import { ContinueCard, PillBadge, PosterCard } from '../components/cards'
import { PreviewSheet } from '../components/preview-sheet'
import { Rail, RailItem } from '../components/rail'
import { EmptyState, ErrorState, RailSkeleton, Skeleton } from '../components/states'
import {
  type Catalog,
  type CatalogModule,
  fetchCatalog,
  fetchLives,
  isUnlockedLesson,
  type LiveItem,
} from '../lib/data'
import { calendarUrl, formatCountdown, formatScheduled, formatStartDate } from '../lib/format'
import { useQuery } from '../lib/use-query'
import { Link } from '../router'

function HomeSkeleton() {
  return (
    <div class="mx-auto max-w-[1200px] space-y-10 px-4 py-8">
      <Skeleton class="aspect-video w-full max-w-[640px]" label="Loading your library" />
      <RailSkeleton aspect="aspect-video" />
      <RailSkeleton />
    </div>
  )
}

const nextUpcomingLive = (lives: LiveItem[] | null): LiveItem | null =>
  lives?.find((live) => live.state === 'upcoming') ?? null

/** Pre-start welcome — start date, first live date, no empty rails (never an empty room). */
function PreStartWelcome({ startsAt, lives }: { startsAt: string; lives: LiveItem[] | null }) {
  const firstLive = nextUpcomingLive(lives)
  return (
    <section class="mx-auto max-w-[640px] px-4 py-16 text-center">
      <h1 class="font-display text-4xl text-ink">Welcome. You're in.</h1>
      <p class="mt-4 text-lg text-body">
        Your program begins on <strong class="text-ink">{formatStartDate(startsAt)}</strong>. There
        is nothing you need to do before then — the work starts when we start.
      </p>
      {firstLive ? (
        <div class="mt-8 rounded-lg border border-linen bg-sand p-6">
          <h2 class="font-display text-xl text-ink">Your first live session</h2>
          <p class="mt-2 text-body">{formatScheduled(firstLive.scheduledAt)}</p>
          <a
            href={calendarUrl(
              firstLive.title,
              firstLive.scheduledAt,
              firstLive.description ?? undefined,
            )}
            target="_blank"
            rel="noreferrer"
            class="mt-4 inline-block min-h-11 rounded-sm bg-gold px-6 py-2.5 font-medium text-ink motion-safe:transition-colors hover:bg-gold-hover"
          >
            Add it to your calendar
          </a>
        </div>
      ) : null}
    </section>
  )
}

/** The first-viewport answer: resume card, else next live, else start-here. */
function NextUp({ catalog, lives }: { catalog: Catalog; lives: LiveItem[] | null }) {
  const resume = catalog.continueWatching[0]
  if (resume) {
    return (
      <section aria-label="Next up" class="mb-10">
        <p class="text-sm font-medium uppercase tracking-wide text-muted">
          Pick up where you left off
        </p>
        <div class="mt-3">
          <ContinueCard
            title={resume.title}
            thumbnailKey={resume.thumbnailKey}
            secondsWatched={resume.secondsWatched}
            durationSeconds={resume.durationSeconds}
            href={`/app/lessons/${resume.lessonId}`}
          />
        </div>
      </section>
    )
  }
  const live = nextUpcomingLive(lives)
  if (live) {
    return (
      <section aria-label="Next up" class="mb-10 rounded-lg border border-linen bg-sand p-6">
        <p class="text-sm font-medium uppercase tracking-wide text-muted">Next live session</p>
        <h2 class="mt-1 font-display text-2xl text-ink">{live.title}</h2>
        <p class="mt-1 text-body">
          {formatScheduled(live.scheduledAt)} ·{' '}
          {formatCountdown(new Date(live.scheduledAt), new Date())}
        </p>
        <Link
          href="/app/lives"
          class="mt-3 inline-block font-medium text-gold-hover underline underline-offset-2"
        >
          See all lives
        </Link>
      </section>
    )
  }
  const firstProgram = catalog.programs.find((p) => p.unlocked)
  const firstLesson = firstProgram?.courses[0]?.modules[0]?.lessons.find(isUnlockedLesson)
  if (!firstLesson) return null
  return (
    <section aria-label="Next up" class="mb-10">
      <p class="text-sm font-medium uppercase tracking-wide text-muted">Start here</p>
      <h2 class="mt-1 font-display text-2xl text-ink">{firstLesson.title}</h2>
      <Link
        href={`/app/lessons/${firstLesson.id}`}
        class="mt-3 inline-block min-h-11 rounded-sm bg-gold px-6 py-2.5 font-medium text-ink motion-safe:transition-colors hover:bg-gold-hover"
      >
        Begin the first lesson
      </Link>
    </section>
  )
}

function moduleMeta(courseModule: CatalogModule): string {
  const count = courseModule.lessons.length
  return `${count} ${count === 1 ? 'lesson' : 'lessons'}`
}

function LiveRailCard({ live }: { live: LiveItem }) {
  return (
    <Link href="/app/lives" class="group block w-60">
      <div class="flex aspect-video w-full flex-col justify-between rounded-md border border-linen bg-sand p-4 motion-safe:transition-shadow group-hover:border-gold group-hover:shadow-md">
        <div>
          {live.state === 'live-now' ? (
            <span class="rounded-full bg-gold px-3 py-1 text-xs font-medium text-ink">
              Live now
            </span>
          ) : live.state === 'cancelled' ? (
            <span class="text-xs text-muted">Cancelled</span>
          ) : live.state === 'replay-ready' ? (
            <PillBadge label="Replay" />
          ) : (
            <PillBadge label="Upcoming" />
          )}
        </div>
        <p class="text-sm text-body">{formatScheduled(live.scheduledAt)}</p>
      </div>
      <span class="mt-2 block font-display text-lg leading-tight text-ink">{live.title}</span>
    </Link>
  )
}

export function HomePage() {
  const catalogQ = useQuery(fetchCatalog, [])
  const livesQ = useQuery(fetchLives, [])
  const [openModule, setOpenModule] = useState<{ module: CatalogModule; locked: boolean } | null>(
    null,
  )

  if (catalogQ.state.status === 'loading') return <HomeSkeleton />
  if (catalogQ.state.status === 'error') {
    return (
      <div class="px-4 py-16">
        <ErrorState
          what="We couldn't load your library"
          error={catalogQ.state.error}
          onRetry={catalogQ.retry}
        />
      </div>
    )
  }

  const catalog = catalogQ.state.data
  const lives = livesQ.state.status === 'ready' ? livesQ.state.data.lives : null

  if (catalog.cohortStartsAt && new Date(catalog.cohortStartsAt) > new Date()) {
    return <PreStartWelcome startsAt={String(catalog.cohortStartsAt)} lives={lives} />
  }

  const unlockedPrograms = catalog.programs.filter((p) => p.unlocked)
  const lockedPrograms = catalog.programs.filter((p) => !p.unlocked)

  if (catalog.programs.length === 0) {
    return (
      <div class="px-4 py-16">
        <EmptyState
          title="Your library is on its way"
          body="Your program content is being prepared. Check back shortly — or reach out and we'll sort it out."
          action={
            <a
              href="mailto:henry@rightdecision.io"
              class="font-medium text-gold-hover underline underline-offset-2"
            >
              Email us
            </a>
          }
        />
      </div>
    )
  }

  return (
    <div class="mx-auto max-w-[1200px] px-4 py-8">
      <h1 class="sr-only">Home</h1>
      <NextUp catalog={catalog} lives={lives} />
      <div class="space-y-12">
        {catalog.continueWatching.length > 0 ? (
          <Rail heading="Continue watching">
            {catalog.continueWatching.map((item) => (
              <RailItem key={item.lessonId}>
                <ContinueCard
                  title={item.title}
                  thumbnailKey={item.thumbnailKey}
                  secondsWatched={item.secondsWatched}
                  durationSeconds={item.durationSeconds}
                  href={`/app/lessons/${item.lessonId}`}
                />
              </RailItem>
            ))}
          </Rail>
        ) : null}

        {unlockedPrograms.flatMap((program) =>
          program.courses.map((course) => (
            <Rail key={course.id} heading={course.title}>
              {course.modules.map((courseModule) => (
                <RailItem key={courseModule.id}>
                  <PosterCard
                    title={courseModule.title}
                    coverImageKey={courseModule.coverImageKey}
                    meta={moduleMeta(courseModule)}
                    onOpen={() => setOpenModule({ module: courseModule, locked: false })}
                  />
                </RailItem>
              ))}
            </Rail>
          )),
        )}

        {lives && lives.length > 0 ? (
          <Rail heading="Lives">
            {lives.map((live) => (
              <RailItem key={live.id}>
                <LiveRailCard live={live} />
              </RailItem>
            ))}
          </Rail>
        ) : null}

        {/* Locked rails — BELOW the fold, full-color covers, pill badge, never a dead end */}
        {lockedPrograms.flatMap((program) =>
          program.courses.map((course) => (
            <Rail key={course.id} heading={program.name}>
              {course.modules.map((courseModule) => (
                <RailItem key={courseModule.id}>
                  <PosterCard
                    title={courseModule.title}
                    coverImageKey={courseModule.coverImageKey}
                    badge="Full program"
                    meta={moduleMeta(courseModule)}
                    onOpen={() => setOpenModule({ module: courseModule, locked: true })}
                  />
                </RailItem>
              ))}
            </Rail>
          )),
        )}
      </div>

      {openModule ? (
        <PreviewSheet
          module={openModule.module}
          locked={openModule.locked}
          onClose={() => setOpenModule(null)}
        />
      ) : null}
    </div>
  )
}
