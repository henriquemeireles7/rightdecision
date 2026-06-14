import Stripe from 'stripe'
import { env } from '@/platform/env'

// Pin the API version the handlers are written against. The SDK (v22) defaults to
// '2026-03-25.dahlia', where `current_period_end` lives on subscription ITEMS (not the
// top-level Subscription) and `invoice.subscription` moved under
// `invoice.parent.subscription_details`. Pinning makes that contract explicit so an SDK
// bump can't silently shift the shape our webhook handlers read.
export const STRIPE_API_VERSION = '2026-03-25.dahlia' as const

export const payments = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION })

/** Current period end (unix seconds) for a subscription on the dahlia API version, where
 * the field lives on the first subscription item, not the top-level object. 0 if absent. */
export function subscriptionPeriodEnd(sub: Stripe.Subscription): number {
  const item = (sub as unknown as { items?: { data?: Array<{ current_period_end?: number }> } })
    .items?.data?.[0]
  return item?.current_period_end ?? 0
}

/** Resolve a subscription id from an invoice across API versions: dahlia moved it to
 * `invoice.parent.subscription_details.subscription`; fall back to the legacy top-level. */
export function invoiceSubscriptionId(invoice: unknown): string {
  const inv = invoice as {
    subscription?: unknown
    parent?: { subscription_details?: { subscription?: unknown } }
  }
  const fromParent = inv.parent?.subscription_details?.subscription
  if (typeof fromParent === 'string') return fromParent
  if (fromParent && typeof fromParent === 'object' && 'id' in fromParent) {
    return String((fromParent as { id: string }).id)
  }
  return typeof inv.subscription === 'string' ? inv.subscription : ''
}

/** Format a Stripe minor-unit amount as currency (e.g. 19700, 'usd' → "$197.00"). */
export function formatStripeAmount(amountInMinorUnits: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInMinorUnits / 100)
}

export const plans = {
  yearly: {
    priceId: env.STRIPE_PRICE_ID,
    name: 'Life Decisions — Yearly',
    amount: 19700,
    currency: 'usd',
    interval: 'year' as const,
  },
  monthly: {
    priceId: env.STRIPE_MONTHLY_PRICE_ID,
    name: 'Life Decisions — Monthly',
    amount: 1970,
    currency: 'usd',
    interval: 'month' as const,
  },
} as const

type PlanInterval = 'month' | 'year'

/** Derive billing interval from a Stripe price ID */
export function intervalFromPriceId(priceId: string): PlanInterval {
  if (priceId === plans.monthly.priceId) return 'month'
  if (priceId === plans.yearly.priceId) return 'year'
  console.warn(`[payments] Unknown price ID: ${priceId}, defaulting to year`)
  return 'year'
}
