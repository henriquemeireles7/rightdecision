import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import type { JSX } from 'preact'
import { ApiError } from '@/features/(shared)/api-client'
import { CohortsScreen, splitCohorts } from './cohorts'
import type { AdminData } from './data'
import { DataContext } from './data'
import { makeCohort, makeData, makeProgram, makeSuggestion } from './test-fixtures'

afterEach(cleanup)

const NOW = new Date('2026-06-13T12:00:00.000Z')

function withData(data: AdminData, ui: JSX.Element) {
  return render(<DataContext.Provider value={data}>{ui}</DataContext.Provider>)
}

describe('client/admin cohorts: splitCohorts', () => {
  test('partitions by startsAt against now (derived, never stored)', () => {
    const future = makeCohort({ id: 'f', startsAt: '2026-07-06T13:00:00.000Z' })
    const past = makeCohort({ id: 'p', startsAt: '2026-05-04T13:00:00.000Z' })
    const { upcoming, past: gone } = splitCohorts([past, future], NOW)
    expect(upcoming.map((c) => c.id)).toEqual(['f'])
    expect(gone.map((c) => c.id)).toEqual(['p'])
  })
})

function baseData(overrides: Partial<AdminData> = {}) {
  return makeData({
    listPrograms: async () => ({ programs: [makeProgram({ tier: 'free', name: 'Free Cohorts' })] }),
    listCohorts: async () => ({
      cohorts: [
        makeCohort({ id: 'ch-past', title: 'May Cohort', startsAt: '2026-05-04T13:00:00.000Z' }),
        makeCohort({ id: 'ch-future', title: 'July Cohort', startsAt: '2026-07-06T13:00:00.000Z' }),
      ],
    }),
    suggestCohorts: async () => ({ suggestions: [makeSuggestion()] }),
    ...overrides,
  })
}

describe('screen: CohortsScreen', () => {
  test('no programs yet → points to creating a program first', async () => {
    const data = makeData({ listPrograms: async () => ({ programs: [] }) })
    const { findByText } = withData(data, <CohortsScreen now={NOW} />)
    expect(await findByText(/need a program first/i)).toBeTruthy()
  })

  test('shows the next auto-created cohort suggestion', async () => {
    const { findByText } = withData(baseData(), <CohortsScreen now={NOW} />)
    expect(await findByText(/Next auto-created cohort/i)).toBeTruthy()
    expect(await findByText(/July 2026 Cohort/)).toBeTruthy()
  })

  test('splits upcoming and past; past cohorts are locked, future ones editable', async () => {
    const { findByText, getByRole, queryByRole } = withData(baseData(), <CohortsScreen now={NOW} />)
    await findByText('July Cohort')
    expect(await findByText('May Cohort')).toBeTruthy()
    expect(await findByText(/Started — locked/)).toBeTruthy()
    expect(getByRole('button', { name: 'Edit July Cohort' })).toBeTruthy()
    expect(queryByRole('button', { name: 'Edit May Cohort' })).toBeNull()
  })

  test('manual create posts an ISO instant and appends', async () => {
    const created: Array<Record<string, unknown>> = []
    const data = baseData({
      createCohort: async (json) => {
        created.push(json)
        return { cohort: makeCohort({ id: 'ch-new', title: json.title, startsAt: json.startsAt }) }
      },
    })
    const { findByLabelText, findByRole, findByText } = withData(data, <CohortsScreen now={NOW} />)
    fireEvent.input(await findByLabelText('Cohort title'), { target: { value: 'August Special' } })
    fireEvent.input(await findByLabelText('Starts at'), { target: { value: '2026-08-03T09:00' } })
    fireEvent.click(await findByRole('button', { name: 'Create cohort' }))
    await waitFor(() => expect(created.length).toBe(1))
    expect(created[0]?.title).toBe('August Special')
    expect(created[0]?.startsAt).toBe(new Date('2026-08-03T09:00').toISOString())
    expect(await findByText('August Special')).toBeTruthy()
  })

  test('collision with the auto-created cohort is surfaced clearly', async () => {
    const data = baseData({
      createCohort: async () => {
        throw new ApiError(
          'VALIDATION_ERROR',
          400,
          'Validation failed',
          'A cohort already exists for this program at this start time',
        )
      },
    })
    const { findByLabelText, findByRole, findByText } = withData(data, <CohortsScreen now={NOW} />)
    fireEvent.input(await findByLabelText('Cohort title'), { target: { value: 'Clash' } })
    fireEvent.input(await findByLabelText('Starts at'), { target: { value: '2026-07-06T09:00' } })
    fireEvent.click(await findByRole('button', { name: 'Create cohort' }))
    expect(await findByText(/already exists for this program/)).toBeTruthy()
  })

  test('editing a future cohort saves; API refusal for started cohorts is surfaced', async () => {
    const updates: Array<Record<string, unknown>> = []
    const data = baseData({
      updateCohort: async (_id, json) => {
        updates.push(json)
        throw new ApiError(
          'VALIDATION_ERROR',
          400,
          'Validation failed',
          'This cohort has already started — destructive edits need a founder decision',
        )
      },
    })
    const { findByLabelText, findByRole, findByText } = withData(data, <CohortsScreen now={NOW} />)
    fireEvent.click(await findByRole('button', { name: 'Edit July Cohort' }))
    fireEvent.input(await findByLabelText('Edit title'), { target: { value: 'July Renamed' } })
    fireEvent.click(await findByRole('button', { name: 'Save cohort' }))
    expect(
      await findByText(/already started — destructive edits need a founder decision/),
    ).toBeTruthy()
    expect(updates.length).toBe(1)
  })

  test('cohorts load failure → retryable error', async () => {
    const data = baseData({
      listCohorts: async () => {
        throw new ApiError('INTERNAL_ERROR', 500, 'boom')
      },
    })
    const { findByRole } = withData(data, <CohortsScreen now={NOW} />)
    expect(await findByRole('button', { name: 'Try again' })).toBeTruthy()
  })

  test('empty cohorts → explains the cron + offers manual create', async () => {
    const data = baseData({ listCohorts: async () => ({ cohorts: [] }) })
    const { findByText } = withData(data, <CohortsScreen now={NOW} />)
    expect(await findByText(/No cohorts yet/)).toBeTruthy()
    expect(await findByText(/first Monday/i)).toBeTruthy()
  })
})
