/// <reference lib="dom" />
/**
 * Course builder screens: courses list → course detail (ordered modules, up/down reorder —
 * boring beats drag-and-drop) → module detail (lessons with status chips). The lesson
 * editor lives in lesson-editor.tsx.
 */
import { useState } from 'preact/hooks'
import { CoverSection } from './covers'
import type { AdminCourse, AdminCourseDetail, AdminLesson, AdminModule } from './data'
import { useData } from './data'
import { navigate } from './router'
import {
  AutosaveText,
  buttonGhost,
  buttonPrimary,
  type ChipStatus,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  InlineError,
  inputClass,
  ListSkeleton,
  RouteLink,
  StatusChip,
  useAction,
  useLoad,
} from './ui'

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Published wins; otherwise the video pipeline state IS the lesson state. */
export function lessonChipStatus(lesson: AdminLesson): ChipStatus {
  if (lesson.status === 'published') return 'published'
  if (lesson.videoStatus === 'none') return 'draft'
  return lesson.videoStatus
}

// ─── Courses list ───

export function CoursesScreen() {
  const data = useData()
  const { state, reload } = useLoad(() => data.listCourses(), [])
  const [formOpen, setFormOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const create = useAction()

  async function submit() {
    const result = await create.run(() => data.createCourse({ slug, title }))
    if (result) navigate({ name: 'course', courseId: result.course.id })
  }

  const form = (
    <form
      class="mt-4 max-w-md space-y-3 rounded-md border border-linen bg-surface-white p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <div>
        <label class="block text-xs font-medium text-body" for="new-course-title">
          Title
        </label>
        <input
          id="new-course-title"
          class={`mt-1 ${inputClass}`}
          value={title}
          onInput={(e) => {
            const value = (e.currentTarget as HTMLInputElement).value
            setTitle(value)
            if (!slugTouched) setSlug(slugify(value))
          }}
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-body" for="new-course-slug">
          Slug
        </label>
        <input
          id="new-course-slug"
          class={`mt-1 ${inputClass}`}
          value={slug}
          onInput={(e) => {
            setSlugTouched(true)
            setSlug((e.currentTarget as HTMLInputElement).value)
          }}
        />
        <p class="mt-1 text-xs text-muted">Part of the course URL — lowercase and dashes.</p>
      </div>
      <div class="flex gap-2">
        <button
          type="submit"
          class={buttonPrimary}
          disabled={create.pending || title.trim() === '' || slug.trim() === ''}
        >
          {create.pending ? 'Creating…' : 'Create course'}
        </button>
        <button type="button" class={buttonGhost} onClick={() => setFormOpen(false)}>
          Cancel
        </button>
      </div>
      {create.error && <InlineError error={create.error} />}
    </form>
  )

  if (state.status === 'loading') return <ListSkeleton rows={4} />
  if (state.status === 'error')
    return <ErrorState message={state.message} detail={state.detail} onRetry={reload} />

  if (state.data.courses.length === 0) {
    return (
      <div>
        {!formOpen && (
          <EmptyState
            title="No courses yet"
            body="Courses hold your modules and lessons. Create the first one and build from there."
            actionLabel="Create your first course"
            onAction={() => setFormOpen(true)}
          />
        )}
        {formOpen && form}
      </div>
    )
  }

  return (
    <div>
      <div class="flex items-center justify-between">
        <h1 class="font-display text-2xl text-ink">Courses</h1>
        {!formOpen && (
          <button type="button" class={buttonPrimary} onClick={() => setFormOpen(true)}>
            New course
          </button>
        )}
      </div>
      {formOpen && form}
      <ul class="mt-4 divide-y divide-linen rounded-md border border-linen bg-surface-white">
        {state.data.courses.map((course) => (
          <li key={course.id} class="flex items-center justify-between px-4 py-3">
            <RouteLink
              route={{ name: 'course', courseId: course.id }}
              class="min-w-0 flex-1 text-sm font-medium text-ink hover:text-gold-hover"
            >
              {course.title}
              <span class="ml-2 text-xs font-normal text-muted">/{course.slug}</span>
            </RouteLink>
            <StatusChip status={course.status} />
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Reorderable row controls (shared by modules and lessons) ───

function ReorderButtons(props: {
  title: string
  index: number
  count: number
  pending: boolean
  onMove: (from: number, to: number) => void
}) {
  return (
    <span class="flex gap-1">
      <button
        type="button"
        class={buttonGhost}
        aria-label={`Move ${props.title} up`}
        disabled={props.pending || props.index === 0}
        onClick={() => props.onMove(props.index, props.index - 1)}
      >
        ↑
      </button>
      <button
        type="button"
        class={buttonGhost}
        aria-label={`Move ${props.title} down`}
        disabled={props.pending || props.index === props.count - 1}
        onClick={() => props.onMove(props.index, props.index + 1)}
      >
        ↓
      </button>
    </span>
  )
}

function moved<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  const [item] = next.splice(from, 1)
  if (item !== undefined) next.splice(to, 0, item)
  return next
}

// ─── Course detail ───

export function CourseDetailScreen({ courseId }: { courseId: string }) {
  const data = useData()
  const { state, reload, setData } = useLoad(
    () => Promise.all([data.getCourse(courseId), data.listCourses()]),
    [courseId],
  )
  const reorder = useAction()
  const addModule = useAction()
  const archive = useAction()
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [confirmArchive, setConfirmArchive] = useState(false)

  if (state.status === 'loading') return <ListSkeleton rows={5} />
  if (state.status === 'error')
    return <ErrorState message={state.message} detail={state.detail} onRetry={reload} />

  const [detail, list] = state.data
  const { course, modules } = detail
  const siblings = list.courses
    .filter((c: AdminCourse) => c.id !== course.id)
    .map((c: AdminCourse) => ({ id: c.id, title: c.title, key: c.coverImageKey }))

  const setDetail = (update: (d: AdminCourseDetail) => AdminCourseDetail) =>
    setData(([d, l]) => [update(d), l])

  async function move(from: number, to: number) {
    const nextModules = moved(modules, from, to)
    const ok = await reorder.run(() =>
      data.reorderModules(
        courseId,
        nextModules.map((m) => m.id),
      ),
    )
    if (ok) setDetail((d) => ({ ...d, modules: nextModules }))
  }

  async function submitModule() {
    const result = await addModule.run(() => data.createModule(courseId, { title: newModuleTitle }))
    if (result) {
      setDetail((d) => ({ ...d, modules: [...d.modules, { ...result.module, lessons: [] }] }))
      setNewModuleTitle('')
    }
  }

  return (
    <div class="space-y-6">
      <nav class="text-xs text-muted">
        <RouteLink route={{ name: 'courses' }} class="hover:text-ink">
          Courses
        </RouteLink>
        <span> / {course.title}</span>
      </nav>

      <header class="flex items-start justify-between gap-6">
        <div class="max-w-lg flex-1 space-y-3">
          <AutosaveText
            id="course-title"
            label="Course title"
            value={course.title}
            onSave={async (value) => {
              const result = await data.updateCourse(courseId, { title: value })
              setDetail((d) => ({ ...d, course: result.course }))
            }}
          />
          <AutosaveText
            id="course-description"
            label="Description"
            value={course.description}
            multiline
            onSave={async (value) => {
              const result = await data.updateCourse(courseId, { description: value || null })
              setDetail((d) => ({ ...d, course: result.course }))
            }}
          />
        </div>
        <div class="flex items-center gap-3">
          <StatusChip status={course.status} />
          {course.status !== 'archived' && (
            <button
              type="button"
              class={buttonGhost}
              disabled={archive.pending}
              onClick={() => setConfirmArchive(true)}
            >
              Archive
            </button>
          )}
        </div>
      </header>
      {archive.error && <InlineError error={archive.error} />}
      {confirmArchive && (
        <ConfirmDialog
          title="Archive this course?"
          body="Members lose access to it, but nothing is deleted — you can come back to it later."
          confirmLabel="Archive course"
          cancelLabel="Keep it"
          pending={archive.pending}
          onCancel={() => setConfirmArchive(false)}
          onConfirm={() => {
            void archive
              .run(() => data.archiveCourse(courseId), 'Course archived.')
              .then((result) => {
                if (result) setDetail((d) => ({ ...d, course: result.course }))
                setConfirmArchive(false)
              })
          }}
        />
      )}

      <CoverSection
        kind="course"
        targetId={course.id}
        targetTitle={course.title}
        currentKey={course.coverImageKey}
        siblings={siblings}
        onPicked={(key) =>
          setDetail((d) => ({ ...d, course: { ...d.course, coverImageKey: key } }))
        }
      />

      <section>
        <h2 class="font-display text-lg text-ink">Modules</h2>
        {reorder.error && <InlineError error={reorder.error} />}
        {modules.length === 0 ? (
          <p class="mt-3 rounded-md border border-linen bg-surface-white px-4 py-6 text-sm text-body">
            No modules yet — add the first one below. Modules group lessons into chapters.
          </p>
        ) : (
          <ol class="mt-3 divide-y divide-linen rounded-md border border-linen bg-surface-white">
            {modules.map((module: AdminModule, index: number) => (
              <li key={module.id} class="flex items-center gap-3 px-4 py-3">
                <span class="w-6 text-right text-xs text-muted">{index + 1}</span>
                <RouteLink
                  route={{ name: 'module', courseId, moduleId: module.id }}
                  class="min-w-0 flex-1 text-sm font-medium text-ink hover:text-gold-hover"
                >
                  {module.title}
                  <span class="ml-2 text-xs font-normal text-muted">
                    {module.lessons.length} lesson{module.lessons.length === 1 ? '' : 's'}
                  </span>
                </RouteLink>
                <StatusChip status={module.status} />
                <ReorderButtons
                  title={module.title}
                  index={index}
                  count={modules.length}
                  pending={reorder.pending}
                  onMove={(from, to) => void move(from, to)}
                />
              </li>
            ))}
          </ol>
        )}

        <form
          class="mt-3 flex max-w-md items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void submitModule()
          }}
        >
          <div class="flex-1">
            <label class="block text-xs font-medium text-body" for="new-module-title">
              New module title
            </label>
            <input
              id="new-module-title"
              class={`mt-1 ${inputClass}`}
              value={newModuleTitle}
              onInput={(e) => setNewModuleTitle((e.currentTarget as HTMLInputElement).value)}
            />
          </div>
          <button
            type="submit"
            class={buttonPrimary}
            disabled={addModule.pending || newModuleTitle.trim() === ''}
          >
            {addModule.pending ? 'Adding…' : 'Add module'}
          </button>
        </form>
        {addModule.error && <InlineError error={addModule.error} />}
      </section>
    </div>
  )
}

// ─── Module detail ───

export function ModuleDetailScreen({ courseId, moduleId }: { courseId: string; moduleId: string }) {
  const data = useData()
  const { state, reload, setData } = useLoad(() => data.getCourse(courseId), [courseId])
  const reorder = useAction()
  const addLesson = useAction()
  const [newLessonTitle, setNewLessonTitle] = useState('')

  if (state.status === 'loading') return <ListSkeleton rows={5} />
  if (state.status === 'error')
    return <ErrorState message={state.message} detail={state.detail} onRetry={reload} />

  const { course, modules } = state.data
  const module = modules.find((m: AdminModule) => m.id === moduleId)
  if (!module) {
    return (
      <ErrorState
        message="That module doesn't exist anymore."
        detail="It may have been removed in another tab. Go back to the course to see what's there."
        onRetry={reload}
      />
    )
  }

  const siblings = modules
    .filter((m: AdminModule) => m.id !== moduleId)
    .map((m: AdminModule) => ({ id: m.id, title: m.title, key: m.coverImageKey }))

  const setModule = (update: (m: AdminModule) => AdminModule) =>
    setData((d) => ({
      ...d,
      modules: d.modules.map((m: AdminModule) => (m.id === moduleId ? update(m) : m)),
    }))

  async function move(from: number, to: number) {
    const nextLessons = moved(module?.lessons ?? [], from, to)
    const ok = await reorder.run(() =>
      data.reorderLessons(
        moduleId,
        nextLessons.map((l) => l.id),
      ),
    )
    if (ok) setModule((m) => ({ ...m, lessons: nextLessons }))
  }

  async function submitLesson() {
    const result = await addLesson.run(() => data.createLesson(moduleId, { title: newLessonTitle }))
    if (result) {
      setModule((m) => ({ ...m, lessons: [...m.lessons, result.lesson] }))
      setNewLessonTitle('')
    }
  }

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
        <span> / {module.title}</span>
      </nav>

      <div class="max-w-lg space-y-3">
        <AutosaveText
          id="module-title"
          label="Module title"
          value={module.title}
          onSave={async (value) => {
            const result = await data.updateModule(moduleId, { title: value })
            setModule((m) => ({ ...m, ...result.module }))
          }}
        />
        <AutosaveText
          id="module-description"
          label="Description"
          value={module.description}
          multiline
          onSave={async (value) => {
            const result = await data.updateModule(moduleId, { description: value || null })
            setModule((m) => ({ ...m, ...result.module }))
          }}
        />
      </div>

      <CoverSection
        kind="module"
        targetId={module.id}
        targetTitle={module.title}
        currentKey={module.coverImageKey}
        siblings={siblings}
        onPicked={(key) => setModule((m) => ({ ...m, coverImageKey: key }))}
      />

      <section>
        <h2 class="font-display text-lg text-ink">Lessons</h2>
        {reorder.error && <InlineError error={reorder.error} />}
        {module.lessons.length === 0 ? (
          <p class="mt-3 rounded-md border border-linen bg-surface-white px-4 py-6 text-sm text-body">
            No lessons yet — add the first one below, then open it to upload its video.
          </p>
        ) : (
          <ol class="mt-3 divide-y divide-linen rounded-md border border-linen bg-surface-white">
            {module.lessons.map((lesson: AdminLesson, index: number) => (
              <li key={lesson.id} class="flex items-center gap-3 px-4 py-3">
                <span class="w-6 text-right text-xs text-muted">{index + 1}</span>
                <RouteLink
                  route={{ name: 'lesson', courseId, moduleId, lessonId: lesson.id }}
                  class="min-w-0 flex-1 text-sm font-medium text-ink hover:text-gold-hover"
                >
                  {lesson.title}
                </RouteLink>
                <StatusChip status={lessonChipStatus(lesson)} />
                <ReorderButtons
                  title={lesson.title}
                  index={index}
                  count={module.lessons.length}
                  pending={reorder.pending}
                  onMove={(from, to) => void move(from, to)}
                />
              </li>
            ))}
          </ol>
        )}

        <form
          class="mt-3 flex max-w-md items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void submitLesson()
          }}
        >
          <div class="flex-1">
            <label class="block text-xs font-medium text-body" for="new-lesson-title">
              New lesson title
            </label>
            <input
              id="new-lesson-title"
              class={`mt-1 ${inputClass}`}
              value={newLessonTitle}
              onInput={(e) => setNewLessonTitle((e.currentTarget as HTMLInputElement).value)}
            />
          </div>
          <button
            type="submit"
            class={buttonPrimary}
            disabled={addLesson.pending || newLessonTitle.trim() === ''}
          >
            {addLesson.pending ? 'Adding…' : 'Add lesson'}
          </button>
        </form>
        {addLesson.error && <InlineError error={addLesson.error} />}
      </section>
    </div>
  )
}
