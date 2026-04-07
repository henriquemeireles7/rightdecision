import Stripe from 'stripe'
import { env } from '@/platform/env'

export const payments = new Stripe(env.STRIPE_SECRET_KEY)

export const plans = {
  course: {
    priceId: env.STRIPE_PRICE_ID,
    name: 'Right Decision — The Course',
    amount: 19700,
    currency: 'usd',
    interval: 'year' as const,
  },
} as const

export type PlanId = keyof typeof plans
