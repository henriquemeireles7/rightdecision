import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render } from '@testing-library/preact'
import { AdminApp } from './app'
import { makeCourse, makeData, makeProgram, makeSuggestion, setBrowserPath } from './test-fixtures'

afterEach(cleanup)

const data = () =>
  makeData({
    listCourses: async () => ({ courses: [makeCourse({ title: 'Visible Course' })] }),
    listPrograms: async () => ({ programs: [makeProgram({ name: 'Visible Program' })] }),
    listMaterials: async () => ({ materials: [] }),
    listLives: async () => ({ lives: [] }),
    listCohorts: async () => ({ cohorts: [] }),
    suggestCohorts: async () => ({ suggestions: [makeSuggestion()] }),
  })

describe('component: AdminApp', () => {
  test('renders the sidebar with all five sections and lands on Courses', async () => {
    setBrowserPath('/admin')
    const { findByText, getByRole } = render(<AdminApp data={data()} />)
    for (const section of ['Courses', 'Programs', 'Cohorts', 'Lives', 'Materials']) {
      expect(getByRole('link', { name: section })).toBeTruthy()
    }
    expect(await findByText('Visible Course')).toBeTruthy()
    expect(getByRole('link', { name: 'Courses' }).getAttribute('aria-current')).toBe('page')
  })

  test('sidebar navigation switches screens and active state', async () => {
    setBrowserPath('/admin')
    const { findByText, getByRole } = render(<AdminApp data={data()} />)
    await findByText('Visible Course')
    fireEvent.click(getByRole('link', { name: 'Programs' }))
    expect(await findByText('Visible Program')).toBeTruthy()
    expect(window.location.pathname).toBe('/admin/programs')
    expect(getByRole('link', { name: 'Programs' }).getAttribute('aria-current')).toBe('page')
    expect(getByRole('link', { name: 'Courses' }).getAttribute('aria-current')).toBeNull()
  })

  test('deep link renders the matching screen', async () => {
    setBrowserPath('/admin/materials')
    const { findByText } = render(<AdminApp data={data()} />)
    expect(await findByText(/No materials yet/)).toBeTruthy()
  })

  test('unknown path falls back to Courses instead of a blank page', async () => {
    setBrowserPath('/admin/garbage/path')
    const { findByText } = render(<AdminApp data={data()} />)
    expect(await findByText('Visible Course')).toBeTruthy()
  })
})
