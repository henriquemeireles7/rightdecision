/// <reference lib="dom" />
/**
 * Document template screens (P5): the list (program, version, status) and the
 * chapter → page → field tree editor for the Life Playbook / Starter Notebook.
 * Field ids are generated from the label slug ONCE and shown read-only — the UI
 * EXPLAINS the publish contract (ids frozen; add/deprecate, never rename/retype/
 * delete) while the API ENFORCES it; API validation errors surface verbatim.
 */
import { useState } from 'preact/hooks'
import { slugify } from './courses'
import type { AdminProgram, AdminTemplate, AdminTemplateField, AdminTemplateSchema } from './data'
import { useData } from './data'
import { navigate } from './router'
import {
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  Chip,
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

type FieldKind = AdminTemplateField['kind']

const FIELD_KINDS: FieldKind[] = [
  'short_text',
  'long_text',
  'select',
  'multi_select',
  'date',
  'scale_1_10',
]

const isSelectKind = (kind: FieldKind) => kind === 'select' || kind === 'multi_select'

/** Slug a label into a stable id ONCE, suffixing on collision. Never re-derived. */
export function uniqueChildId(label: string, taken: Set<string>): string {
  const base = slugify(label) || 'field'
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

const allFieldIds = (schema: AdminTemplateSchema): Set<string> =>
  new Set(
    schema.chapters.flatMap((chapter) =>
      chapter.pages.flatMap((page) => page.fields.map((field) => field.id)),
    ),
  )

const allNodeIds = (schema: AdminTemplateSchema): Set<string> =>
  new Set(
    schema.chapters.flatMap((chapter) => [chapter.id, ...chapter.pages.map((page) => page.id)]),
  )

// ─── Templates list ───

export function TemplatesScreen() {
  const data = useData()
  const { state, reload } = useLoad(async () => {
    const [{ templates }, { programs }] = await Promise.all([
      data.listTemplates(),
      data.listPrograms(),
    ])
    return { templates, programs }
  }, [])
  const [formOpen, setFormOpen] = useState(false)

  if (state.status === 'loading') return <ListSkeleton rows={4} />
  if (state.status === 'error')
    return <ErrorState message={state.message} detail={state.detail} onRetry={reload} />

  const { templates, programs } = state.data
  const programName = (id: string) => programs.find((program) => program.id === id)?.name ?? '—'

  const form = formOpen ? (
    <NewTemplateForm programs={programs} onClose={() => setFormOpen(false)} />
  ) : null

  if (templates.length === 0) {
    return (
      <div>
        {!formOpen && (
          <EmptyState
            title="No templates yet"
            body="Templates are the books your members fill in — the Life Playbook and the Starter Notebook start here."
            actionLabel="Create your first template"
            onAction={() => setFormOpen(true)}
          />
        )}
        {form}
      </div>
    )
  }

  return (
    <section>
      <div class="flex items-center justify-between">
        <h1 class="font-display text-2xl text-ink">Templates</h1>
        <button type="button" class={buttonPrimary} onClick={() => setFormOpen(true)}>
          New template
        </button>
      </div>
      {form}
      <ul class="mt-6 divide-y divide-linen rounded-md border border-linen bg-surface-white">
        {templates.map((template) => (
          <li key={template.id} class="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <RouteLink
                route={{ name: 'template', templateId: template.id }}
                class="font-medium text-ink hover:underline"
              >
                {template.title}
              </RouteLink>
              <p class="text-sm text-body">{programName(template.programId)}</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm text-muted">v{template.version}</span>
              <StatusChip status={template.status} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function NewTemplateForm({ programs, onClose }: { programs: AdminProgram[]; onClose: () => void }) {
  const data = useData()
  const [title, setTitle] = useState('')
  const [programId, setProgramId] = useState('')
  const create = useAction()

  async function submit() {
    const chosenProgram = programId || programs[0]?.id
    if (!chosenProgram) return
    const result = await create.run(() =>
      data.createTemplate({
        programId: chosenProgram,
        slug: slugify(title),
        title: title.trim(),
        schema: { chapters: [] },
      }),
    )
    if (result) navigate({ name: 'template', templateId: result.template.id })
  }

  return (
    <form
      class="mt-4 max-w-md space-y-3 rounded-md border border-linen bg-surface-white p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <div>
        <label class="block text-xs font-medium text-body" for="new-template-program">
          Program
        </label>
        <select
          id="new-template-program"
          class={`mt-1 ${inputClass}`}
          value={programId || programs[0]?.id || ''}
          onChange={(e) => setProgramId((e.currentTarget as HTMLSelectElement).value)}
        >
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-body" for="new-template-title">
          Title
        </label>
        <input
          id="new-template-title"
          class={`mt-1 ${inputClass}`}
          value={title}
          onInput={(e) => setTitle((e.currentTarget as HTMLInputElement).value)}
        />
        <p class="mt-1 text-xs text-muted">
          The book's name members see — "Life Playbook", "Starter Notebook".
        </p>
      </div>
      <div class="flex gap-2">
        <button
          type="submit"
          class={buttonPrimary}
          disabled={create.pending || title.trim() === ''}
        >
          {create.pending ? 'Creating…' : 'Create template'}
        </button>
        <button type="button" class={buttonGhost} onClick={onClose}>
          Cancel
        </button>
      </div>
      {create.error && <InlineError error={create.error} />}
    </form>
  )
}

// ─── Template editor (chapter → page → field tree) ───

export function TemplateEditorScreen({ templateId }: { templateId: string }) {
  const data = useData()
  const { state, reload, setData } = useLoad(() => data.getTemplate(templateId), [templateId])

  if (state.status === 'loading') return <ListSkeleton rows={6} />
  if (state.status === 'error')
    return <ErrorState message={state.message} detail={state.detail} onRetry={reload} />

  return (
    <TemplateEditor
      template={state.data.template}
      onUpdate={(template) => setData(() => ({ template }))}
    />
  )
}

function TemplateEditor({
  template,
  onUpdate,
}: {
  template: AdminTemplate
  onUpdate: (template: AdminTemplate) => void
}) {
  const data = useData()
  const [title, setTitle] = useState(template.title)
  const [schema, setSchema] = useState<AdminTemplateSchema>(() => structuredClone(template.schema))
  const [confirming, setConfirming] = useState(false)
  const save = useAction()
  const publish = useAction()

  const published = template.status === 'published'
  const nextVersion = template.version + 1
  // The publish contract: ids that exist in the SERVER copy of a published template are frozen.
  const lockedIds = published ? allFieldIds(template.schema) : new Set<string>()
  // Server-stamped deprecations are permanent; only local intent can be restored.
  const serverDeprecated = new Map(
    template.schema.chapters.flatMap((chapter) =>
      chapter.pages.flatMap((page) =>
        page.fields
          .filter((field) => field.deprecatedInVersion != null)
          .map((field) => [field.id, field.deprecatedInVersion] as const),
      ),
    ),
  )

  const patchField = (ci: number, pi: number, fi: number, patch: Partial<AdminTemplateField>) =>
    setSchema((s) => ({
      chapters: s.chapters.map((chapter, i) =>
        i !== ci
          ? chapter
          : {
              ...chapter,
              pages: chapter.pages.map((page, j) =>
                j !== pi
                  ? page
                  : {
                      ...page,
                      fields: page.fields.map((field, k) =>
                        k !== fi ? field : { ...field, ...patch },
                      ),
                    },
              ),
            },
      ),
    }))

  const patchPage = (
    ci: number,
    pi: number,
    patch: Partial<AdminTemplateSchema['chapters'][number]['pages'][number]>,
  ) =>
    setSchema((s) => ({
      chapters: s.chapters.map((chapter, i) =>
        i !== ci
          ? chapter
          : {
              ...chapter,
              pages: chapter.pages.map((page, j) => (j !== pi ? page : { ...page, ...patch })),
            },
      ),
    }))

  async function doSave() {
    const result = await save.run(
      () => data.updateTemplate(template.id, { title: title.trim(), schema }),
      'Saved',
    )
    if (result) onUpdate(result.template)
  }

  return (
    <section>
      <div class="flex items-end justify-between gap-4">
        <div class="flex-1">
          <label class="block text-xs font-medium text-body" for="template-title">
            Template title
          </label>
          <input
            id="template-title"
            class={`mt-1 ${inputClass}`}
            value={title}
            onInput={(e) => setTitle((e.currentTarget as HTMLInputElement).value)}
          />
        </div>
        <div class="flex items-center gap-3 pb-1">
          <span class="text-sm text-muted">v{template.version}</span>
          <StatusChip status={template.status} />
        </div>
      </div>

      {published && (
        <p class="mt-3 rounded-md bg-sand px-3 py-2 text-sm text-body">
          This template is live. Field ids are frozen — add new fields or deprecate existing ones.
          Saving structural changes creates version {nextVersion}; members keep the version they
          started on.
        </p>
      )}

      <div class="mt-6 space-y-6">
        {schema.chapters.map((chapter, ci) => {
          const chapterLocked = chapter.pages.some((page) =>
            page.fields.some((field) => lockedIds.has(field.id)),
          )
          return (
            <section key={chapter.id} class="rounded-md border border-linen bg-surface-white p-4">
              <div class="flex items-end gap-3">
                <div class="flex-1">
                  <label class="block text-xs font-medium text-body" for={`chapter-${chapter.id}`}>
                    Chapter title
                  </label>
                  <input
                    id={`chapter-${chapter.id}`}
                    class={`mt-1 ${inputClass}`}
                    value={chapter.title}
                    onInput={(e) =>
                      setSchema((s) => ({
                        chapters: s.chapters.map((c, i) =>
                          i !== ci
                            ? c
                            : { ...c, title: (e.currentTarget as HTMLInputElement).value },
                        ),
                      }))
                    }
                  />
                </div>
                {!chapterLocked && (
                  <button
                    type="button"
                    class={buttonGhost}
                    onClick={() =>
                      setSchema((s) => ({ chapters: s.chapters.filter((_, i) => i !== ci) }))
                    }
                  >
                    Remove chapter
                  </button>
                )}
              </div>

              {chapter.pages.map((page, pi) => {
                const pageLocked = page.fields.some((field) => lockedIds.has(field.id))
                return (
                  <div key={page.id} class="mt-4 rounded-md border border-linen bg-cream p-4">
                    <div class="flex items-end gap-3">
                      <div class="flex-1">
                        <label
                          class="block text-xs font-medium text-body"
                          for={`page-title-${page.id}`}
                        >
                          Page title
                        </label>
                        <input
                          id={`page-title-${page.id}`}
                          class={`mt-1 ${inputClass}`}
                          value={page.title}
                          onInput={(e) =>
                            patchPage(ci, pi, {
                              title: (e.currentTarget as HTMLInputElement).value,
                            })
                          }
                        />
                      </div>
                      {!pageLocked && (
                        <button
                          type="button"
                          class={buttonGhost}
                          onClick={() =>
                            setSchema((s) => ({
                              chapters: s.chapters.map((c, i) =>
                                i !== ci ? c : { ...c, pages: c.pages.filter((_, j) => j !== pi) },
                              ),
                            }))
                          }
                        >
                          Remove page
                        </button>
                      )}
                    </div>
                    <div class="mt-3">
                      <label
                        class="block text-xs font-medium text-body"
                        for={`page-instruction-${page.id}`}
                      >
                        Page instruction
                      </label>
                      <textarea
                        id={`page-instruction-${page.id}`}
                        rows={2}
                        class={`mt-1 ${inputClass}`}
                        value={page.instruction ?? ''}
                        onInput={(e) =>
                          patchPage(ci, pi, {
                            instruction: (e.currentTarget as HTMLTextAreaElement).value,
                          })
                        }
                      />
                    </div>

                    <div class="mt-4 space-y-4">
                      {page.fields.map((field, fi) => (
                        <FieldRow
                          key={field.id}
                          field={field}
                          locked={lockedIds.has(field.id)}
                          permanentlyDeprecated={serverDeprecated.has(field.id)}
                          onPatch={(patch) => patchField(ci, pi, fi, patch)}
                          onRemove={() =>
                            patchPage(ci, pi, { fields: page.fields.filter((_, k) => k !== fi) })
                          }
                          onDeprecate={() =>
                            patchField(ci, pi, fi, { deprecatedInVersion: nextVersion })
                          }
                          onRestore={() => {
                            const { deprecatedInVersion: _drop, ...rest } = field
                            patchPage(ci, pi, {
                              fields: page.fields.map((f, k) => (k !== fi ? f : rest)),
                            })
                          }}
                        />
                      ))}
                    </div>

                    <AddFieldForm
                      pageId={page.id}
                      onAdd={(label, kind) => {
                        const id = uniqueChildId(label, allFieldIds(schema))
                        const field: AdminTemplateField = {
                          id,
                          label,
                          kind,
                          required: false,
                          ...(isSelectKind(kind) ? { options: ['Option 1'] } : {}),
                        }
                        patchPage(ci, pi, { fields: [...page.fields, field] })
                      }}
                    />
                  </div>
                )
              })}

              <button
                type="button"
                class={`${buttonGhost} mt-4`}
                onClick={() => {
                  const id = uniqueChildId('New page', allNodeIds(schema))
                  setSchema((s) => ({
                    chapters: s.chapters.map((c, i) =>
                      i !== ci
                        ? c
                        : { ...c, pages: [...c.pages, { id, title: 'New page', fields: [] }] },
                    ),
                  }))
                }}
              >
                Add page
              </button>
            </section>
          )
        })}
      </div>

      <button
        type="button"
        class={`${buttonSecondary} mt-4`}
        onClick={() => {
          const id = uniqueChildId('New chapter', allNodeIds(schema))
          setSchema((s) => ({
            chapters: [...s.chapters, { id, title: 'New chapter', pages: [] }],
          }))
        }}
      >
        Add chapter
      </button>

      <div class="mt-8 flex items-center gap-3 border-t border-linen pt-4">
        <button
          type="button"
          class={buttonPrimary}
          disabled={save.pending}
          onClick={() => void doSave()}
        >
          {save.pending ? 'Saving…' : 'Save changes'}
        </button>
        {!published && (
          <button type="button" class={buttonSecondary} onClick={() => setConfirming(true)}>
            Publish…
          </button>
        )}
      </div>
      {save.error && <InlineError error={save.error} />}
      {save.success && <InlineSuccess message={save.success} />}
      {publish.error && <InlineError error={publish.error} />}

      {confirming && (
        <ConfirmDialog
          title="Publish this template?"
          body={
            'Publishing makes this template live for members and freezes every field id. ' +
            'From then on you can add new fields or deprecate existing ones — never rename, ' +
            'retype or delete them. Each structural change after publishing creates a new ' +
            'version; members keep the version they started on.'
          }
          confirmLabel="Publish"
          cancelLabel="Cancel"
          pending={publish.pending}
          onConfirm={() => {
            void (async () => {
              const result = await publish.run(() => data.publishTemplate(template.id))
              if (result) {
                onUpdate(result.template)
                setConfirming(false)
              }
            })()
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </section>
  )
}

function FieldRow({
  field,
  locked,
  permanentlyDeprecated,
  onPatch,
  onRemove,
  onDeprecate,
  onRestore,
}: {
  field: AdminTemplateField
  locked: boolean
  permanentlyDeprecated: boolean
  onPatch: (patch: Partial<AdminTemplateField>) => void
  onRemove: () => void
  onDeprecate: () => void
  onRestore: () => void
}) {
  const deprecated = field.deprecatedInVersion != null

  return (
    <div class="rounded-md border border-linen bg-surface-white p-3">
      <div class="flex items-center justify-between gap-3">
        <p class="text-xs text-muted">
          id: <code class="rounded bg-sand px-1.5 py-0.5 text-ink">{field.id}</code>
        </p>
        <div class="flex items-center gap-2">
          {deprecated && <Chip label="Deprecated" tone="warning" />}
          {locked ? (
            deprecated ? (
              !permanentlyDeprecated && (
                <button type="button" class={buttonGhost} onClick={onRestore}>
                  Restore
                </button>
              )
            ) : (
              <button type="button" class={buttonGhost} onClick={onDeprecate}>
                Deprecate
              </button>
            )
          ) : (
            <button type="button" class={buttonGhost} onClick={onRemove}>
              Remove field
            </button>
          )}
        </div>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-body" for={`field-label-${field.id}`}>
            Field label
          </label>
          <input
            id={`field-label-${field.id}`}
            class={`mt-1 ${inputClass}`}
            value={field.label}
            onInput={(e) => onPatch({ label: (e.currentTarget as HTMLInputElement).value })}
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-body" for={`field-kind-${field.id}`}>
            Kind
          </label>
          <select
            id={`field-kind-${field.id}`}
            class={`mt-1 ${inputClass}`}
            value={field.kind}
            disabled={locked}
            title={
              locked
                ? "A field's kind can't change after publish — deprecate it and add a new field instead"
                : undefined
            }
            onChange={(e) => {
              const kind = (e.currentTarget as HTMLSelectElement).value as FieldKind
              if (isSelectKind(kind)) {
                onPatch({ kind, options: field.options?.length ? field.options : ['Option 1'] })
              } else {
                onPatch({ kind, options: undefined })
              }
            }}
          >
            {FIELD_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </div>
      </div>
      {locked && (
        <p class="mt-1 text-xs text-muted">
          Kind and id can't change after publish — deprecate this field and add a new one instead.
        </p>
      )}

      <div class="mt-3 grid grid-cols-2 gap-3">
        <label class="flex min-h-9 items-center gap-2 text-sm text-body">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onPatch({ required: (e.currentTarget as HTMLInputElement).checked })}
          />
          Required
        </label>
        <div>
          <label class="block text-xs font-medium text-body" for={`field-example-${field.id}`}>
            Example answer
          </label>
          <input
            id={`field-example-${field.id}`}
            class={`mt-1 ${inputClass}`}
            value={field.exampleAnswer ?? ''}
            onInput={(e) => {
              const value = (e.currentTarget as HTMLInputElement).value
              onPatch({ exampleAnswer: value === '' ? undefined : value })
            }}
          />
        </div>
      </div>

      {isSelectKind(field.kind) && (
        <div class="mt-3">
          <label class="block text-xs font-medium text-body" for={`field-options-${field.id}`}>
            Options (one per line)
          </label>
          <textarea
            id={`field-options-${field.id}`}
            rows={3}
            class={`mt-1 ${inputClass}`}
            value={(field.options ?? []).join('\n')}
            onInput={(e) =>
              onPatch({
                options: (e.currentTarget as HTMLTextAreaElement).value
                  .split('\n')
                  .map((option) => option.trim())
                  .filter(Boolean),
              })
            }
          />
          {locked && (
            <p class="mt-1 text-xs text-muted">
              New options can be added; existing options can't be removed after publish.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function AddFieldForm({
  pageId,
  onAdd,
}: {
  pageId: string
  onAdd: (label: string, kind: FieldKind) => void
}) {
  const [label, setLabel] = useState('')
  const [kind, setKind] = useState<FieldKind>('long_text')

  return (
    <div class="mt-4 flex items-end gap-2 border-t border-linen pt-3">
      <div class="flex-1">
        <label class="block text-xs font-medium text-body" for={`new-field-label-${pageId}`}>
          New field label
        </label>
        <input
          id={`new-field-label-${pageId}`}
          class={`mt-1 ${inputClass}`}
          value={label}
          onInput={(e) => setLabel((e.currentTarget as HTMLInputElement).value)}
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-body" for={`new-field-kind-${pageId}`}>
          New field kind
        </label>
        <select
          id={`new-field-kind-${pageId}`}
          class={`mt-1 ${inputClass}`}
          value={kind}
          onChange={(e) => setKind((e.currentTarget as HTMLSelectElement).value as FieldKind)}
        >
          {FIELD_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        class={buttonGhost}
        disabled={label.trim() === ''}
        onClick={() => {
          onAdd(label.trim(), kind)
          setLabel('')
        }}
      >
        Add field
      </button>
    </div>
  )
}
