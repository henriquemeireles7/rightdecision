import { PostHog } from 'posthog-node'
import { env } from '@/platform/env'

const client = env.POSTHOG_API_KEY
  ? new PostHog(env.POSTHOG_API_KEY, { host: env.POSTHOG_HOST })
  : null

export async function track(
  event: string,
  properties?: Record<string, unknown>,
  distinctId?: string,
): Promise<void> {
  if (!client) return
  client.capture({
    distinctId: distinctId ?? 'anonymous',
    event,
    properties,
  })
}

export async function identify(
  distinctId: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  if (!client) return
  client.identify({ distinctId, properties })
}

export async function shutdown(): Promise<void> {
  if (!client) return
  await client.shutdown()
}
