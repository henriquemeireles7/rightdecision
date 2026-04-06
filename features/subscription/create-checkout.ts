import { Hono } from 'hono'
import { env } from '@/platform/env'
import { throwError } from '@/platform/errors'
import { payments, plans } from '@/providers/payments'

export const checkoutRoutes = new Hono()

checkoutRoutes.post('/', async (c) => {
  try {
    const session = await payments.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: plans.course.currency,
            product_data: {
              name: plans.course.name,
              description:
                '7 modules + AI prompt templates. Turn stuck goals into clear decisions and daily actions.',
            },
            unit_amount: plans.course.priceAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${env.PUBLIC_APP_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: env.PUBLIC_APP_URL,
      allow_promotion_codes: true,
    })

    return c.json({ ok: true as const, url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return throwError(c, 'PAYMENT_FAILED')
  }
})
