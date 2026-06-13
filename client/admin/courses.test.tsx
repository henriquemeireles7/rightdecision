import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import type { JSX } from 'preact'
import { ApiError } from '@/features/(shared)/api-client'
import {
  CourseDetailScreen,
  CoursesScreen,
  lessonChipStatus,
  ModuleDetailScreen,
  slugify,
} from './courses'
import type { AdminData } from './data'
import { DataContext } from './data'
import { makeCourse, makeData, makeLesson, makeModule, setBrowserPath } from './test-fixtures'

afterEach(cleanup)

function withData(data: AdminData, ui: JSX.Element) {
  return render(<DataContext.Provider value={data}>{ui}</DataContext.Provider>)
}

describe('client/admin courses: slugify', () => {
  test('lowercases, dashes, strips noise', () => {
    expect(slugify('The Right  Decision!')).toBe('the-right-decision')
    expect(slugify('  Boundaries & Money 101 ')).toBe('boundaries-money-101')
  })
})

describe('client/admin courses: lessonChipStatus', () => {
  test('published wins; otherwise videoStatus maps to the chip', () => {
    expect(lessonChipStatus(makeLesson({ status: 'published', videoStatus: 'ready' }))).toBe(
      'published',
    )
    expect(lessonChipStatus(makeLesson({ videoStatus: 'none' }))).toBe('draft')
    expect(lessonChipStatus(makeLesson({ videoStatus: 'uploading' }))).toBe('uploading')
    expect(lessonChipStatus(makeLesson({ videoStatus: 'processing' }))).toBe('processing')
    expect(lessonChipStatus(makeLesson({ videoStatus: 'ready' }))).toBe('ready')
    expect(lessonChipStatus(makeLesson({ videoStatus: 'error' }))).toBe('error')
  })
})

