import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'

// Load font at module level (once, not per-request)
// Satori requires TTF/OTF (not woff2) for font rendering
// Uses process.cwd() instead of import.meta.dir because after bundling to dist/,
// the relative path from import.meta.dir resolves incorrectly in production
const fontBuffer = readFileSync(join(process.cwd(), 'public/fonts/InstrumentSerif-Regular.ttf'))

export async function generateOgImage(title: string): Promise<Buffer> {
  // Truncate long titles
  const displayTitle = title.length > 100 ? `${title.slice(0, 97)}...` : title

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FAF8F5',
          fontFamily: 'Instrument Serif',
        },
        children: [
          // Main content area
          {
            type: 'div',
            props: {
              style: {
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 80px',
              },
              children: {
                type: 'div',
                props: {
                  style: {
                    fontSize: displayTitle.length > 60 ? '48px' : '56px',
                    color: '#1A1714',
                    lineHeight: 1.3,
                    textAlign: 'center',
                    maxWidth: '1040px',
                  },
                  children: displayTitle,
                },
              },
            },
          },
          // Gold footer bar
          {
            type: 'div',
            props: {
              style: {
                height: '60px',
                backgroundColor: '#C4956A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
              children: {
                type: 'div',
                props: {
                  style: {
                    color: '#FFFFFF',
                    fontSize: '20px',
                  },
                  children: 'The Right Decision',
                },
              },
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
          data: fontBuffer,
          weight: 400,
          style: 'normal',
        },
      ],
    },
  )

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  })
  return Buffer.from(resvg.render().asPng())
}
