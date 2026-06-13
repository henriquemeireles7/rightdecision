import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import { manualScheduler, playbookField } from '../test-fixtures'
import { PlaybookField } from './playbook-field'

afterEach(cleanup)

const noSave = async () => {}

describe('component: PlaybookField — field kinds matrix', () => {
  test('short_text renders a text input with a VISIBLE label (never placeholder-as-label)', () => {
    const { getByLabelText, container } = render(
      <PlaybookField
        field={playbookField('f1', 'short_text', { label: 'Your one true thing' })}
        onSave={noSave}
      />,
    )
    const input = getByLabelText('Your one true thing') as HTMLInputElement
    expect(input.tagName).toBe('INPUT')
    expect(input.type).toBe('text')
    expect(container.querySelector('label')?.textContent).toContain('Your one true thing')
  })

  test('long_text renders a textarea', () => {
    const { getByLabelText } = render(
      <PlaybookField
        field={playbookField('f1', 'long_text', { label: 'Say it plainly' })}
        onSave={noSave}
      />,
    )
    expect((getByLabelText('Say it plainly') as HTMLElement).tagName).toBe('TEXTAREA')
  })

  test('select renders calm radios (one per option), NOT a dropdown', () => {
    const { getByRole, container } = render(
      <PlaybookField
        field={playbookField('f1', 'select', { label: 'Pick one area' })}
        onSave={noSave}
      />,
    )
    expect(container.querySelector('select')).toBeNull()
    expect(getByRole('group', { name: 'Pick one area' })).toBeTruthy()
    for (const option of ['Career', 'Family', 'Health']) {
      expect(getByRole('radio', { name: option })).toBeTruthy()
    }
  })

  test('multi_select renders checkboxes (one per option), NOT a dropdown', () => {
    const { getByRole, container } = render(
      <PlaybookField
        field={playbookField('f1', 'multi_select', { label: 'All that apply' })}
        onSave={noSave}
      />,
    )
    expect(container.querySelector('select')).toBeNull()
    for (const option of ['Career', 'Family', 'Health']) {
      expect(getByRole('checkbox', { name: option })).toBeTruthy()
    }
  })

  test('date renders a date input', () => {
    const { getByLabelText } = render(
      <PlaybookField field={playbookField('f1', 'date', { label: 'When' })} onSave={noSave} />,
    )
    expect((getByLabelText('When') as HTMLInputElement).type).toBe('date')
  })

  test('scale_1_10 renders a 1–10 radio row', () => {
    const { getByRole, getAllByRole } = render(
      <PlaybookField
        field={playbookField('f1', 'scale_1_10', { label: 'How sure are you' })}
        onSave={noSave}
      />,
    )
    expect(getAllByRole('radio').length).toBe(10)
    expect(getByRole('radio', { name: '1' })).toBeTruthy()
    expect(getByRole('radio', { name: '10' })).toBeTruthy()
  })
})

describe('component: PlaybookField — empty pages are invitations', () => {
  test('exampleAnswer renders as quiet example text under an EMPTY field', () => {
    const { getByText } = render(
      <PlaybookField
        field={playbookField('f1', 'long_text', { exampleAnswer: 'I keep postponing the move.' })}
        onSave={noSave}
      />,
    )
    expect(getByText(/I keep postponing the move\./)).toBeTruthy()
  })

  test('exampleAnswer disappears once the field has an answer', () => {
    const { queryByText } = render(
      <PlaybookField
        field={playbookField('f1', 'long_text', {
          exampleAnswer: 'I keep postponing the move.',
          answer: { value: 'I said it.', source: 'typed', confirmedAt: null },
        })}
        onSave={noSave}
      />,
    )
    expect(queryByText(/I keep postponing the move\./)).toBeNull()
  })
})

