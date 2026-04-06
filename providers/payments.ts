import Stripe from 'stripe'
import { env } from '@/platform/env'

export const payments = new Stripe(env.STRIPE_SECRET_KEY)

export const plans = {
  course: { priceAmount: 19700, name: 'Right Decision — The Course', currency: 'usd' },
} as const

export type PlanId = keyof typeof plans
