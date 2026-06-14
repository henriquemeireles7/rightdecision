/**
 * Client bundle build — Bun.build, target browser, content-hashed filenames.
 * Every client/<entry>/index.tsx becomes public/build/<entry>-<hash>.js, recorded in
 * public/build/manifest.json (consumed by the /app shell SSR route in P3).
 *
 * Usage:
 *   bun platform/scripts/build-client.ts            # one-shot build (bun run build:client)
 *   bun platform/scripts/build-client.ts --watch    # rebuild on client/ changes (bun run client:dev)
 */
import { existsSync, mkdirSync, readdirSync, rmSync, watch } from 'node:fs'
import { basename, join } from 'node:path'

const ROOT = import.meta.dir.replace('/platform/scripts', '')
const CLIENT_DIR = join(ROOT, 'client')
const OUT_DIR = join(ROOT, 'public', 'build')

function findEntrypoints(): Array<{ name: string; path: string }> {
  if (!existsSync(CLIENT_DIR)) return []
  return readdirSync(CLIENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ name: entry.name, path: join(CLIENT_DIR, entry.name, 'index.tsx') }))
    .filter((entry) => existsSync(entry.path))
}

export async function buildClient(): Promise<Record<string, string>> {
  rmSync(OUT_DIR, { recursive: true, force: true })
  mkdirSync(OUT_DIR, { recursive: true })

  const manifest: Record<string, string> = {}

  for (const entry of findEntrypoints()) {
    const result = await Bun.build({
      entrypoints: [entry.path],
      target: 'browser',
      outdir: OUT_DIR,
      naming: `${entry.name}-[hash].[ext]`,
      minify: true,
      sourcemap: 'none',
    })
    if (!result.success) {
      throw new Error(
        `Client build failed for '${entry.name}':\n${result.logs.map((log) => log.message).join('\n')}`,
      )
    }
    const output = result.outputs.find((artifact) => artifact.kind === 'entry-point')
    if (!output) throw new Error(`Client build for '${entry.name}' produced no entry-point output`)
    manifest[entry.name] = `/build/${basename(output.path)}`
  }

  await Bun.write(join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  return manifest
}

async function runOnce() {
  const manifest = await buildClient()
  console.log(`Client build complete: ${JSON.stringify(manifest)}`)
}

if (import.meta.main) {
  if (Bun.argv.includes('--watch')) {
    let building = false
    let queued = false
    const rebuild = async () => {
      if (building) {
        queued = true
        return
      }
      building = true
      try {
        await runOnce()
      } catch (err) {
        console.error(err) // keep watching — dev mode tolerates broken intermediate states
      }
      building = false
      if (queued) {
        queued = false
        await rebuild()
      }
    }
    await rebuild()
    watch(CLIENT_DIR, { recursive: true }, () => {
      void rebuild()
    })
    console.log(`Watching ${CLIENT_DIR} for changes...`)
  } else {
    runOnce()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err)
        process.exit(1)
      })
  }
}
