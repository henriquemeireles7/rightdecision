/// <reference lib="dom" />
/**
 * The ink (#1A1714) player canvas — a full-bleed palette-token region around the
 * video inside the cream app, NOT dark mode (ADR 19). Native <video controls> +
 * poster for v1; hls.js lazy-loads ONLY here and ONLY without native HLS (Safari
 * plays the manifest directly). Captions toggle is a keyboard-operable button
 * driving the <track> mode. Warm chrome returns below the canvas.
 */
import { useEffect, useRef, useState } from 'preact/hooks'
import { loadHls } from '../lib/hls-loader'

type PlayerCanvasProps = {
  src: string
  poster?: string
  captionsSrc?: string | null
  /** Fires once at video end (or a seek-to-end) — unlocks the decision prompt. */
  onEnded?: () => void
  onTimeUpdate?: (currentTimeSeconds: number) => void
  /** Injection for TESTS ONLY — production uses the manifest-driven loader. */
  loadHlsImpl?: typeof loadHls
}

const NATIVE_HLS_TYPE = 'application/vnd.apple.mpegurl'

export function PlayerCanvas({
  src,
  poster,
  captionsSrc,
  onEnded,
  onTimeUpdate,
  loadHlsImpl,
}: PlayerCanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const endedFired = useRef(false)
  const [captionsOn, setCaptionsOn] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let hls: { destroy: () => void } | null = null
    let disposed = false

    const attach = async () => {
      if (video.canPlayType?.(NATIVE_HLS_TYPE)) {
        video.src = src // Safari — native HLS, zero extra bytes
        return
      }
      const Hls = await (loadHlsImpl ?? loadHls)()
      if (disposed) return
      if (Hls?.isSupported()) {
        const instance = new Hls()
        instance.loadSource(src)
        instance.attachMedia(video)
        hls = instance
      } else {
        video.src = src // last resort — let the browser try
      }
    }
    void attach()

    return () => {
      disposed = true
      hls?.destroy()
    }
  }, [src, loadHlsImpl])

  const fireEnded = () => {
    if (endedFired.current) return
    endedFired.current = true
    onEnded?.()
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    onTimeUpdate?.(video.currentTime)
    // Skip-to-end counts as the end — the prompt must never stay locked at 99%
    if (video.duration > 0 && video.currentTime >= video.duration - 0.5) fireEnded()
  }

  const toggleCaptions = () => {
    const video = videoRef.current
    const next = !captionsOn
    setCaptionsOn(next)
    const track = video?.textTracks?.[0]
    if (track) track.mode = next ? 'showing' : 'hidden'
  }

  return (
    <div class="w-full bg-ink">
      <div class="mx-auto max-w-[1000px] px-0 py-0 md:px-6 md:py-6">
        {/* biome-ignore lint/a11y/useMediaCaption: the caption track renders conditionally below */}
        <video
          ref={videoRef}
          controls
          playsInline
          preload="metadata"
          poster={poster}
          crossorigin="anonymous"
          onEnded={fireEnded}
          onTimeUpdate={handleTimeUpdate}
          class="aspect-video w-full bg-ink"
        >
          {captionsSrc ? (
            <track kind="captions" srclang="en" label="English" src={captionsSrc} />
          ) : null}
        </video>
        {captionsSrc ? (
          <div class="flex justify-end px-4 py-2 md:px-0">
            <button
              type="button"
              aria-pressed={captionsOn}
              onClick={toggleCaptions}
              class="min-h-11 rounded-sm px-3 py-1.5 text-sm font-medium text-cream motion-safe:transition-colors hover:text-gold"
            >
              {captionsOn ? 'Captions on' : 'Captions off'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** The canvas placeholder for not-yet-ready video — same pinned aspect, zero CLS. */
export function ProcessingCanvas({ message }: { message: string }) {
  return (
    <div class="w-full bg-ink">
      <div class="mx-auto max-w-[1000px] md:px-6 md:py-6">
        <div class="flex aspect-video w-full items-center justify-center px-6 text-center">
          <p class="text-cream">{message}</p>
        </div>
      </div>
    </div>
  )
}
