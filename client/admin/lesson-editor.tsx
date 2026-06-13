/// <reference lib="dom" />
/**
 * Lesson editor: autosave fields, tus video upload, captions step, 16:9 thumbnail and the
 * publish gate. The UI EXPLAINS the publish invariant (video ready + captions + decision
 * prompt) as inline reasons; the API ENFORCES it. While the video is processing we poll
 * (~10s) so "ready" appears without the co-founder doing anything.
 */
import { useEffect } from 'preact/hooks'
import { lessonChipStatus } from './courses'
import { CoverSection } from './covers'
import type { AdminLesson, AdminModule } from './data'
import { useData } from './data'
import {
  AutosaveText,
  buttonPrimary,
  buttonSecondary,
  ErrorState,
  InlineError,
  InlineSuccess,
  ListSkeleton,
  RouteLink,
  StatusChip,
  useAction,
  useLoad,
} from './ui'
import { VideoUpload } from './video-upload'

/** Mirror of the API's publish invariant — explanation only, enforcement stays server-side. */
export function publishBlockers(lesson: AdminLesson): string[] {
  const blockers: string[] = []
  if (lesson.videoStatus !== 'ready') {
    blockers.push("Video isn't ready yet — upload a video and wait for processing to finish.")
  }
  if (!lesson.captionsReady) {
    blockers.push(
      "Captions aren't ready — generate them once the video is ready, then mark them ready.",
    )
  }
  if (!lesson.decisionPrompt) {
    blockers.push('Add a decision prompt — every lesson needs one before it can publish.')
  }
  return blockers
}

