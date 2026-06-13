import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import type { JSX } from 'preact'
import { ApiError } from '@/features/(shared)/api-client'
import type { AdminData } from './data'
import { DataContext } from './data'
import { MaterialsScreen } from './materials'
import { makeData, makeMaterial } from './test-fixtures'
import { type PutFile, PutFileContext } from './uploader'

afterEach(cleanup)

function withData(data: AdminData, putFile: PutFile, ui: JSX.Element) {
  return render(
    <DataContext.Provider value={data}>
      <PutFileContext.Provider value={putFile}>{ui}</PutFileContext.Provider>
    </DataContext.Provider>,
  )
}

function pickFile(container: Element, file: File) {
  const input = container.querySelector('input[type="file"]')
  if (!input) throw new Error('No file input rendered')
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  fireEvent.change(input)
}

const pdf = () => new File(['pdf-bytes'], 'Workbook Final.pdf', { type: 'application/pdf' })

describe('screen: MaterialsScreen', () => {
  test('empty state invites the first upload', async () => {
    const data = makeData({ listMaterials: async () => ({ materials: [] }) })
    const { findByText } = withData(data, async () => {}, <MaterialsScreen />)
    expect(await findByText(/No materials yet/)).toBeTruthy()
  })

  test('list failure → retryable error', async () => {
    const data = makeData({
      listMaterials: async () => {
        throw new ApiError('INTERNAL_ERROR', 500, 'R2 listing failed')
      },
    })
    const { findByText, findByRole } = withData(data, async () => {}, <MaterialsScreen />)
    expect(await findByText('R2 listing failed')).toBeTruthy()
    expect(await findByRole('button', { name: 'Try again' })).toBeTruthy()
  })

  test('upload: presign → direct PUT with progress → record created → row appears', async () => {
    const presigns: Array<Record<string, unknown>> = []
    const created: Array<Record<string, unknown>> = []
    const puts: Array<{ url: string; name: string }> = []
    let sendProgress: (pct: number) => void = () => {}
    let finishPut: () => void = () => {}
    const putFile: PutFile = (url, file, onProgress) => {
      puts.push({ url, name: file.name })
      sendProgress = onProgress
      return new Promise((resolve) => {
        finishPut = resolve
      })
    }
    const data = makeData({
      listMaterials: async () => ({ materials: [] }),
      requestMaterialUploadUrl: async (json) => {
        presigns.push(json)
        return {
          uploadUrl: 'https://r2.example/put-here',
          fileKey: 'materials/uuid/workbook-final.pdf',
        }
      },
      createMaterial: async (json) => {
        created.push(json)
        return { material: makeMaterial({ id: 'mt-9', title: json.title, fileKey: json.fileKey }) }
      },
    })
    const { container, findByText, findByRole } = withData(data, putFile, <MaterialsScreen />)
    await findByText(/No materials yet/)
    pickFile(container, pdf())
    // title prefilled from the file name; she can edit it before uploading
    const title = (await screenFindTitle(container)) as HTMLInputElement
    expect(title.value).toBe('Workbook Final')
    fireEvent.click(await findByRole('button', { name: 'Upload material' }))
    await waitFor(() => expect(puts.length).toBe(1))
    expect(presigns).toEqual([{ fileName: 'Workbook Final.pdf', mimeType: 'application/pdf' }])
    expect(puts[0]?.url).toBe('https://r2.example/put-here')
    sendProgress(60)
    await findByText(/60%/)
    finishPut()
    await waitFor(() => expect(created.length).toBe(1))
    expect(created[0]).toMatchObject({
      title: 'Workbook Final',
      fileKey: 'materials/uuid/workbook-final.pdf',
      fileSizeBytes: 9,
      mimeType: 'application/pdf',
    })
    expect(await findByText('Material uploaded.')).toBeTruthy()
    expect(await findByText('Workbook Final')).toBeTruthy()
  })

  test('presign failure is explained with retry', async () => {
    const data = makeData({
      listMaterials: async () => ({ materials: [] }),
      requestMaterialUploadUrl: async () => {
        throw new ApiError('INTERNAL_ERROR', 500, 'Upload URL presign failed')
      },
    })
    const { container, findByRole, findByText } = withData(
      data,
      async () => {},
      <MaterialsScreen />,
    )
    await findByText(/No materials yet/)
    pickFile(container, pdf())
    fireEvent.click(await findByRole('button', { name: 'Upload material' }))
    expect(await findByText(/couldn't prepare the upload/i)).toBeTruthy()
    expect(await findByRole('button', { name: 'Upload material' })).toBeTruthy()
  })

  test('direct PUT failure is explained (file never reached storage)', async () => {
    const data = makeData({
      listMaterials: async () => ({ materials: [] }),
      requestMaterialUploadUrl: async () => ({
        uploadUrl: 'https://r2.example/put',
        fileKey: 'materials/k',
      }),
    })
    const putFile: PutFile = async () => {
      throw new Error('The file upload was rejected (HTTP 403)')
    }
    const { container, findByRole, findByText } = withData(data, putFile, <MaterialsScreen />)
    await findByText(/No materials yet/)
    pickFile(container, pdf())
    fireEvent.click(await findByRole('button', { name: 'Upload material' }))
    expect(await findByText(/HTTP 403/)).toBeTruthy()
    expect(await findByText(/never reached storage/i)).toBeTruthy()
  })

  test('delete confirms, then removes the row', async () => {
    const deleted: string[] = []
    const data = makeData({
      listMaterials: async () => ({
        materials: [makeMaterial({ id: 'mt-1', title: 'Old Checklist' })],
      }),
      deleteMaterial: async (id) => {
        deleted.push(id)
        return { deleted: true }
      },
    })
    const { findByRole, findByText, queryByText } = withData(
      data,
      async () => {},
      <MaterialsScreen />,
    )
    await findByText('Old Checklist')
    fireEvent.click(await findByRole('button', { name: 'Delete Old Checklist' }))
    expect(await findByText(/can't be undone/i)).toBeTruthy()
    fireEvent.click(await findByRole('button', { name: 'Delete material' }))
    await waitFor(() => expect(deleted).toEqual(['mt-1']))
    await waitFor(() => expect(queryByText('Old Checklist')).toBeNull())
  })
})

async function screenFindTitle(container: Element): Promise<Element> {
  let input: Element | null = null
  await waitFor(() => {
    input = container.querySelector('#material-title')
    if (!input) throw new Error('no title input yet')
  })
  if (!input) throw new Error('no title input')
  return input
}
