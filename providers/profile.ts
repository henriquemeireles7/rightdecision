import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ProviderError } from '@/providers/errors'

// ─── Constants ───────────────────────────────────────────────────────────────

const PROFILES_DIR = join(process.cwd(), 'content/profiles')

const REQUIRED_PROFILE_SECTIONS = ['## Identity', '## ICP', '## Plays', '## Voice']
const REQUIRED_SOCIAL_SECTIONS = [
  '## Platform Accounts',
  '## Active Platforms',
  '## Platform-Specific Strategies',
]

// ─── Types ───────────────────────────────────────────────────────────────────

export type QuickRef = {
  who: string
  for: string
  bigIdea: string
  primaryCta: string
  health: number
  playCount: number
  lastLearning: string | null
}

export type ProfileData = {
  name: string
  profileContent: string
  socialContent: string
  quickRef: QuickRef
}

export type ProfileReport = {
  valid: boolean
  profiles: Array<{
    name: string
    healthScore: number
    errors: string[]
  }>
}

// ─── Quick Reference Parser ──────────────────────────────────────────────────

function matchField(content: string, pattern: RegExp): string | null {
  const match = content.match(pattern)
  return match?.[1]?.trim() ?? null
}

function parseQuickRef(content: string): QuickRef {
  const health = matchField(content, /\*\*Health:\*\*\s*(\d+)\/10/)
  const plays = matchField(content, /\*\*Plays:\*\*\s*(\d+)/)
  const lastLearning = matchField(content, /\*\*Last Learning:\*\*\s*(.+)/)

  return {
    who: matchField(content, /\*\*Who:\*\*\s*(.+)/) ?? '',
    for: matchField(content, /\*\*For:\*\*\s*(.+)/) ?? '',
    bigIdea: matchField(content, /\*\*Big Idea:\*\*\s*(.+)/) ?? '',
    primaryCta: matchField(content, /\*\*Primary CTA:\*\*\s*(.+)/) ?? '',
    health: health ? Number.parseInt(health, 10) : 0,
    playCount: plays ? Number.parseInt(plays, 10) : 0,
    lastLearning: lastLearning === 'none yet' ? null : lastLearning,
  }
}

// ─── Section Validation ──────────────────────────────────────────────────────

function validateSections(content: string, required: string[], fileName: string): string[] {
  const errors: string[] = []
  for (const section of required) {
    if (!content.includes(section)) {
      errors.push(`${fileName}: missing required section "${section}"`)
    }
  }
  return errors
}

// ─── Health Score ────────────────────────────────────────────────────────────

function computeHealthScore(profileContent: string, socialContent: string, name: string): number {
  let score = 0

  // Completeness (0-5): 1 point each for filled sections
  const scoredSections = [
    '## Identity',
    '## ICP',
    '## Core Messaging Framework',
    '## Plays',
    '## Voice',
  ]
  for (const section of scoredSections) {
    if (hasFilledSection(profileContent, section)) score++
  }

  // Depth (0-3)
  const playMatches = profileContent.match(/### Play \d+/g)
  if (playMatches && playMatches.length >= 2) score++

  const hookMatches = profileContent.match(/\d+\.\s+\{?hook/gi)
  const hasDeepHooks = hookMatches && hookMatches.length >= 3
  if (hasDeepHooks) score++

  if (socialContent.includes('### ') && hasFilledSection(socialContent, '## Platform-Specific')) {
    score++
  }

  // Maturity (0-3)
  const learningDir = join(PROFILES_DIR, name, 'learning')
  if (existsSync(learningDir)) {
    const learnings = readdirSync(learningDir).filter((f) => f.endsWith('.md'))
    if (learnings.length > 0) score++
    if (learnings.length >= 3) score++
  }

  const changelogDir = join(PROFILES_DIR, name, 'changelog')
  if (existsSync(changelogDir)) {
    const changelogs = readdirSync(changelogDir).filter((f) => f.endsWith('.md'))
    if (
      changelogs.some((f) => readFileSync(join(changelogDir, f), 'utf-8').includes('## Metrics'))
    ) {
      score++
    }
  }

  return Math.min(10, score)
}

function hasFilledSection(content: string, sectionHeader: string): boolean {
  const idx = content.indexOf(sectionHeader)
  if (idx === -1) return false

  // Get content between this section and the next ## or end
  const after = content.slice(idx + sectionHeader.length)
  const nextSection = after.search(/\n## /)
  const sectionBody = nextSection === -1 ? after : after.slice(0, nextSection)

  // Check if section has meaningful content (not just placeholders)
  const trimmed = sectionBody.trim()
  if (trimmed.length < 10) return false
  if (trimmed.match(/^\{.*\}$/)) return false

  return true
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function listProfiles(): string[] {
  if (!existsSync(PROFILES_DIR)) return []

  return readdirSync(PROFILES_DIR, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        !d.name.startsWith('_') &&
        existsSync(join(PROFILES_DIR, d.name, 'profile.md')),
    )
    .map((d) => d.name)
    .sort()
}

export function readProfile(name: string): ProfileData {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new ProviderError('profile', 'readProfile', 422, { name, error: 'Invalid profile name' })
  }

  const dir = join(PROFILES_DIR, name)
  const profilePath = join(dir, 'profile.md')
  const socialPath = join(dir, 'social.md')

  let profileContent: string
  try {
    profileContent = readFileSync(profilePath, 'utf-8')
  } catch {
    throw new ProviderError('profile', 'readProfile', 404, { name })
  }

  let socialContent: string
  try {
    socialContent = readFileSync(socialPath, 'utf-8')
  } catch {
    throw new ProviderError('profile', 'readProfile', 422, {
      name,
      error: 'Missing social.md',
    })
  }

  // Validate required sections
  const errors = [
    ...validateSections(profileContent, REQUIRED_PROFILE_SECTIONS, 'profile.md'),
    ...validateSections(socialContent, REQUIRED_SOCIAL_SECTIONS, 'social.md'),
  ]

  if (errors.length > 0) {
    throw new ProviderError('profile', 'readProfile', 422, { name, errors })
  }

  return {
    name,
    profileContent,
    socialContent,
    quickRef: parseQuickRef(profileContent),
  }
}

export function getHealthScore(name: string): number {
  const profile = readProfile(name)
  return computeHealthScore(profile.profileContent, profile.socialContent, name)
}

export function validateProfiles(): ProfileReport {
  const profiles = listProfiles()
  const results: ProfileReport['profiles'] = []
  let allValid = true

  for (const name of profiles) {
    const errors: string[] = []
    let healthScore = 0

    try {
      const profile = readProfile(name)
      healthScore = computeHealthScore(profile.profileContent, profile.socialContent, name)
    } catch (err) {
      allValid = false
      if (err instanceof ProviderError) {
        const raw = err.rawResponse as { errors?: string[]; error?: string }
        if (raw.errors) {
          errors.push(...raw.errors)
        } else if (raw.error) {
          errors.push(raw.error)
        } else {
          errors.push(err.message)
        }
      } else {
        errors.push(String(err))
      }
    }

    results.push({ name, healthScore, errors })
  }

  return { valid: allValid, profiles: results }
}
