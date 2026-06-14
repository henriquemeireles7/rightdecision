import type { enrollments } from '@/platform/db/schema'

export type AppUser = {
  id: string
  email: string
  name: string
  role: 'free' | 'pro' | 'admin'
}

export type Enrollment = typeof enrollments.$inferSelect

export type AppEnv = {
  Variables: {
    user: AppUser
    session: unknown
    // Set by requireEnrollment: the active enrollment that granted access
    enrollment?: Enrollment
    // Request-scoped memoization for enrollment checks (eng-schema S1/S2: no cross-request cache)
    enrollmentCache?: {
      byProgram: Map<string, Enrollment | null>
      legacyAccess?: boolean
    }
  }
}
