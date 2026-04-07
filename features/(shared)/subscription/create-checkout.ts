import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { env } from '@/platform/env'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import { payments, plans } from '@/providers/payments'

const checkoutSchema = z.object({
  email: z.string().email().optional(),
})

export const checkoutRoutes = new Hono()

checkoutRoutes.post('/', zValidator('json', checkoutSchema), async (c) => {
  const { email } = c.req.valid('json')

  try {
    const session = await payments.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plans.course.priceId, quantity: 1 }],
      success_url: `${env.PUBLIC_APP_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: env.PUBLIC_APP_URL,
      allow_promotion_codes: true,
      ...(email ? { customer_email: email } : {}),
    })

    return success(c, { url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return throwError(c, 'PAYMENT_FAILED')
  }
})
