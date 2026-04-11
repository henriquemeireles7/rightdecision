import type { Context, Next } from 'hono'
import { throwError } from '@/platform/errors'

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
