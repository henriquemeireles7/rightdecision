import { z } from 'zod'
import { env } from '@/platform/env'
import { ProviderError } from '@/providers/errors'

/**
 * Cover Art System (ADR 18).
 * Returns raw bytes — NEVER uploads. The calling feature owns storage (TD-8:
 * providers never import providers). Module subject is the ONLY variable.
 */

/** Bump on ANY change to MASTER_PROMPT so regenerated covers are traceable to a prompt version. */
export const COVER_PROMPT_VERSION = 'v1'

export const MASTER_PROMPT = `Painterly editorial illustration, scene/object-based composition.
Style: warm, quiet, contemplative; visible brushwork; soft natural light; generous negative space.
Palette LOCKED to the warm family — anchor colors: warm cream #F7F3EB, soft beige #E8DCC8,
sand #D9C7A7, muted gold #C9A35C, terracotta #B86B4B, deep warm brown #5C4632.
Subject matter: everyday scenes and objects rendered with editorial restraint — interiors,
landscapes, still life, hands-off symbolic objects.
STRICT NEGATIVES: no text, no typography, no letters, no words, no numbers, no logos,
no human faces, no portraits, no purple, no neon colors, no blue-dominant palette,
no glossy 3D render, no photorealism.`

// Vendor swap surface: change these two constants + the fetch in generateCoverImage; the interface stays.
const IMAGE_GEN_ENDPOINT = 'https://api.openai.com/v1/images/generations'
const IMAGE_GEN_MODEL = 'gpt-image-1'

// Nearest supported generation sizes; fixed crops to exact 2:3 / 16:9 happen downstream (ADR 18).
const SIZE_BY_ASPECT = {
  '2:3': '1024x1536',
  '16:9': '1536x1024',
} as const

const coverImageOptionsSchema = z.object({
  subject: z.string().min(1),
  aspect: z.enum(['2:3', '16:9']),
})
export type CoverImageOptions = z.infer<typeof coverImageOptionsSchema>

const imageResponseSchema = z.object({
  data: z.array(z.object({ b64_json: z.string().min(1) })),
})

/** Generate a cover image and return its bytes. The caller uploads to R2 via providers/storage. */
export async function generateCoverImage(opts: CoverImageOptions): Promise<Uint8Array> {
  const apiKey = env.IMAGE_GEN_API_KEY
  if (!apiKey) {
    throw new ProviderError(
      'image-gen',
      'generateCoverImage',
      500,
      'IMAGE_GEN_API_KEY not configured',
    )
  }
  try {
    const { subject, aspect } = coverImageOptionsSchema.parse(opts)
    const response = await fetch(IMAGE_GEN_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: IMAGE_GEN_MODEL,
        prompt: `${MASTER_PROMPT}\n\nSubject of this illustration: ${subject}`,
        size: SIZE_BY_ASPECT[aspect],
        n: 1,
      }),
    })
    if (!response.ok) {
      throw new ProviderError(
        'image-gen',
        'generateCoverImage',
        response.status,
        await response.text(),
      )
    }
    const [first] = imageResponseSchema.parse(await response.json()).data
    if (!first) {
      throw new ProviderError('image-gen', 'generateCoverImage', 502, 'Response contained no image')
    }
    return new Uint8Array(Buffer.from(first.b64_json, 'base64'))
  } catch (error) {
    if (error instanceof ProviderError) throw error
    throw new ProviderError('image-gen', 'generateCoverImage', 500, error)
  }
}
