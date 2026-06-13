import { and, eq } from 'drizzle-orm'
import { activeEnrollmentClause, canAccessMaterial } from '@/features/(shared)/enrollment/service'
import { db } from '@/platform/db/client'
import { enrollments, materials, programMaterials } from '@/platform/db/schema'
import { getSignedUrl } from '@/providers/storage'

/** Resolver for requireEnrollment: every program the material is mapped to. */
export async function programIdsForMaterial(materialId: string): Promise<string[]> {
  const rows = await db
    .select({ programId: programMaterials.programId })
    .from(programMaterials)
    .where(eq(programMaterials.materialId, materialId))
  return rows.map((row) => row.programId)
}

/**
 * Materials mapped to the user's enrolled program(s) via program_materials,
 * deduplicated, WITHOUT fileKey — the signed URL is the only download path.
 */
export async function listMaterials(userId: string) {
  const rows = await db
    .select({
      id: materials.id,
      title: materials.title,
      description: materials.description,
      fileSizeBytes: materials.fileSizeBytes,
      mimeType: materials.mimeType,
      lessonId: materials.lessonId,
      createdAt: materials.createdAt,
    })
    .from(materials)
    .innerJoin(programMaterials, eq(programMaterials.materialId, materials.id))
    .innerJoin(
      enrollments,
      and(
        eq(enrollments.programId, programMaterials.programId),
        eq(enrollments.userId, userId),
        activeEnrollmentClause(),
      ),
    )
    .orderBy(materials.createdAt)

  const seen = new Set<string>()
  return rows.filter((row) => {
    if (seen.has(row.id)) return false
    seen.add(row.id)
    return true
  })
}

/** Short-lived R2 download URL, gated by canAccessMaterial — never sign without access. */
export async function getMaterialDownloadUrl(userId: string, materialId: string) {
  const [material] = await db.select().from(materials).where(eq(materials.id, materialId)).limit(1)
  if (!material) return { error: 'NOT_FOUND' as const }
  if (!(await canAccessMaterial(userId, materialId))) {
    return { error: 'ENROLLMENT_REQUIRED' as const }
  }

  // R2 can be down (or unconfigured) — a thrown ProviderError must surface as a clean 503,
  // never a raw 500.
  let url: string
  try {
    url = await getSignedUrl(material.fileKey)
  } catch (error) {
    console.error('[materials-view] getSignedUrl failed:', error)
    return { error: 'STORAGE_UNAVAILABLE' as const }
  }
  return { data: { url, title: material.title, mimeType: material.mimeType } }
}