describe('component: PlaybookField — autosave', () => {
  test('typing debounces; the flush saves and shows a quiet "Saved"', async () => {
    const scheduler = manualScheduler()
    const saved: string[] = []
    const { getByLabelText, findByText, queryByText } = render(
      <PlaybookField
        field={playbookField('f1', 'long_text', { label: 'Q' })}
        onSave={async (v) => saved.push(v)}
        scheduler={scheduler}
      />,
    )
    fireEvent.input(getByLabelText('Q'), { target: { value: 'my words' } })
    // mid-typing: NO spinner, NO premature save
    expect(saved).toEqual([])
    expect(queryByText('Saved')).toBeNull()
    expect(queryByText(/saving/i)).toBeNull()

    scheduler.flush()
    await waitFor(() => expect(saved).toEqual(['my words']))
    expect(await findByText('Saved')).toBeTruthy()
  })

  test('blur saves immediately', async () => {
    const scheduler = manualScheduler()
    const saved: string[] = []
    const { getByLabelText } = render(
      <PlaybookField
        field={playbookField('f1', 'short_text', { label: 'Q' })}
        onSave={async (v) => saved.push(v)}
        scheduler={scheduler}
      />,
    )
    const input = getByLabelText('Q')
    fireEvent.input(input, { target: { value: 'on blur' } })
    fireEvent.blur(input)
    await waitFor(() => expect(saved).toEqual(['on blur']))
  })

  test('failed save: gentle inline retry, the typed value is NEVER lost', async () => {
    const scheduler = manualScheduler()
    let fail = true
    const saved: string[] = []
    const { getByLabelText, findByRole, getByRole, findByText } = render(
      <PlaybookField
        field={playbookField('f1', 'long_text', { label: 'Q' })}
        onSave={async (v) => {
          if (fail) throw new Error('offline')
          saved.push(v)
        }}
        scheduler={scheduler}
      />,
    )
    const input = getByLabelText('Q') as HTMLTextAreaElement
    fireEvent.input(input, { target: { value: 'precious words' } })
    fireEvent.blur(input)
    const alert = await findByRole('alert')
    expect(alert.textContent).toContain('still here')
    expect(input.value).toBe('precious words')

    fail = false
    fireEvent.click(getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(saved).toEqual(['precious words']))
    expect(await findByText('Saved')).toBeTruthy()
  })

  test('picking a select option saves immediately', async () => {
    const saved: string[] = []
    const { getByRole } = render(
      <PlaybookField field={playbookField('f1', 'select')} onSave={async (v) => saved.push(v)} />,
    )
    fireEvent.click(getByRole('radio', { name: 'Family' }))
    await waitFor(() => expect(saved).toEqual(['Family']))
  })

  test('multi_select saves the joined selection on each toggle', async () => {
    const saved: string[] = []
    const { getByRole } = render(
      <PlaybookField
        field={playbookField('f1', 'multi_select')}
        onSave={async (v) => saved.push(v)}
      />,
    )
    fireEvent.click(getByRole('checkbox', { name: 'Career' }))
    await waitFor(() => expect(saved).toEqual(['Career']))
    fireEvent.click(getByRole('checkbox', { name: 'Health' }))
    await waitFor(() => expect(saved).toEqual(['Career', 'Career, Health']))
  })

  test('a multi_select answer pre-checks its saved options', () => {
    const { getByRole } = render(
      <PlaybookField
        field={playbookField('f1', 'multi_select', {
          answer: { value: 'Career, Health', source: 'typed', confirmedAt: null },
        })}
        onSave={noSave}
      />,
    )
    expect((getByRole('checkbox', { name: 'Career' }) as HTMLInputElement).checked).toBe(true)
    expect((getByRole('checkbox', { name: 'Health' }) as HTMLInputElement).checked).toBe(true)
    expect((getByRole('checkbox', { name: 'Family' }) as HTMLInputElement).checked).toBe(false)
  })

  test('scale_1_10 saves the picked number', async () => {
    const saved: string[] = []
    const { getByRole } = render(
      <PlaybookField
        field={playbookField('f1', 'scale_1_10')}
        onSave={async (v) => saved.push(v)}
      />,
    )
    fireEvent.click(getByRole('radio', { name: '7' }))
    await waitFor(() => expect(saved).toEqual(['7']))
  })
})

describe('component: PlaybookField — deprecated fields', () => {
  test('deprecated WITH an answer renders read-only with a soft note', () => {
    const { getByText, container } = render(
      <PlaybookField
        field={playbookField('f1', 'long_text', {
          label: 'Old question',
          deprecatedInVersion: 3,
          answer: { value: 'My old answer.', source: 'typed', confirmedAt: null },
        })}
        onSave={noSave}
      />,
    )
    expect(container.querySelector('input, textarea')).toBeNull()
    expect(getByText('My old answer.')).toBeTruthy()
    expect(getByText(/retired/i)).toBeTruthy()
  })

  test('deprecated WITHOUT an answer renders nothing (nothing to keep)', () => {
    const { container } = render(
      <PlaybookField
        field={playbookField('f1', 'long_text', { deprecatedInVersion: 3 })}
        onSave={noSave}
      />,
    )
    expect(container.textContent).toBe('')
  })
})