describe('screen: CoursesScreen', () => {
  test('loading skeleton first', () => {
    const data = makeData({ listCourses: () => new Promise(() => {}) })
    const { container } = withData(data, <CoursesScreen />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  test('load failure → error state with retry', async () => {
    let attempts = 0
    const data = makeData({
      listCourses: async () => {
        attempts += 1
        if (attempts === 1) throw new ApiError('INTERNAL_ERROR', 500, 'Server exploded')
        return { courses: [makeCourse()] }
      },
    })
    const { findByText, findByRole } = withData(data, <CoursesScreen />)
    expect(await findByText('Server exploded')).toBeTruthy()
    fireEvent.click(await findByRole('button', { name: 'Try again' }))
    expect(await findByText('First Course')).toBeTruthy()
  })

  test('empty state invites creating the first course', async () => {
    const data = makeData({ listCourses: async () => ({ courses: [] }) })
    const { findByRole, findByLabelText } = withData(data, <CoursesScreen />)
    const cta = await findByRole('button', { name: 'Create your first course' })
    fireEvent.click(cta)
    expect(await findByLabelText('Title')).toBeTruthy()
  })

  test('create: slug auto-fills from title, success navigates to the course', async () => {
    setBrowserPath('/admin/courses')
    const created: Array<{ slug: string; title: string }> = []
    const data = makeData({
      listCourses: async () => ({ courses: [] }),
      createCourse: async (json) => {
        created.push(json)
        return { course: makeCourse({ id: 'c-9', slug: json.slug, title: json.title }) }
      },
    })
    const { findByRole, findByLabelText } = withData(data, <CoursesScreen />)
    fireEvent.click(await findByRole('button', { name: 'Create your first course' }))
    const title = (await findByLabelText('Title')) as HTMLInputElement
    fireEvent.input(title, { target: { value: 'Money Decisions' } })
    expect(((await findByLabelText('Slug')) as HTMLInputElement).value).toBe('money-decisions')
    fireEvent.click(await findByRole('button', { name: 'Create course' }))
    await waitFor(() => expect(created.length).toBe(1))
    expect(created[0]).toMatchObject({ slug: 'money-decisions', title: 'Money Decisions' })
    await waitFor(() => expect(window.location.pathname).toBe('/admin/courses/c-9'))
  })

  test('create failure surfaces the API detail (duplicate slug)', async () => {
    const data = makeData({
      listCourses: async () => ({ courses: [] }),
      createCourse: async () => {
        throw new ApiError(
          'VALIDATION_ERROR',
          400,
          'Validation failed',
          'A course with slug "x" already exists',
        )
      },
    })
    const { findByRole, findByLabelText, findByText } = withData(data, <CoursesScreen />)
    fireEvent.click(await findByRole('button', { name: 'Create your first course' }))
    fireEvent.input(await findByLabelText('Title'), { target: { value: 'X' } })
    fireEvent.click(await findByRole('button', { name: 'Create course' }))
    expect(await findByText(/already exists/)).toBeTruthy()
  })

  test('rows link to the course and show its status', async () => {
    const data = makeData({
      listCourses: async () => ({
        courses: [
          makeCourse(),
          makeCourse({ id: 'c-2', slug: 'second', title: 'Second Course', status: 'published' }),
        ],
      }),
    })
    const { findByText, getByRole } = withData(data, <CoursesScreen />)
    await findByText('Second Course')
    expect(getByRole('link', { name: /Second Course/ }).getAttribute('href')).toBe(
      '/admin/courses/c-2',
    )
    expect(await findByText('Published')).toBeTruthy()
  })
})

describe('screen: CourseDetailScreen', () => {
  const twoModules = () => ({
    course: makeCourse(),
    modules: [
      makeModule({ id: 'm-1', title: 'Module One', sortOrder: 0 }, [makeLesson()]),
      makeModule({ id: 'm-2', title: 'Module Two', sortOrder: 1 }, []),
    ],
  })

  test('renders modules in order with up/down reorder calling the API with the full id set', async () => {
    const reorders: string[][] = []
    const data = makeData({
      getCourse: async () => twoModules(),
      listCourses: async () => ({ courses: [makeCourse()] }),
      reorderModules: async (_courseId, moduleIds) => {
        reorders.push(moduleIds)
        return { modules: [] }
      },
    })
    const { findByText, getByRole } = withData(data, <CourseDetailScreen courseId="c-1" />)
    await findByText('Module One')
    // first row: Move up disabled, Move down enabled
    const downFirst = getByRole('button', { name: 'Move Module One down' }) as HTMLButtonElement
    const upFirst = getByRole('button', { name: 'Move Module One up' }) as HTMLButtonElement
    expect(upFirst.disabled).toBe(true)
    fireEvent.click(downFirst)
    await waitFor(() => expect(reorders.length).toBe(1))
    expect(reorders[0]).toEqual(['m-2', 'm-1'])
    // local order flipped
    await findByText('Module Two')
  })

  test('reorder failure reverts nothing silently — an error is shown', async () => {
    const data = makeData({
      getCourse: async () => twoModules(),
      listCourses: async () => ({ courses: [makeCourse()] }),
      reorderModules: async () => {
        throw new ApiError('VALIDATION_ERROR', 400, 'Validation failed', 'moduleIds mismatch')
      },
    })
    const { findByText, getByRole } = withData(data, <CourseDetailScreen courseId="c-1" />)
    await findByText('Module One')
    fireEvent.click(getByRole('button', { name: 'Move Module One down' }))
    expect(await findByText(/moduleIds mismatch/)).toBeTruthy()
  })

  test('empty modules → create-your-first-module action', async () => {
    const data = makeData({
      getCourse: async () => ({ course: makeCourse(), modules: [] }),
      listCourses: async () => ({ courses: [makeCourse()] }),
    })
    const { findByText } = withData(data, <CourseDetailScreen courseId="c-1" />)
    expect(await findByText(/No modules yet/)).toBeTruthy()
  })

  test('add module appends to the list', async () => {
    const data = makeData({
      getCourse: async () => ({ course: makeCourse(), modules: [] }),
      listCourses: async () => ({ courses: [makeCourse()] }),
      createModule: async (_courseId, json) => ({
        module: makeModule({ id: 'm-9', title: json.title }),
      }),
    })
    const { findByText, findByLabelText, findByRole } = withData(
      data,
      <CourseDetailScreen courseId="c-1" />,
    )
    await findByText(/No modules yet/)
    fireEvent.input(await findByLabelText('New module title'), { target: { value: 'Grief' } })
    fireEvent.click(await findByRole('button', { name: 'Add module' }))
    expect(await findByText('Grief')).toBeTruthy()
  })

  test('course title autosaves on blur', async () => {
    const patches: Array<Record<string, unknown>> = []
    const data = makeData({
      getCourse: async () => ({ course: makeCourse(), modules: [] }),
      listCourses: async () => ({ courses: [makeCourse()] }),
      updateCourse: async (_id, json) => {
        patches.push(json)
        return { course: makeCourse({ title: json.title ?? 'x' }) }
      },
    })
    const { findByLabelText, findByText } = withData(data, <CourseDetailScreen courseId="c-1" />)
    const title = (await findByLabelText('Course title')) as HTMLInputElement
    fireEvent.input(title, { target: { value: 'Renamed Course' } })
    fireEvent.blur(title)
    expect(await findByText('Saved')).toBeTruthy()
    expect(patches).toEqual([{ title: 'Renamed Course' }])
  })
})

describe('screen: ModuleDetailScreen', () => {
  const detail = () => ({
    course: makeCourse(),
    modules: [
      makeModule({ id: 'm-1', title: 'Module One' }, [
        makeLesson({ id: 'l-1', title: 'Lesson A', videoStatus: 'ready' }),
        makeLesson({ id: 'l-2', title: 'Lesson B', videoStatus: 'processing', sortOrder: 1 }),
      ]),
      makeModule(
        { id: 'm-2', title: 'Module Two', coverImageKey: 'covers/m2.png', sortOrder: 1 },
        [],
      ),
    ],
  })

  test('lessons render with their status chips and link to the editor', async () => {
    const data = makeData({ getCourse: async () => detail() })
    const { findByText, getByRole } = withData(
      data,
      <ModuleDetailScreen courseId="c-1" moduleId="m-1" />,
    )
    await findByText('Lesson A')
    expect(await findByText('Ready')).toBeTruthy()
    expect(await findByText('Processing')).toBeTruthy()
    expect(getByRole('link', { name: /Lesson A/ }).getAttribute('href')).toBe(
      '/admin/courses/c-1/modules/m-1/lessons/l-1',
    )
  })

  test('lesson reorder posts the full ordered id set', async () => {
    const reorders: string[][] = []
    const data = makeData({
      getCourse: async () => detail(),
      reorderLessons: async (_moduleId, lessonIds) => {
        reorders.push(lessonIds)
        return { lessons: [] }
      },
    })
    const { findByText, getByRole } = withData(
      data,
      <ModuleDetailScreen courseId="c-1" moduleId="m-1" />,
    )
    await findByText('Lesson A')
    fireEvent.click(getByRole('button', { name: 'Move Lesson B up' }))
    await waitFor(() => expect(reorders).toEqual([['l-2', 'l-1']]))
  })

  test('add lesson appends and empty state shows for lesson-less modules', async () => {
    const data = makeData({
      getCourse: async () => detail(),
      createLesson: async (_moduleId, json) => ({
        lesson: makeLesson({ id: 'l-9', title: json.title }),
      }),
    })
    const { findByText, findByLabelText, findByRole } = withData(
      data,
      <ModuleDetailScreen courseId="c-1" moduleId="m-2" />,
    )
    expect(await findByText(/No lessons yet/)).toBeTruthy()
    fireEvent.input(await findByLabelText('New lesson title'), {
      target: { value: 'The One Decision' },
    })
    fireEvent.click(await findByRole('button', { name: 'Add lesson' }))
    expect(await findByText('The One Decision')).toBeTruthy()
  })

  test('unknown module id → clear error, not a blank page', async () => {
    const data = makeData({ getCourse: async () => detail() })
    const { findByText } = withData(data, <ModuleDetailScreen courseId="c-1" moduleId="m-404" />)
    expect(await findByText(/module doesn't exist/i)).toBeTruthy()
  })
})
