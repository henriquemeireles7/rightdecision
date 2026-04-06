import { Hono } from 'hono'
import { db } from '@/platform/db/client'
import { purchases } from '@/platform/db/schema'
import { env } from '@/platform/env'
import { payments } from '@/providers/payments'

export const webhookRoutes = new Hono()

webhookRoutes.post('/', async (c) => {
  const body = await c.req.text()
  const signature = c.req.header('stripe-signature')

  if (!signature) {
    return c.json({ error: 'No signature' }, 400)
  }

  let event
  try {
    event = payments.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return c.json({ error: 'Invalid signature' }, 400)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    if (session.payment_status !== 'paid') {
      return c.json({ received: true })
    }

    const email = session.customer_details?.email ?? session.customer_email ?? ''
    const customerId =
      typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? '')

    if (!email) {
      console.error('Webhook: no email in session', session.id)
      return c.json({ received: true })
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

  return c.json({ received: true })
})
