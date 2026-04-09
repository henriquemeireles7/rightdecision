import {
  BlogPostFrontmatter,
  ChangelogFrontmatter,
  GuideFrontmatter,
  HandbookFrontmatter,
  HelpFrontmatter,
  MethodFrontmatter,
} from '@/providers/markdown'
import { BlogIndex } from './blog-index'
import { HandbookIndex } from './handbook-index'
import type { ContentTypeConfig } from './types'

export const handbookConfig: ContentTypeConfig = {
  contentType: 'handbook',
  contentDir: 'content/handbook',
  sortBy: 'order',
  nested: true,
  showOnThisPage: true,
  showRelated: true,
  showViewSource: true,
  tabLabel: 'Handbook',
  frontmatterSchema: HandbookFrontmatter,
  indexTitle: 'Handbook',
  indexDescription:
    'How we run The Right Decision as a company operating system. Principles, workflows, and AI harness.',
  renderCustomIndex: (items) => <HandbookIndex items={items} />,
}

export const blogConfig: ContentTypeConfig = {
  contentType: 'blog',
  contentDir: 'content/blog',
  sortBy: 'date',
  nested: false,
  showOnThisPage: false,
  showRelated: true,
  showViewSource: false,
  tabLabel: 'Blog',
  frontmatterSchema: BlogPostFrontmatter,
  indexTitle: 'Blog',
  indexDescription:
    'Essays on decision-making, getting unstuck, and why self-help keeps you stuck.',
  renderCustomIndex: (items) => <BlogIndex items={items} />,
}

export const methodConfig: ContentTypeConfig = {
  contentType: 'method',
  contentDir: 'content/method',
  sortBy: 'alpha',
  nested: false,
  showOnThisPage: true,
  showRelated: true,
  showViewSource: false,
  tabLabel: 'Method',
  frontmatterSchema: MethodFrontmatter,
  indexTitle: 'Method',
  indexDescription:
    'Key decision-making concepts explained with practical steps. Analysis paralysis, decision fatigue, and more.',
}

export const guidesConfig: ContentTypeConfig = {
  contentType: 'guides',
  contentDir: 'content/guides',
  sortBy: 'order',
  nested: false,
  showOnThisPage: true,
  showRelated: true,
  showViewSource: false,
  tabLabel: 'Guides',
  frontmatterSchema: GuideFrontmatter,
  indexTitle: 'Guides',
  indexDescription: 'Practical guides for making better decisions in life and business.',
}

export const helpConfig: ContentTypeConfig = {
  contentType: 'help',
  contentDir: 'content/help',
  sortBy: 'order',
  nested: true,
  showOnThisPage: true,
  showRelated: false,
  showViewSource: false,
  tabLabel: 'Help',
  frontmatterSchema: HelpFrontmatter,
  indexTitle: 'Help Center',
  indexDescription:
    'Get help with The Right Decision platform. Account setup, billing, and troubleshooting.',
}

export const changelogConfig: ContentTypeConfig = {
  contentType: 'changelog',
  contentDir: 'content/changelog',
  sortBy: 'date',
  nested: false,
  showOnThisPage: false,
  showRelated: false,
  showViewSource: false,
  tabLabel: 'Changelog',
  frontmatterSchema: ChangelogFrontmatter,
  indexTitle: 'Changelog',
  indexDescription: "What's new at The Right Decision. Features, fixes, and improvements.",
}
