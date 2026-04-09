import type { ParsedContentItem } from '@/providers/markdown'

type DocsMetadataProps = {
  readTime: number
  lastUpdated?: string
  showViewSource: boolean
  sourceUrl?: string
}

function DocsMetadata({ readTime, lastUpdated, showViewSource, sourceUrl }: DocsMetadataProps) {
  return (
    <div class="flex items-center gap-sm text-sm text-muted mb-lg">
      {lastUpdated && <span>Updated {lastUpdated}</span>}
      {lastUpdated && <span>·</span>}
      <span>{readTime} min read</span>
      {showViewSource && sourceUrl && (
        <>
          <span>·</span>
          <a
            href={sourceUrl}
            class="text-muted hover:text-ink no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View source
          </a>
        </>
      )}
    </div>
  )
}

type DocsPrevNextProps = {
  prev?: { title: string; href: string }
  next?: { title: string; href: string }
}

function DocsPrevNext({ prev, next }: DocsPrevNextProps) {
  if (!prev && !next) return null

  return (
    <nav
      aria-label="Page navigation"
      class="flex justify-between mt-2xl pt-lg border-t border-linen"
    >
      {prev ? (
        <a href={prev.href} class="text-gold no-underline hover:underline text-sm">
          ← {prev.title}
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a href={next.href} class="text-gold no-underline hover:underline text-sm">
          {next.title} →
        </a>
      ) : (
        <span />
      )}
    </nav>
  )
}

function DocsRelated({ items, contentType }: { items: ParsedContentItem[]; contentType: string }) {
  if (items.length === 0) return null

  return (
    <div class="mt-2xl pt-lg border-t border-linen">
      <p class="text-sm font-semibold text-muted uppercase tracking-wider mb-sm">Related</p>
      <ul class="list-none p-0 m-0 space-y-xs">
        {items.map((item) => (
          <li key={item.slug}>
            <a
              href={`/${contentType}/${item.slug}`}
              class="text-sm text-gold no-underline hover:underline"
            >
              {item.frontmatter.title as string}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

type DocsContentProps = {
  title: string
  html: string
  readTime: number
  lastUpdated?: string
  showViewSource: boolean
  sourceUrl?: string
  prev?: { title: string; href: string }
  next?: { title: string; href: string }
  related?: ParsedContentItem[]
  contentType: string
}

export function DocsContent({
  title,
  html,
  readTime,
  lastUpdated,
  showViewSource,
  sourceUrl,
  prev,
  next,
  related,
  contentType,
}: DocsContentProps) {
  return (
    <article>
      <h1 class="font-display text-3xl text-ink mb-sm">{title}</h1>
      <DocsMetadata
        readTime={readTime}
        lastUpdated={lastUpdated}
        showViewSource={showViewSource}
        sourceUrl={sourceUrl}
      />
      <div
        class="prose prose-warm"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: content sanitized via DOMPurify in markdown provider
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {related && related.length > 0 && <DocsRelated items={related} contentType={contentType} />}
      <div class="mt-xl flex items-center justify-between">
        <div data-page-feedback data-content-type={contentType} />
        <button
          type="button"
          data-share-button
          class="text-sm text-muted hover:text-ink cursor-pointer border border-linen rounded px-sm py-xs bg-transparent"
        >
          Share
        </button>
      </div>
      <DocsPrevNext prev={prev} next={next} />
    </article>
  )
}
