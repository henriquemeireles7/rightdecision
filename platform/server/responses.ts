import type { Context } from 'hono'

export function success<T>(c: Context, data: T) {
  return c.json({ ok: true as const, data })
}

export function paginated<T>(c: Context, data: T[], total: number, page: number, perPage: number) {
  return c.json({
    ok: true as const,
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
}

export function created<T>(c: Context, data: T) {
  return c.json({ ok: true as const, data }, 201)
}

export function noContent(c: Context) {
  return c.body(null, 204)
}
