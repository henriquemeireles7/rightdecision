import { env } from '@/platform/env'
import { ProviderError } from '@/providers/errors'

const BASE_URL = 'https://app.upload-post.com/api/v1'

interface PostMetrics {
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  impressions: number | null
  reach: number | null
}

export async function getMetrics(uploadPostId: string): Promise<PostMetrics> {
  const apiKey = env.UPLOAD_POST_API_KEY
  if (!apiKey)
    throw new ProviderError(
      'upload-post-analytics',
      'auth',
      401,
      'UPLOAD_POST_API_KEY not configured',
    )

  try {
    const response = await fetch(`${BASE_URL}/posts/${uploadPostId}/analytics`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (response.status === 404 || response.status === 410) {
      throw new ProviderError(
        'upload-post-analytics',
        'getMetrics',
        response.status,
        'Post not found or deleted',
      )
    }
    if (response.status === 429) {
      throw new ProviderError('upload-post-analytics', 'getMetrics', 429, 'Rate limited')
    }
    if (response.status >= 500) {
      throw new ProviderError(
        'upload-post-analytics',
        'getMetrics',
        response.status,
        await response.text(),
      )
    }
    if (!response.ok) {
      throw new ProviderError(
        'upload-post-analytics',
        'getMetrics',
        response.status,
        await response.text(),
      )
    }

    return response.json() as Promise<PostMetrics>
  } catch (error) {
    if (error instanceof ProviderError) throw error
    throw new ProviderError('upload-post-analytics', 'getMetrics', 500, error)
  }
}
