import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'

const MAX_CACHE_SIZE = 500
const imageCache = new Map<string, Buffer>()

function cacheSet(key: string, value: Buffer) {
  if (imageCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry (first inserted)
    const firstKey = imageCache.keys().next().value
    if (firstKey) imageCache.delete(firstKey)
  }
  imageCache.set(key, value)
}

function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 500)
}

async function loadFont(): Promise<ArrayBuffer> {
  const res = await fetch(
    'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap',
    { signal: AbortSignal.timeout(10000) },
  )
  const css = await res.text()
  const fontUrl = css.match(/url\(([^)]+)\)/)?.[1]
  if (!fontUrl) throw new Error('Could not extract font URL')
  const fontRes = await fetch(fontUrl, { signal: AbortSignal.timeout(10000) })
  return fontRes.arrayBuffer()
}

let fontData: ArrayBuffer | null = null

async function getFont(): Promise<ArrayBuffer> {
  if (!fontData) {
    fontData = await loadFont()
  }
  return fontData
}

export async function generateDecisionCard(decisionText: string): Promise<Buffer> {
  const cacheKey = `decision:${decisionText}`
  const cached = imageCache.get(cacheKey)
  if (cached) return cached

  const font = await getFont()
  const sanitized = sanitizeText(decisionText)

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FAF8F5',
          padding: '60px',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                borderLeft: '4px solid #C4956A',
                paddingLeft: '32px',
                maxWidth: '900px',
              },
              children: {
                type: 'p',
                props: {
                  style: {
                    fontFamily: 'Instrument Serif',
                    fontStyle: 'italic',
                    fontSize: '42px',
                    lineHeight: 1.4,
                    color: '#1A1714',
                    margin: 0,
                  },
                  children: sanitized,
                },
              },
            },
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '40px',
                right: '60px',
                fontFamily: 'Instrument Serif',
                fontSize: '24px',
                color: '#A69D91',
              },
              children: 'The Right Decision',
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Instrument Serif',
          data: font,
          weight: 400,
          style: 'italic',
        },
      ],
    },
  )

  try {
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
    const pngData = resvg.render()
    const png = Buffer.from(pngData.asPng())
    cacheSet(cacheKey, png)
    return png
  } catch {
    // SVG fallback if resvg has Bun issues
    const svgBuffer = Buffer.from(svg)
    cacheSet(cacheKey, svgBuffer)
    return svgBuffer
  }
}
