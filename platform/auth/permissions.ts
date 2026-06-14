import type { Context, Next } from 'hono'
import { throwError } from '@/platform/errors'

/**
 * LEGACY NOTE (Platform V2, eng-schema S7): the `pro` role and its permissions row
 * are legacy once enrollments gate content. V2 content access is decided by
 * enrollment rows (platform/auth/enrollment.ts + features/(shared)/enrollment/),
 * NOT by role. Do not migrate or remove the enum — existing users keep the value,
 * and admin gating stays role-based. Do not add new content permissions to `pro`.
 */
const permissions = {
  free: ['view_landing', 'view_pricing'],
  pro: ['view_course', 'track_progress', 'manage_settings'],
  admin: ['manage_content', 'manage_users', 'view_analytics'],
} as const

type Role = keyof typeof permissions
type Permission = (typeof permissions)[Role][number]

function hasPermission(role: Role, permission: Permission): boolean {
  const rolePerms = permissions[role] as readonly string[]
  return rolePerms.includes(permission)
}

export function requirePermission(permission: Permission) {
  return async (c: Context, next: Next) => {
    const user = c.get('user')
    if (!user || !hasPermission(user.role, permission)) {
      return throwError(c, 'FORBIDDEN')
    }
    await next()
  }
}
