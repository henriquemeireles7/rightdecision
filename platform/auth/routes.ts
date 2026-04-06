import { Hono } from 'hono'
import { auth } from './config'

export const authRoutes = new Hono()

authRoutes.all('/*', (c) => {
  return auth.handler(c.req.raw)
})
