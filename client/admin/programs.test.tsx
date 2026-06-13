import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import type { JSX } from 'preact'
import { ApiError } from '@/features/(shared)/api-client'
import type { AdminData } from './data'
import { DataContext } from './data'
import { ProgramDetailScreen, ProgramsScreen } from './programs'
import { makeCourse, makeData, makeMaterial, makeProgram, setBrowserPath } from './test-fixtures'

afterEach(cleanup)

function withData(data: AdminData, ui: JSX.Element) {
  return render(<DataContext.Provider value={data}>{ui}</DataContext.Provider>)
}

describe('screen: ProgramsScreen', () => {
  test('loading skeleton, then rows with tier and status chips', async () => {
    const data = makeData({
      listPrograms: async () => ({
        programs: [
          makeProgram(),
          makeProgram({
            id: 'p-2',
            slug: 'free-intro',
            name: 'Free Intro',
            tier: 'free',
            status: 'draft',
          }),
        ],
      }),
    })
    const { container, findByText } = withData(data, <ProgramsScreen />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    await findByText('Life Decisions')
    expect(await findByText('Paid')).toBeTruthy()
    expect(await findByText('Free')).toBeTruthy()
    expect(await findByText('Draft')).toBeTruthy()
  })

  test('empty state → create your first program → success navigates to detail', async () => {
    setBrowserPath('/admin/programs')
    const created: Array<Record<string, unknown>> = []
    const data = makeData({
      listPrograms: async () => ({ programs: [] }),
      createProgram: async (json) => {
        created.push(json)
        return {
          program: makeProgram({ id: 'p-9', name: json.name, slug: json.slug, tier: json.tier }),
        }
      },
    })
    const { findByRole, findByLabelText } = withData(data, <ProgramsScreen />)
    fireEvent.click(await findByRole('button', { name: 'Create your first program' }))
    fireEvent.input(await findByLabelText('Name'), { target: { value: 'Monthly Free Cohort' } })
    fireEvent.change(await findByLabelText('Tier'), { target: { value: 'free' } })
    fireEvent.click(await findByRole('button', { name: 'Create program' }))
    await waitFor(() => expect(created.length).toBe(1))
    expect(created[0]).toMatchObject({
      name: 'Monthly Free Cohort',
      slug: 'monthly-free-cohort',
      tier: 'free',
    })
    await waitFor(() => expect(window.location.pathname).toBe('/admin/programs/p-9'))
  })

  test('load failure → retryable error', async () => {
    const data = makeData({
      listPrograms: async () => {
        throw new ApiError('INTERNAL_ERROR', 500, 'Database is down')
      },
    })
    const { findByText, findByRole } = withData(data, <ProgramsScreen />)
    expect(await findByText('Database is down')).toBeTruthy()
    expect(await findByRole('button', { name: 'Try again' })).toBeTruthy()
  })
})

describe('screen: ProgramDetailScreen', () => {
  function baseData(overrides: Partial<AdminData> = {}) {
    return makeData({
      getProgram: async () => ({
        program: makeProgram(),
        courses: [{ ...makeCourse({ id: 'c-1', title: 'Attached Course' }), sortOrder: 0 }],
      }),
      listCourses: async () => ({
        courses: [
          makeCourse({ id: 'c-1', title: 'Attached Course' }),
          makeCourse({ id: 'c-2', title: 'Free Floater', slug: 'floater' }),
        ],
      }),
      listProgramMaterials: async () => ({
        materials: [makeMaterial({ id: 'mt-1', title: 'Attached Workbook' })],
      }),
      listMaterials: async () => ({
        materials: [
          makeMaterial({ id: 'mt-1', title: 'Attached Workbook' }),
          makeMaterial({ id: 'mt-2', title: 'Loose Checklist' }),
        ],
      }),
      ...overrides,
    })
  }

  test('renders attached courses and materials with their sections', async () => {
    const { findByText } = withData(baseData(), <ProgramDetailScreen programId="p-1" />)
    expect(await findByText('Attached Course')).toBeTruthy()
    expect(await findByText('Attached Workbook')).toBeTruthy()
  })

  test('attach course: only unattached courses offered; attaching calls the API and appears', async () => {
    const attached: string[][] = []
    const data = baseData({
      addCourseToProgram: async (programId, courseId) => {
        attached.push([programId, courseId])
        return {
          mapping: { id: 'pc-1', programId, courseId, sortOrder: 1, createdAt: '', updatedAt: '' },
        }
      },
    })
    const { findByLabelText, findByRole, findByText } = withData(
      data,
      <ProgramDetailScreen programId="p-1" />,
    )
    const select = (await findByLabelText('Attach a course')) as HTMLSelectElement
    const optionTexts = Array.from(select.options).map((o) => o.textContent)
    expect(optionTexts.join(' ')).toContain('Free Floater')
    expect(optionTexts.join(' ')).not.toContain('Attached Course')
    fireEvent.change(select, { target: { value: 'c-2' } })
    fireEvent.click(await findByRole('button', { name: 'Attach course' }))
    await waitFor(() => expect(attached).toEqual([['p-1', 'c-2']]))
    expect(await findByText('Free Floater')).toBeTruthy()
  })

  test('remove course confirms before revoking member access', async () => {
    const removed: string[][] = []
    const data = baseData({
      removeCourseFromProgram: async (programId, courseId) => {
        removed.push([programId, courseId])
        return { removed: true }
      },
    })
    const { container, findByRole, findByText } = withData(
      data,
      <ProgramDetailScreen programId="p-1" />,
    )
    await findByText('Attached Course')
    fireEvent.click(await findByRole('button', { name: 'Remove Attached Course' }))
    expect(await findByText(/lose access/i)).toBeTruthy()
    fireEvent.click(await findByRole('button', { name: 'Remove course' }))
    await waitFor(() => expect(removed).toEqual([['p-1', 'c-1']]))
    // the attached list empties (the course moves back to the attach dropdown)
    expect(await findByText(/No courses in this program yet/)).toBeTruthy()
    expect(container.querySelector('dialog')).toBeNull()
  })

  test('attach material calls the API; failure is surfaced inline', async () => {
    const data = baseData({
      addMaterialToProgram: async () => {
        throw new ApiError('NOT_FOUND', 404, 'Resource not found')
      },
    })
    const { findByLabelText, findByRole, findByText } = withData(
      data,
      <ProgramDetailScreen programId="p-1" />,
    )
    const select = (await findByLabelText('Attach a material')) as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'mt-2' } })
    fireEvent.click(await findByRole('button', { name: 'Attach material' }))
    expect(await findByText(/Resource not found/)).toBeTruthy()
  })

  test('status select saves immediately with feedback', async () => {
    const patches: Array<Record<string, unknown>> = []
    const data = baseData({
      updateProgram: async (_id, json) => {
        patches.push(json)
        return { program: makeProgram({ status: json.status ?? 'active' }) }
      },
    })
    const { findByLabelText, findByText } = withData(data, <ProgramDetailScreen programId="p-1" />)
    fireEvent.change(await findByLabelText('Status'), { target: { value: 'archived' } })
    expect(await findByText('Saved')).toBeTruthy()
    expect(patches).toEqual([{ status: 'archived' }])
  })

  test('empty attachments invite action instead of dead-ending', async () => {
    const data = baseData({
      getProgram: async () => ({ program: makeProgram(), courses: [] }),
      listProgramMaterials: async () => ({ materials: [] }),
    })
    const { findByText } = withData(data, <ProgramDetailScreen programId="p-1" />)
    expect(await findByText(/No courses in this program yet/)).toBeTruthy()
    expect(await findByText(/No materials in this program yet/)).toBeTruthy()
  })
})
