import { env } from '@/platform/env'
import { ProviderError } from '@/providers/errors'

const BASE_URL = 'https://app.upload-post.com/api/v1'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiKey = env.UPLOAD_POST_API_KEY
  if (!apiKey) throw new ProviderError('upload-post', 'auth', 401, 'UPLOAD_POST_API_KEY not configured')

  const url = `${BASE_URL}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (response.status === 401) {
    throw new ProviderError('upload-post', 'auth', 401, await response.text())
  }
  if (response.status === 429) {
    throw new ProviderError('upload-post', 'rateLimit', 429, await response.text())
  }
  if (response.status >= 500) {
    throw new ProviderError('upload-post', 'server', response.status, await response.text())
  }
  if (!response.ok) {
    throw new ProviderError('upload-post', 'request', response.status, await response.text())
  }

  return response.json() as Promise<T>
}

export interface PostResult {
  id: string
  status: string
}

export interface Profile {
  id: string
  platform: string
  handle: string
}

export async function post(
  videoUrl: string,
  description: string,
  hashtags: string[],
  profileId: string,
): Promise<PostResult> {
  try {
    return await request<PostResult>('/posts', {
      method: 'POST',
      body: JSON.stringify({
        video_url: videoUrl,
        description,
        hashtags,
        profile_id: profileId,
      }),
    })
  } catch (error) {
    if (error instanceof ProviderError) throw error
    throw new ProviderError('upload-post', 'post', 500, error)
  }
}

export async function getPostStatus(postId: string): Promise<PostResult> {
  try {
    return await request<PostResult>(`/posts/${postId}`)
  } catch (error) {
    if (error instanceof ProviderError) throw error
    throw new ProviderError('upload-post', 'getPostStatus', 500, error)
  }
}

export async function listProfiles(): Promise<Profile[]> {
  try {
    return await request<Profile[]>('/profiles')
  } catch (error) {
    if (error instanceof ProviderError) throw error
    throw new ProviderError('upload-post', 'listProfiles', 500, error)
  }
}
