/// <reference lib="dom" />
/**
 * Programs: list/create/edit (tier, status) + program content mapping — which courses and
 * materials each program includes. Removing a course REVOKES member access (that's the
 * point), so removal confirms first.
 */
import { useState } from 'preact/hooks'
import { slugify } from './courses'
import type { AdminCourse, AdminMaterial, AdminProgramDetail } from './data'
import { useData } from './data'
import { navigate } from './router'
import {
  AutosaveText,
  buttonGhost,
  buttonPrimary,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  InlineError,
  InlineSuccess,
  inputClass,
  ListSkeleton,
  RouteLink,
  StatusChip,
  useAction,
  useLoad,
} from './ui'

// ─── Programs list ───

export function ProgramsScreen() {
  const data = useData()
  const { state, reload } = useLoad(() => data.listPrograms(), [])
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [tier, setTier] = useState<'free' | 'paid'>('paid')
  const create = useAction()

  async function submit() {
    const result = await create.run(() => data.createProgram({ slug, name, tier }))
    if (result) navigate({ name: 'program', programId: result.program.id })
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
        <label class="block text-xs font-medium text-body" for="new-program-name">
          Name
        </label>
        <input
          id="new-program-name"
          class={`mt-1 ${inputClass}`}
          value={name}
          onInput={(e) => {
            const value = (e.currentTarget as HTMLInputElement).value
            setName(value)
            if (!slugTouched) setSlug(slugify(value))
          }}
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-body" for="new-program-slug">
          Slug
        </label>
        <input
          id="new-program-slug"
          class={`mt-1 ${inputClass}`}
          value={slug}
          onInput={(e) => {
            setSlugTouched(true)
            setSlug((e.currentTarget as HTMLInputElement).value)
          }}
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-body" for="new-program-tier">
          Tier
        </label>
        <select
          id="new-program-tier"
          class={`mt-1 ${inputClass}`}
          value={tier}
          onChange={(e) => setTier((e.currentTarget as HTMLSelectElement).value as 'free' | 'paid')}
        >
          <option value="free">Free (cohort program)</option>
          <option value="paid">Paid (annual program)</option>
        </select>
      </div>
      <div class="flex gap-2">
        <button
          type="submit"
          class={buttonPrimary}
          disabled={create.pending || name.trim() === '' || slug.trim() === ''}
        >
          {create.pending ? 'Creating…' : 'Create program'}
        </button>
        <button type="button" class={buttonGhost} onClick={() => setFormOpen(false)}>
          Cancel
        </button>
      </div>
      {create.error && <InlineError error={create.error} />}
    </form>
  )

  if (state.status === 'loading') return <ListSkeleton rows={3} />
  if (state.status === 'error')
    return <ErrorState message={state.message} detail={state.detail} onRetry={reload} />

  if (state.data.programs.length === 0) {
    return (
      <div>
        {!formOpen && (
          <EmptyState
            title="No programs yet"
            body="Programs are how members enter — the free monthly cohort and the paid annual program both live here."
            actionLabel="Create your first program"
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
        <h1 class="font-display text-2xl text-ink">Programs</h1>
        {!formOpen && (
          <button type="button" class={buttonPrimary} onClick={() => setFormOpen(true)}>
            New program
          </button>
        )}
      </div>
      {formOpen && form}
      <ul class="mt-4 divide-y divide-linen rounded-md border border-linen bg-surface-white">
        {state.data.programs.map((program) => (
          <li key={program.id} class="flex items-center justify-between gap-3 px-4 py-3">
            <RouteLink
              route={{ name: 'program', programId: program.id }}
              class="min-w-0 flex-1 text-sm font-medium text-ink hover:text-gold-hover"
            >
              {program.name}
              <span class="ml-2 text-xs font-normal text-muted">/{program.slug}</span>
            </RouteLink>
            <StatusChip status={program.tier} />
            <StatusChip status={program.status} />
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Program detail (content mapping) ───

export function ProgramDetailScreen({ programId }: { programId: string }) {
  const data = useData()
  const { state, reload, setData } = useLoad(
    () =>
      Promise.all([
        data.getProgram(programId),
        data.listCourses(),
        data.listProgramMaterials(programId),
        data.listMaterials(),
      ]),
    [programId],
  )
  const settings = useAction()
  const courseAttach = useAction()
  const courseRemove = useAction()
  const materialAttach = useAction()
  const materialRemove = useAction()
  const [attachCourseId, setAttachCourseId] = useState('')
  const [attachMaterialId, setAttachMaterialId] = useState('')
  const [removingCourse, setRemovingCourse] = useState<{ id: string; title: string } | null>(null)

  if (state.status === 'loading') return <ListSkeleton rows={6} />
  if (state.status === 'error')
    return <ErrorState message={state.message} detail={state.detail} onRetry={reload} />

  const [detail, allCourses, programMaterials, allMaterials] = state.data
  const { program } = detail
  const attachedCourseIds = new Set(detail.courses.map((c) => c.id))
  const attachableCourses = allCourses.courses.filter(
    (c: AdminCourse) => !attachedCourseIds.has(c.id),
  )
  const attachedMaterialIds = new Set(programMaterials.materials.map((m) => m.id))
  const attachableMaterials = allMaterials.materials.filter(
    (m: AdminMaterial) => !attachedMaterialIds.has(m.id),
  )

  const setDetail = (update: (d: AdminProgramDetail) => AdminProgramDetail) =>
    setData(([d, c, pm, m]) => [update(d), c, pm, m])
  const setProgramMaterials = (update: (m: AdminMaterial[]) => AdminMaterial[]) =>
    setData(([d, c, pm, m]) => [d, c, { materials: update(pm.materials) }, m])

  async function saveSettings(patch: {
    tier?: 'free' | 'paid'
    status?: 'draft' | 'active' | 'archived'
  }) {
    const result = await settings.run(() => data.updateProgram(programId, patch), 'Saved')
    if (result) setDetail((d) => ({ ...d, program: result.program }))
  }

  async function attachCourse() {
    if (!attachCourseId) return
    const course = attachableCourses.find((c) => c.id === attachCourseId)
    const result = await courseAttach.run(
      () => data.addCourseToProgram(programId, attachCourseId),
      'Course attached — members of this program can now access it.',
    )
    if (result && course) {
      setDetail((d) => ({
        ...d,
        courses: [...d.courses, { ...course, sortOrder: result.mapping.sortOrder }],
      }))
      setAttachCourseId('')
    }
  }

  async function removeCourse(courseId: string) {
    const result = await courseRemove.run(
      () => data.removeCourseFromProgram(programId, courseId),
      'Course removed from this program.',
    )
    if (result) setDetail((d) => ({ ...d, courses: d.courses.filter((c) => c.id !== courseId) }))
    setRemovingCourse(null)
  }

  async function moveCourse(from: number, to: number) {
    const next = [...detail.courses]
    const [item] = next.splice(from, 1)
    if (item === undefined) return
    next.splice(to, 0, item)
    const result = await courseAttach.run(() =>
      data.reorderProgramCourses(
        programId,
        next.map((c) => c.id),
      ),
    )
    if (result) setDetail((d) => ({ ...d, courses: next }))
  }

  async function attachMaterial() {
    if (!attachMaterialId) return
    const material = attachableMaterials.find((m) => m.id === attachMaterialId)
    const result = await materialAttach.run(
      () => data.addMaterialToProgram(programId, attachMaterialId),
      'Material attached.',
    )
    if (result && material) {
      setProgramMaterials((materials) => [...materials, material])
      setAttachMaterialId('')
    }
  }

  async function removeMaterial(materialId: string) {
    const result = await materialRemove.run(
      () => data.removeMaterialFromProgram(programId, materialId),
      'Material removed from this program.',
    )
    if (result) setProgramMaterials((materials) => materials.filter((m) => m.id !== materialId))
  }

  return (
    <div class="space-y-6">
      <nav class="text-xs text-muted">
        <RouteLink route={{ name: 'programs' }} class="hover:text-ink">
          Programs
        </RouteLink>
        <span> / {program.name}</span>
      </nav>

      <header class="flex items-start justify-between gap-6">
        <div class="max-w-lg flex-1 space-y-3">
          <AutosaveText
            id="program-name"
            label="Program name"
            value={program.name}
            onSave={async (value) => {
              const result = await data.updateProgram(programId, { name: value })
              setDetail((d) => ({ ...d, program: result.program }))
            }}
          />
          <AutosaveText
            id="program-description"
            label="Description"
            value={program.description}
            multiline
            onSave={async (value) => {
              const result = await data.updateProgram(programId, { description: value || null })
              setDetail((d) => ({ ...d, program: result.program }))
            }}
          />
        </div>
        <div class="w-48 space-y-3">
          <div>
            <label class="block text-xs font-medium text-body" for="program-tier">
              Tier
            </label>
            <select
              id="program-tier"
              class={`mt-1 ${inputClass}`}
              value={program.tier}
              disabled={settings.pending}
              onChange={(e) =>
                void saveSettings({
                  tier: (e.currentTarget as HTMLSelectElement).value as 'free' | 'paid',
                })
              }
            >
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-body" for="program-status">
              Status
            </label>
            <select
              id="program-status"
              class={`mt-1 ${inputClass}`}
              value={program.status}
              disabled={settings.pending}
              onChange={(e) =>
                void saveSettings({
                  status: (e.currentTarget as HTMLSelectElement).value as
                    | 'draft'
                    | 'active'
                    | 'archived',
                })
              }
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {settings.pending && <p class="text-xs text-muted">Saving…</p>}
          {settings.success && <InlineSuccess message={settings.success} />}
          {settings.error && <InlineError error={settings.error} />}
        </div>
      </header>

      <section>
        <h2 class="font-display text-lg text-ink">Courses in this program</h2>
        <p class="mt-1 text-xs text-muted">
          Attaching a course gives every member of this program access to it; removing revokes it.
        </p>
        {detail.courses.length === 0 ? (
          <p class="mt-3 rounded-md border border-linen bg-surface-white px-4 py-6 text-sm text-body">
            No courses in this program yet — attach one below so members have something to watch.
          </p>
        ) : (
          <ol class="mt-3 divide-y divide-linen rounded-md border border-linen bg-surface-white">
            {detail.courses.map((course, index) => (
              <li key={course.id} class="flex items-center gap-3 px-4 py-3">
                <span class="w-6 text-right text-xs text-muted">{index + 1}</span>
                <span class="min-w-0 flex-1 text-sm font-medium text-ink">{course.title}</span>
                <span class="flex gap-1">
                  <button
                    type="button"
                    class={buttonGhost}
                    aria-label={`Move ${course.title} up`}
                    disabled={courseAttach.pending || index === 0}
                    onClick={() => void moveCourse(index, index - 1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    class={buttonGhost}
                    aria-label={`Move ${course.title} down`}
                    disabled={courseAttach.pending || index === detail.courses.length - 1}
                    onClick={() => void moveCourse(index, index + 1)}
                  >
                    ↓
                  </button>
                </span>
                <button
                  type="button"
                  class={buttonGhost}
                  aria-label={`Remove ${course.title}`}
                  disabled={courseRemove.pending}
                  onClick={() => setRemovingCourse({ id: course.id, title: course.title })}
                >
                  Remove
                </button>
              </li>
            ))}
          </ol>
        )}
        <div class="mt-3 flex max-w-md items-end gap-2">
          <div class="flex-1">
            <label class="block text-xs font-medium text-body" for="attach-course">
              Attach a course
            </label>
            <select
              id="attach-course"
              class={`mt-1 ${inputClass}`}
              value={attachCourseId}
              onChange={(e) => setAttachCourseId((e.currentTarget as HTMLSelectElement).value)}
            >
              <option value="">Choose a course…</option>
              {attachableCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            class={buttonPrimary}
            disabled={courseAttach.pending || attachCourseId === ''}
            onClick={() => void attachCourse()}
          >
            {courseAttach.pending ? 'Attaching…' : 'Attach course'}
          </button>
        </div>
        {courseAttach.success && <InlineSuccess message={courseAttach.success} />}
        {courseAttach.error && <InlineError error={courseAttach.error} />}
        {courseRemove.success && <InlineSuccess message={courseRemove.success} />}
        {courseRemove.error && <InlineError error={courseRemove.error} />}
      </section>

      {removingCourse && (
        <ConfirmDialog
          title={`Remove ${removingCourse.title} from this program?`}
          body="Members of this program will lose access to this course immediately. The course itself is not deleted."
          confirmLabel="Remove course"
          cancelLabel="Keep it"
          pending={courseRemove.pending}
          onCancel={() => setRemovingCourse(null)}
          onConfirm={() => void removeCourse(removingCourse.id)}
        />
      )}

      <section>
        <h2 class="font-display text-lg text-ink">Materials in this program</h2>
        {programMaterials.materials.length === 0 ? (
          <p class="mt-3 rounded-md border border-linen bg-surface-white px-4 py-6 text-sm text-body">
            No materials in this program yet — upload them on the Materials screen, then attach them
            here.
          </p>
        ) : (
          <ul class="mt-3 divide-y divide-linen rounded-md border border-linen bg-surface-white">
            {programMaterials.materials.map((material) => (
              <li key={material.id} class="flex items-center gap-3 px-4 py-3">
                <span class="min-w-0 flex-1 text-sm font-medium text-ink">{material.title}</span>
                <button
                  type="button"
                  class={buttonGhost}
                  aria-label={`Remove ${material.title}`}
                  disabled={materialRemove.pending}
                  onClick={() => void removeMaterial(material.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <div class="mt-3 flex max-w-md items-end gap-2">
          <div class="flex-1">
            <label class="block text-xs font-medium text-body" for="attach-material">
              Attach a material
            </label>
            <select
              id="attach-material"
              class={`mt-1 ${inputClass}`}
              value={attachMaterialId}
              onChange={(e) => setAttachMaterialId((e.currentTarget as HTMLSelectElement).value)}
            >
              <option value="">Choose a material…</option>
              {attachableMaterials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.title}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            class={buttonPrimary}
            disabled={materialAttach.pending || attachMaterialId === ''}
            onClick={() => void attachMaterial()}
          >
            {materialAttach.pending ? 'Attaching…' : 'Attach material'}
          </button>
        </div>
        {materialAttach.success && <InlineSuccess message={materialAttach.success} />}
        {materialAttach.error && <InlineError error={materialAttach.error} />}
        {materialRemove.success && <InlineSuccess message={materialRemove.success} />}
        {materialRemove.error && <InlineError error={materialRemove.error} />}
      </section>
    </div>
  )
}