export function LessonEditorScreen(props: {
  courseId: string
  moduleId: string
  lessonId: string
  pollIntervalMs?: number
}) {
  const data = useData()
  const { courseId, moduleId, lessonId } = props
  const pollIntervalMs = props.pollIntervalMs ?? 10_000
  const { state, reload, setData } = useLoad(() => data.getCourse(courseId), [courseId])
  const publish = useAction()
  const captionsGenerate = useAction()
  const captionsReady = useAction()

  const loadedLesson =
    state.status === 'ready'
      ? state.data.modules
          .find((m: AdminModule) => m.id === moduleId)
          ?.lessons.find((l: AdminLesson) => l.id === lessonId)
      : undefined

  const setLesson = (update: (l: AdminLesson) => AdminLesson) =>
    setData((d) => ({
      ...d,
      modules: d.modules.map((m: AdminModule) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l: AdminLesson) => (l.id === lessonId ? update(l) : l)),
            }
          : m,
      ),
    }))

  // Poll while the video pipeline is in flight — Stream's webhook flips it to ready/error.
  const videoStatus = loadedLesson?.videoStatus
  useEffect(() => {
    if (videoStatus !== 'processing' && videoStatus !== 'uploading') return
    const timer = setInterval(() => {
      void data
        .getCourse(courseId)
        .then((fresh) => {
          const freshLesson = fresh.modules
            .find((m) => m.id === moduleId)
            ?.lessons.find((l) => l.id === lessonId)
          if (freshLesson) setLesson(() => freshLesson)
        })
        .catch(() => {
          // transient poll failure — keep polling; the screen-level state is untouched
        })
    }, pollIntervalMs)
    return () => clearInterval(timer)
  }, [videoStatus, courseId, moduleId, lessonId, pollIntervalMs])

  if (state.status === 'loading') return <ListSkeleton rows={6} />
  if (state.status === 'error')
    return <ErrorState message={state.message} detail={state.detail} onRetry={reload} />

  const { course, modules } = state.data
  const module = modules.find((m: AdminModule) => m.id === moduleId)
  const lesson = loadedLesson
  if (!module || !lesson) {
    return (
      <ErrorState
        message="That lesson doesn't exist anymore."
        detail="It may have been removed in another tab. Go back to the module to see what's there."
        onRetry={reload}
      />
    )
  }

  const thumbnailSiblings = module.lessons
    .filter((l: AdminLesson) => l.id !== lessonId)
    .map((l: AdminLesson) => ({ id: l.id, title: l.title, key: l.thumbnailKey }))
  const blockers = publishBlockers(lesson)
  const isPublished = lesson.status === 'published'

  return (
    <div class="space-y-6">
      <nav class="text-xs text-muted">
        <RouteLink route={{ name: 'courses' }} class="hover:text-ink">
          Courses
        </RouteLink>
        <span> / </span>
        <RouteLink route={{ name: 'course', courseId }} class="hover:text-ink">
          {course.title}
        </RouteLink>
        <span> / </span>
        <RouteLink route={{ name: 'module', courseId, moduleId }} class="hover:text-ink">
          {module.title}
        </RouteLink>
        <span> / {lesson.title}</span>
      </nav>

      <header class="flex items-center gap-3">
        <h1 class="font-display text-2xl text-ink">{lesson.title}</h1>
        <StatusChip status={lessonChipStatus(lesson)} />
      </header>

      <div class="max-w-lg space-y-3">
        <AutosaveText
          id="lesson-title"
          label="Lesson title"
          value={lesson.title}
          onSave={async (value) => {
            const result = await data.updateLesson(lessonId, { title: value })
            setLesson(() => result.lesson)
          }}
        />
        <AutosaveText
          id="lesson-description"
          label="Description"
          value={lesson.description}
          multiline
          onSave={async (value) => {
            const result = await data.updateLesson(lessonId, { description: value || null })
            setLesson(() => result.lesson)
          }}
        />
        <AutosaveText
          id="lesson-decision-prompt"
          label="Decision prompt"
          value={lesson.decisionPrompt}
          multiline
          placeholder="The one decision this lesson asks her to make."
          onSave={async (value) => {
            const result = await data.updateLesson(lessonId, { decisionPrompt: value || null })
            setLesson(() => result.lesson)
          }}
        />
      </div>

      <section class="rounded-md border border-linen bg-surface-white p-5">
        <h3 class="text-sm font-semibold text-ink">Video</h3>
        <div class="mt-3">
          <VideoUpload
            label="Lesson video"
            status={lesson.videoStatus}
            requestUploadUrl={(bytes) => data.requestLessonUploadUrl(lessonId, bytes)}
            onUploadComplete={() => setLesson((l) => ({ ...l, videoStatus: 'processing' }))}
          />
        </div>
      </section>

      <section class="rounded-md border border-linen bg-surface-white p-5">
        <div class="flex items-center gap-3">
          <h3 class="text-sm font-semibold text-ink">Captions</h3>
          <StatusChip status={lesson.captionsReady ? 'ready' : 'draft'} />
          <span class="text-xs text-muted">
            {lesson.captionsReady ? 'Captions ready' : 'No captions yet'}
          </span>
        </div>
        <div class="mt-3 flex items-center gap-2">
          <button
            type="button"
            class={buttonSecondary}
            disabled={lesson.videoStatus !== 'ready' || captionsGenerate.pending}
            onClick={() =>
              void captionsGenerate.run(
                () => data.generateCaptions(lessonId),
                'Captions are generating — usually a few minutes. Once they look right in Stream, mark them ready.',
              )
            }
          >
            {captionsGenerate.pending ? 'Requesting…' : 'Generate captions'}
          </button>
          {!lesson.captionsReady && (
            <button
              type="button"
              class={buttonSecondary}
              disabled={captionsReady.pending}
              onClick={() =>
                void captionsReady
                  .run(() => data.setCaptionsReady(lessonId, true), 'Captions marked ready.')
                  .then((result) => {
                    if (result) setLesson(() => result.lesson)
                  })
              }
            >
              {captionsReady.pending ? 'Saving…' : 'Mark captions ready'}
            </button>
          )}
        </div>
        {lesson.videoStatus !== 'ready' && (
          <p class="mt-2 text-xs text-muted">
            Captions become available once the video finishes processing.
          </p>
        )}
        {captionsGenerate.success && <InlineSuccess message={captionsGenerate.success} />}
        {captionsGenerate.error && <InlineError error={captionsGenerate.error} />}
        {captionsReady.success && <InlineSuccess message={captionsReady.success} />}
        {captionsReady.error && <InlineError error={captionsReady.error} />}
      </section>

      <CoverSection
        kind="lesson"
        targetId={lesson.id}
        targetTitle={lesson.title}
        currentKey={lesson.thumbnailKey}
        siblings={thumbnailSiblings}
        onPicked={(key) => setLesson((l) => ({ ...l, thumbnailKey: key }))}
      />

      <section class="rounded-md border border-linen bg-surface-white p-5">
        <h3 class="text-sm font-semibold text-ink">Publish</h3>
        {isPublished ? (
          <p class="mt-2 text-sm text-success">This lesson is live for members.</p>
        ) : (
          <>
            {blockers.length > 0 && (
              <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-body">
                {blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            )}
            <button
              type="button"
              class={`${buttonPrimary} mt-4`}
              disabled={blockers.length > 0 || publish.pending}
              onClick={() =>
                void publish
                  .run(() => data.publishLesson(lessonId))
                  .then((result) => {
                    if (result) setLesson(() => result.lesson)
                  })
              }
            >
              {publish.pending ? 'Publishing…' : 'Publish lesson'}
            </button>
            {publish.error && <InlineError error={publish.error} />}
          </>
        )}
      </section>
    </div>
  )
}
