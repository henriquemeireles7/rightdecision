import { Hono } from 'hono'
import { db } from '@/platform/db/client'
import { purchases } from '@/platform/db/schema'
import { env } from '@/platform/env'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import { payments } from '@/providers/payments'

export const webhookRoutes = new Hono()

webhookRoutes.post('/', async (c) => {
  const body = await c.req.text()
  const signature = c.req.header('stripe-signature')

  if (!signature) {
    return throwError(c, 'VALIDATION_ERROR', 'No signature')
  }

  let event
  try {
    event = payments.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return throwError(c, 'VALIDATION_ERROR', 'Invalid signature')
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    if (session.payment_status !== 'paid') {
      return success(c, { received: true })
    }

    const email = session.customer_details?.email ?? session.customer_email ?? ''
    const customerId =
      typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? '')

    if (!email) {
      console.error('Webhook: no email in session', session.id)
      return success(c, { received: true })
    }

    try {
      await db
        .insert(purchases)
        .values({
          email: email.toLowerCase().trim(),
          stripeCustomerId: customerId,
          stripeSessionId: session.id,
          amountCents: session.amount_total ?? 19700,
          userId: session.client_reference_id ?? undefined,
          status: 'active',
        })
        .onConflictDoNothing({ target: purchases.stripeSessionId })
    } catch (error) {
      console.error('Webhook: create purchase error:', error)
    }
  }

  return success(c, { received: true })
})
