/**
 * Build-time GitHub star count snapshot
 * Outputs: public/github-stars.json
 * Fetches star count for the harness repo (when it exists)
 * Graceful fallback: writes {} if API fails or repo doesn't exist yet
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO = 'henriquemeireles7/harness'

async function fetchStars(): Promise<{ stars: number; fetchedAt: string } | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'therightdecision-build',
      },
    })

    if (!response.ok) {
      console.warn(`GitHub API returned ${response.status} for ${REPO}`)
      return null
    }

    const data = (await response.json()) as { stargazers_count: number }
    return {
      stars: data.stargazers_count,
      fetchedAt: new Date().toISOString(),
    }
  } catch (err) {
    console.warn('GitHub API failed:', err)
    return null
  }
}

async function buildStars(): Promise<void> {
  const result = await fetchStars()
  mkdirSync(join(process.cwd(), 'public'), { recursive: true })
  writeFileSync(join(process.cwd(), 'public/github-stars.json'), JSON.stringify(result || {}))
  if (result) {
    console.log(`GitHub stars: ${result.stars}`)
  } else {
    console.log('GitHub stars: unavailable (repo may not exist yet)')
  }
}

buildStars()
