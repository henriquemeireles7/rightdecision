import type { ComponentChildren } from 'preact'
import type { z } from 'zod'
import type { ParsedContentItem } from '@/providers/markdown'

export type ContentType = 'handbook' | 'blog' | 'method' | 'guides' | 'help' | 'changelog'

export type SortStrategy = 'date' | 'order' | 'alpha'

export type ContentTypeConfig = {
  contentType: ContentType
  contentDir: string
  sortBy: SortStrategy
  nested: boolean
  showOnThisPage: boolean
  showRelated: boolean
  showViewSource: boolean
  tabLabel: string
  frontmatterSchema: z.ZodSchema
  indexTitle: string
  indexDescription: string
  renderCustomIndex?: (items: ParsedContentItem[]) => ComponentChildren
}

export type SidebarSection = {
  title: string
  items: SidebarItem[]
}

export type SidebarItem = {
  title: string
  slug: string
  href: string
  active: boolean
  subtitle?: string
}

export const CONTENT_TABS: { type: ContentType; label: string; href: string }[] = [
  { type: 'handbook', label: 'Handbook', href: '/handbook' },
  { type: 'blog', label: 'Blog', href: '/blog' },
  { type: 'method', label: 'Method', href: '/method' },
  { type: 'guides', label: 'Guides', href: '/guides' },
  { type: 'help', label: 'Help', href: '/help' },
  { type: 'changelog', label: 'Changelog', href: '/changelog' },
]
