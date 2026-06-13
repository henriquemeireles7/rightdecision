import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/preact'
import type { JSX } from 'preact'
import { ApiError } from '@/features/(shared)/api-client'
import type { AdminData, AdminTemplateSchema } from './data'
import { DataContext } from './data'
import { TemplateEditorScreen, TemplatesScreen, uniqueChildId } from './templates'
import { makeData, makeProgram, makeTemplate, setBrowserPath } from './test-fixtures'

afterEach(cleanup)

function withData(data: AdminData, ui: JSX.Element) {
  return render(<DataContext.Provider value={data}>{ui}</DataContext.Provider>)
}

describe('unit: uniqueChildId', () => {
  test('slugs the label once and suffixes on collision', () => {
    expect(uniqueChildId('Your biggest fear', new Set())).toBe('your-biggest-fear')
    expect(uniqueChildId('One true thing', new Set(['one-true-thing']))).toBe('one-true-thing-2')
    expect(uniqueChildId('One true thing', new Set(['one-true-thing', 'one-true-thing-2']))).toBe(
      'one-true-thing-3',
    )
    expect(uniqueChildId('???', new Set())).toBe('field')
  })
})

describe('screen: TemplatesScreen', () => {
  test('loading skeleton, then rows with program, version and status', async () => {
    const data = makeData({
      listTemplates: async () => ({
        templates: [
          makeTemplate(),
          makeTemplate({
            id: 't-2',
            slug: 'life-playbook',
            title: 'Life Playbook',
            status: 'published',
            version: 3,
          }),
        ],
      }),
      listPrograms: async () => ({
        programs: [makeProgram({ id: 'p-1', name: 'Life Decisions' })],
      }),
    })
    const { container, findByText, getAllByText } = withData(data, <TemplatesScreen />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(await findByText('Starter Notebook')).toBeTruthy()
    expect(await findByText('Life Playbook')).toBeTruthy()
    expect(getAllByText('Life Decisions').length).toBe(2)
    expect(await findByText('v1')).toBeTruthy()
    expect(await findByText('v3')).toBeTruthy()
    expect(await findByText('Draft')).toBeTruthy()
    expect(await findByText('Published')).toBeTruthy()
  })

  test('empty state → create the first template → navigates to its editor', async () => {
    setBrowserPath('/admin/templates')
    const created: Array<Record<string, unknown>> = []
    const data = makeData({
      listTemplates: async () => ({ templates: [] }),
      listPrograms: async () => ({
        programs: [makeProgram({ id: 'p-1', name: 'Life Decisions' })],
      }),
      createTemplate: async (json) => {
        created.push(json as Record<string, unknown>)
        return { template: makeTemplate({ id: 't-9', title: (json as { title: string }).title }) }
      },
    })
    const { findByRole, findByLabelText } = withData(data, <TemplatesScreen />)
    fireEvent.click(await findByRole('button', { name: 'Create your first template' }))
    fireEvent.input(await findByLabelText('Title'), { target: { value: 'Starter Notebook' } })
    fireEvent.click(await findByRole('button', { name: 'Create template' }))
    await waitFor(() => expect(created.length).toBe(1))
    expect(created[0]).toMatchObject({
      programId: 'p-1',
      slug: 'starter-notebook',
      title: 'Starter Notebook',
      schema: { chapters: [] },
    })
    await waitFor(() => expect(window.location.pathname).toBe('/admin/templates/t-9'))
  })

  test('load failure → retryable error', async () => {
    const data = makeData({
      listTemplates: async () => {
        throw new ApiError('INTERNAL_ERROR', 500, 'Database is down')
      },
      listPrograms: async () => ({ programs: [] }),
    })
    const { findByText, findByRole } = withData(data, <TemplatesScreen />)
    expect(await findByText('Database is down')).toBeTruthy()
    expect(await findByRole('button', { name: 'Try again' })).toBeTruthy()
  })
})

describe('screen: TemplateEditorScreen (draft)', () => {
  test('renders the chapter → page → field tree with read-only field ids', async () => {
    const data = makeData({ getTemplate: async () => ({ template: makeTemplate() }) })
    const { findByDisplayValue, findByText, getAllByLabelText } = withData(
      data,
      <TemplateEditorScreen templateId="t-1" />,
    )
    expect(await findByDisplayValue('Seeing Clearly')).toBeTruthy()
    expect(await findByDisplayValue('Where You Are')).toBeTruthy()
    expect(await findByDisplayValue('One true thing')).toBeTruthy()
    expect(await findByText('one-true-thing')).toBeTruthy()
    // ids are displayed as text, never as editable inputs
    expect(getAllByLabelText('Field label').length).toBe(2)
  })

  test('editor load failure is retryable', async () => {
    const data = makeData({
      getTemplate: async () => {
        throw new ApiError('TEMPLATE_NOT_FOUND', 404, 'Template not found')
      },
    })
    const { findByText, findByRole } = withData(data, <TemplateEditorScreen templateId="t-x" />)
    expect(await findByText('Template not found')).toBeTruthy()
    expect(await findByRole('button', { name: 'Try again' })).toBeTruthy()
  })

  test('adding a field generates the id from the label ONCE — later label edits keep it', async () => {
    const data = makeData({ getTemplate: async () => ({ template: makeTemplate() }) })
    const { findByLabelText, findByText, getAllByLabelText, getByRole, queryByText } = withData(
      data,
      <TemplateEditorScreen templateId="t-1" />,
    )
    fireEvent.input(await findByLabelText('New field label'), {
      target: { value: 'Your biggest fear' },
    })
    fireEvent.change(await findByLabelText('New field kind'), { target: { value: 'short_text' } })
    fireEvent.click(getByRole('button', { name: 'Add field' }))
    expect(await findByText('your-biggest-fear')).toBeTruthy()

    // rename the new field — the id must NOT change
    const labels = getAllByLabelText('Field label')
    fireEvent.input(labels[labels.length - 1] as Element, { target: { value: 'Renamed' } })
    expect(await findByText('your-biggest-fear')).toBeTruthy()
    expect(queryByText('renamed')).toBeNull()
  })

  test('a colliding label gets a suffixed id', async () => {
    const data = makeData({ getTemplate: async () => ({ template: makeTemplate() }) })
    const { findByLabelText, findByText, getByRole } = withData(
      data,
      <TemplateEditorScreen templateId="t-1" />,
    )
    fireEvent.input(await findByLabelText('New field label'), {
      target: { value: 'One true thing' },
    })
    fireEvent.click(getByRole('button', { name: 'Add field' }))
    expect(await findByText('one-true-thing-2')).toBeTruthy()
  })

  test('add chapter and add page grow the tree', async () => {
    const data = makeData({ getTemplate: async () => ({ template: makeTemplate() }) })
    const { findByRole, getAllByLabelText } = withData(
      data,
      <TemplateEditorScreen templateId="t-1" />,
    )
    fireEvent.click(await findByRole('button', { name: 'Add chapter' }))
    await waitFor(() => expect(getAllByLabelText('Chapter title').length).toBe(2))
    const addPageButtons = await waitFor(() =>
      Array.from(document.querySelectorAll('button')).filter((b) => b.textContent === 'Add page'),
    )
    fireEvent.click(addPageButtons[1] as Element)
    await waitFor(() => expect(getAllByLabelText('Page title').length).toBe(2))
  })

  test('save sends title + schema; success shows Saved', async () => {
    const patches: Array<Record<string, unknown>> = []
    const data = makeData({
      getTemplate: async () => ({ template: makeTemplate() }),
      updateTemplate: async (_id, json) => {
        patches.push(json as Record<string, unknown>)
        return { template: makeTemplate() }
      },
    })
    const { findByRole, findByText, findByLabelText } = withData(
      data,
      <TemplateEditorScreen templateId="t-1" />,
    )
    fireEvent.input(await findByLabelText('Template title'), {
      target: { value: 'Starter Notebook v2' },
    })
    fireEvent.click(await findByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(patches.length).toBe(1))
    expect(patches[0]?.title).toBe('Starter Notebook v2')
    expect((patches[0]?.schema as AdminTemplateSchema).chapters.length).toBe(1)
    expect(await findByText('Saved')).toBeTruthy()
  })

  test('save failure surfaces the API validation error VERBATIM', async () => {
    const data = makeData({
      getTemplate: async () => ({ template: makeTemplate() }),
      updateTemplate: async () => {
        throw new ApiError(
          'VALIDATION_ERROR',
          400,
          'Validation failed',
          'field "life-area" (select) requires non-empty options',
        )
      },
    })
    const { findByRole, findByText } = withData(data, <TemplateEditorScreen templateId="t-1" />)
    fireEvent.click(await findByRole('button', { name: 'Save changes' }))
    expect(await findByText(/Validation failed/)).toBeTruthy()
    expect(await findByText(/field "life-area" \(select\) requires non-empty options/)).toBeTruthy()
  })

  test('publish asks for confirmation that EXPLAINS version semantics', async () => {
    const published: string[] = []
    const data = makeData({
      getTemplate: async () => ({ template: makeTemplate() }),
      publishTemplate: async (id) => {
        published.push(id)
        return { template: makeTemplate({ status: 'published' }) }
      },
    })
    const { container, findByRole, findByText } = withData(
      data,
      <TemplateEditorScreen templateId="t-1" />,
    )
    fireEvent.click(await findByRole('button', { name: 'Publish…' }))
    const dialog = await waitFor(() => {
      const el = container.querySelector('dialog[open]')
      expect(el).not.toBeNull()
      return el as HTMLElement
    })
    expect(dialog.textContent).toContain('freezes every field id')
    expect(dialog.textContent).toMatch(/new version/i)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publish' }))
    await waitFor(() => expect(published).toEqual(['t-1']))
    expect(await findByText('Published')).toBeTruthy()
  })

  test('publish can be cancelled', async () => {
    const data = makeData({ getTemplate: async () => ({ template: makeTemplate() }) })
    const { container, findByRole } = withData(data, <TemplateEditorScreen templateId="t-1" />)
    fireEvent.click(await findByRole('button', { name: 'Publish…' }))
    const dialog = await waitFor(() => {
      const el = container.querySelector('dialog[open]')
      expect(el).not.toBeNull()
      return el as HTMLElement
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(container.querySelector('dialog[open]')).toBeNull())
  })

  test('draft fields can be removed outright (no deprecate ceremony)', async () => {
    const data = makeData({ getTemplate: async () => ({ template: makeTemplate() }) })
    const { findAllByRole, getAllByLabelText, queryByText } = withData(
      data,
      <TemplateEditorScreen templateId="t-1" />,
    )
    const removeButtons = await findAllByRole('button', { name: 'Remove field' })
    expect(removeButtons.length).toBe(2)
    fireEvent.click(removeButtons[0] as Element)
    await waitFor(() => expect(getAllByLabelText('Field label').length).toBe(1))
    expect(queryByText('Deprecate')).toBeNull()
  })
})

describe('screen: TemplateEditorScreen (published — field ids are frozen)', () => {
  const publishedTemplate = () => makeTemplate({ status: 'published', version: 1 })

  test('existing fields: kind locked with an explanation, Remove replaced by Deprecate', async () => {
    const data = makeData({ getTemplate: async () => ({ template: publishedTemplate() }) })
    const { findAllByLabelText, getAllByText, queryByRole, getAllByRole } = withData(
      data,
      <TemplateEditorScreen templateId="t-1" />,
    )
    const kinds = await findAllByLabelText('Kind')
    for (const kind of kinds) {
      expect((kind as HTMLSelectElement).disabled).toBe(true)
      expect(kind.getAttribute('title')).toContain('publish')
    }
    expect(getAllByText(/can't change after publish/i).length).toBeGreaterThan(0)
    expect(queryByRole('button', { name: 'Remove field' })).toBeNull()
    expect(getAllByRole('button', { name: 'Deprecate' }).length).toBe(2)
  })

  test('structural edits warn that saving creates the next version', async () => {
    const data = makeData({ getTemplate: async () => ({ template: publishedTemplate() }) })
    const { findByText } = withData(data, <TemplateEditorScreen templateId="t-1" />)
    expect(await findByText(/version 2/)).toBeTruthy()
  })

  test('deprecate marks the field and the save payload carries the intent', async () => {
    const patches: Array<Record<string, unknown>> = []
    const data = makeData({
      getTemplate: async () => ({ template: publishedTemplate() }),
      updateTemplate: async (_id, json) => {
        patches.push(json as Record<string, unknown>)
        return { template: publishedTemplate() }
      },
    })
    const { findAllByRole, findByText, findByRole } = withData(
      data,
      <TemplateEditorScreen templateId="t-1" />,
    )
    fireEvent.click((await findAllByRole('button', { name: 'Deprecate' }))[0] as Element)
    expect(await findByText('Deprecated')).toBeTruthy()
    fireEvent.click(await findByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(patches.length).toBe(1))
    const schema = patches[0]?.schema as AdminTemplateSchema
    const field = schema.chapters[0]?.pages[0]?.fields[0]
    expect(field?.deprecatedInVersion).toBe(2)
  })

  test('a freshly deprecated field can be restored before saving (local intent only)', async () => {
    const data = makeData({ getTemplate: async () => ({ template: publishedTemplate() }) })
    const { findAllByRole, findByRole, queryByText } = withData(
      data,
      <TemplateEditorScreen templateId="t-1" />,
    )
    fireEvent.click((await findAllByRole('button', { name: 'Deprecate' }))[0] as Element)
    fireEvent.click(await findByRole('button', { name: 'Restore' }))
    await waitFor(() => expect(queryByText('Deprecated')).toBeNull())
  })

  test('an ALREADY-deprecated field renders its stamp and cannot be restored', async () => {
    const template = publishedTemplate()
    const firstField = template.schema.chapters[0]?.pages[0]?.fields[0]
    if (firstField) firstField.deprecatedInVersion = 1
    const data = makeData({ getTemplate: async () => ({ template }) })
    const { findByText, queryByRole } = withData(data, <TemplateEditorScreen templateId="t-1" />)
    expect(await findByText('Deprecated')).toBeTruthy()
    expect(queryByRole('button', { name: 'Restore' })).toBeNull()
  })

  test('NEW fields added after publish stay fully editable and removable', async () => {
    const data = makeData({ getTemplate: async () => ({ template: publishedTemplate() }) })
    const { findByLabelText, findByRole, findAllByLabelText } = withData(
      data,
      <TemplateEditorScreen templateId="t-1" />,
    )
    fireEvent.input(await findByLabelText('New field label'), {
      target: { value: 'A new question' },
    })
    fireEvent.click(await findByRole('button', { name: 'Add field' }))
    const kinds = await findAllByLabelText('Kind')
    const newKind = kinds[kinds.length - 1] as HTMLSelectElement
    expect(newKind.disabled).toBe(false)
    expect(await findByRole('button', { name: 'Remove field' })).toBeTruthy()
  })

  test('published chapters/pages with frozen fields cannot be removed', async () => {
    const data = makeData({ getTemplate: async () => ({ template: publishedTemplate() }) })
    const { findByDisplayValue, queryByRole } = withData(
      data,
      <TemplateEditorScreen templateId="t-1" />,
    )
    await findByDisplayValue('Seeing Clearly')
    expect(queryByRole('button', { name: 'Remove chapter' })).toBeNull()
    expect(queryByRole('button', { name: 'Remove page' })).toBeNull()
  })
})
