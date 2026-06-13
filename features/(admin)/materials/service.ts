import { randomUUID } from 'node:crypto'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { lessons, materials, programMaterials, programs } from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'
import { ProviderError } from '@/providers/errors'
import { getUploadUrl } from '@/providers/storage'

type ServiceError = { error: ErrorCode; details?: string }
type Material = typeof materials.$inferSelect

/** Keep only safe filename characters; never let a client-controlled name shape the key path. */
function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? ''
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^\.+/, '')
  return cleaned.length > 0 ? cleaned : 'file'
}

/** Presigned PUT for direct-to-R2 upload — bytes never touch Hono (eng-schema M5). */
export async function requestMaterialUploadUrl(input: {
  fileName: string
  mimeType: string
}): Promise<{ uploadUrl: string; fileKey: string } | ServiceError> {
  const fileKey = `materials/${randomUUID()}/${sanitizeFileName(input.fileName)}`
  try {
    const uploadUrl = await getUploadUrl(fileKey, input.mimeType)
    return { uploadUrl, fileKey }
  } catch (error) {
    if (error instanceof ProviderError) {
      return { error: 'INTERNAL_ERROR', details: `Upload URL presign failed: ${error.message}` }
    }
    throw error
  }
}

async function lessonExists(lessonId: string): Promise<boolean> {
  const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) })
  return lesson !== undefined
}

export async function createMaterial(input: {
  title: string
  description?: string
  fileKey: string
  fileSizeBytes?: number
  mimeType?: string
  lessonId?: string
}): Promise<{ material: Material } | ServiceError> {
  if (input.lessonId && !(await lessonExists(input.lessonId))) {
    return { error: 'LESSON_NOT_FOUND' }
  }
  const [material] = await db.insert(materials).values(input).returning()
  if (!material) return { error: 'INTERNAL_ERROR' }
  return { material }
}

export async function listMaterials(): Promise<{ materials: Material[] }> {
  const rows = await db.select().from(materials).orderBy(asc(materials.createdAt))
  return { materials: rows }
}

export async function updateMaterial(
  materialId: string,
  patch: {
    title?: string
    description?: string | null
    fileSizeBytes?: number | null
    mimeType?: string | null
    lessonId?: string | null
  },
): Promise<{ material: Material } | ServiceError> {
  if (patch.lessonId && !(await lessonExists(patch.lessonId))) {
    return { error: 'LESSON_NOT_FOUND' }
  }
  const [material] = await db
    .update(materials)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(materials.id, materialId))
    .returning()
  if (!material) return { error: 'NOT_FOUND' }
  return { material }
}

export async function deleteMaterial(
  materialId: string,
): Promise<{ deleted: true } | ServiceError> {
  const deleted = await db
    .delete(materials)
    .where(eq(materials.id, materialId))
    .returning({ id: materials.id })
  if (deleted.length === 0) return { error: 'NOT_FOUND' }
  return { deleted: true }
}

// ─── program_materials mapping ───

export async function addMaterialToProgram(
  programId: string,
  materialId: string,
): Promise<{ mapping: typeof programMaterials.$inferSelect } | ServiceError> {
  const program = await db.query.programs.findFirst({ where: eq(programs.id, programId) })
  if (!program) return { error: 'PROGRAM_NOT_FOUND' }
  const material = await db.query.materials.findFirst({ where: eq(materials.id, materialId) })
  if (!material) return { error: 'NOT_FOUND' }

  // Idempotent: re-adding an existing pair no-ops on the unique index.
  const [inserted] = await db
    .insert(programMaterials)
    .values({ programId, materialId })
    .onConflictDoNothing({ target: [programMaterials.programId, programMaterials.materialId] })
    .returning()
  if (inserted) return { mapping: inserted }

  const existing = await db.query.programMaterials.findFirst({
    where: and(
      eq(programMaterials.programId, programId),
      eq(programMaterials.materialId, materialId),
    ),
  })
  if (!existing) return { error: 'INTERNAL_ERROR' }
  return { mapping: existing }
}

export async function removeMaterialFromProgram(
  programId: string,
  materialId: string,
): Promise<{ removed: true } | ServiceError> {
  const removed = await db
    .delete(programMaterials)
    .where(
      and(eq(programMaterials.programId, programId), eq(programMaterials.materialId, materialId)),
    )
    .returning({ id: programMaterials.id })
  if (removed.length === 0) return { error: 'NOT_FOUND' }
  return { removed: true }
}

export async function listProgramMaterials(
  programId: string,
): Promise<{ materials: Material[] } | ServiceError> {
  const program = await db.query.programs.findFirst({ where: eq(programs.id, programId) })
  if (!program) return { error: 'PROGRAM_NOT_FOUND' }

  const rows = await db
    .select({ material: materials })
    .from(programMaterials)
    .innerJoin(materials, eq(programMaterials.materialId, materials.id))
    .where(eq(programMaterials.programId, programId))
    .orderBy(asc(programMaterials.createdAt))
  return { materials: rows.map((row) => row.material) }
}
