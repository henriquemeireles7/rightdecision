/// <reference lib="dom" />
/**
 * Materials library — the member's program materials with signed-URL downloads
 * (the URL is fetched per click; fileKeys never reach the client).
 */
import { useState } from 'preact/hooks'
import { EmptyState, ErrorState, Skeleton } from '../components/states'
import { fetchMaterialDownloadUrl, fetchMaterials, type MaterialItem } from '../lib/data'
import { formatBytes } from '../lib/format'
import { useQuery } from '../lib/use-query'
import { Link } from '../router'

type MaterialsPageProps = {
  /** Injection for TESTS ONLY — production opens the signed URL in a new tab. */
  openUrl?: (url: string) => void
}

function MaterialRow({
  material,
  openUrl,
}: {
  material: MaterialItem
  openUrl: (url: string) => void
}) {
  const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle')

  const handleDownload = async () => {
    setStatus('busy')
    try {
      const { url } = await fetchMaterialDownloadUrl(material.id)
      openUrl(url)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <li class="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-linen bg-surface-white p-5">
      <div class="min-w-0">
        <h2 class="font-display text-xl text-ink">{material.title}</h2>
        {material.description ? <p class="mt-1 text-body">{material.description}</p> : null}
        <p class="mt-1 text-sm text-muted">{formatBytes(material.fileSizeBytes)}</p>
        {status === 'error' ? (
          <p role="alert" class="mt-2 text-sm text-error">
            The download link couldn't be created — links expire quickly, so just try again.
          </p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={status === 'busy'}
        onClick={handleDownload}
        class="min-h-11 shrink-0 rounded-sm bg-gold px-5 py-2 font-medium text-ink motion-safe:transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'busy' ? 'Preparing…' : 'Download'}
      </button>
    </li>
  )
}

function MaterialsSkeleton() {
  return (
    <div class="space-y-4" role="presentation">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} class="h-28 w-full" />
      ))}
    </div>
  )
}

const defaultOpenUrl = (url: string) => window.open(url, '_blank', 'noopener')

export function MaterialsPage({ openUrl = defaultOpenUrl }: MaterialsPageProps) {
  const { state, retry } = useQuery(fetchMaterials, [])

  return (
    <div class="mx-auto max-w-[800px] px-4 py-8">
      <h1 class="font-display text-3xl text-ink">Materials</h1>
      <div class="mt-6">
        {state.status === 'loading' ? (
          <MaterialsSkeleton />
        ) : state.status === 'error' ? (
          <ErrorState what="We couldn't load your materials" error={state.error} onRetry={retry} />
        ) : state.data.materials.length === 0 ? (
          <EmptyState
            title="Nothing to download yet"
            body="Workbooks and other materials will land here as your program releases them."
            action={
              <Link href="/app" class="font-medium text-gold-hover underline underline-offset-2">
                Back to your library
              </Link>
            }
          />
        ) : (
          <ul class="space-y-4">
            {state.data.materials.map((material) => (
              <MaterialRow key={material.id} material={material} openUrl={openUrl} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
