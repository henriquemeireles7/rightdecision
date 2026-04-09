import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'

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
  if (!fontData) fontData = await loadFont()
  return fontData
}

/**
 * Generate a branded "Decision Document" card as PNG.
 * Shows constraint + decision + first action step on a warm cream card
 * with gold accent and The Right Decision branding.
 */
export async function generateDecisionDocument(
  constraint: string,
  decision: string,
  date: string,
): Promise<Buffer> {
  const font = await getFont()

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FAF8F5',
          padding: '64px',
          gap: '32px',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                fontFamily: 'Instrument Serif',
                fontSize: '20px',
                color: '#C4956A',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              },
              children: 'Your Decision Document',
            },
          },
          {
            type: 'div',
            props: {
              style: {
                borderLeft: '3px solid #C4956A',
                paddingLeft: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    children: [
                      {
                        type: 'p',
                        props: {
                          style: {
                            fontFamily: 'Instrument Serif',
                            fontSize: '16px',
                            color: '#A69D91',
                            margin: '0 0 8px 0',
                          },
                          children: 'My constraint',
                        },
                      },
                      {
                        type: 'p',
                        props: {
                          style: {
                            fontFamily: 'Instrument Serif',
                            fontStyle: 'italic',
                            fontSize: '28px',
                            lineHeight: 1.4,
                            color: '#1A1714',
                            margin: 0,
                          },
                          children: sanitizeText(constraint),
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    children: [
                      {
                        type: 'p',
                        props: {
                          style: {
                            fontFamily: 'Instrument Serif',
                            fontSize: '16px',
                            color: '#A69D91',
                            margin: '0 0 8px 0',
                          },
                          children: 'My decision',
                        },
                      },
                      {
                        type: 'p',
                        props: {
                          style: {
                            fontFamily: 'Instrument Serif',
                            fontStyle: 'italic',
                            fontSize: '28px',
                            lineHeight: 1.4,
                            color: '#1A1714',
                            margin: 0,
                          },
                          children: sanitizeText(decision),
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: 'auto',
              },
              children: [
                {
                  type: 'p',
                  props: {
                    style: {
                      fontFamily: 'Instrument Serif',
                      fontSize: '16px',
                      color: '#A69D91',
                    },
                    children: date,
                  },
                },
                {
                  type: 'p',
                  props: {
                    style: {
                      fontFamily: 'Instrument Serif',
                      fontSize: '20px',
                      color: '#C4956A',
                    },
                    children: 'The Right Decision',
                  },
                },
              ],
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
    return Buffer.from(pngData.asPng())
  } catch {
    return Buffer.from(svg)
  }
}
