#!/usr/bin/env node
/**
 * Batch-export one portable .glb per product (geometry + PBR materials + baked
 * bump textures). Spins up its own Vite server.
 *
 *   node scripts/export-glb.mjs            # all products
 *   node scripts/export-glb.mjs baut-l     # single product
 *
 * Output: public/assets/<slug>/model.glb
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const arg = process.argv[2]
const only = arg && arg !== 'all' ? arg : null

const server = await createServer({ root, server: { port: 5180, strictPort: false } })
await server.listen()
const base = server.resolvedUrls?.local?.[0]?.replace(/\/$/, '') ?? 'http://localhost:5180'
console.log(`▶ Vite serving at ${base}`)

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})
const page = await browser.newPage()

await page.goto(`${base}/render.html?list=1`, { waitUntil: 'load' })
await page.waitForFunction(() => window.__renderReady === true, undefined, { timeout: 30000 })
const { slugs } = await page.evaluate(() => window.__CATALOG__)
const targets = only ? [only] : slugs

let count = 0
try {
  for (const slug of targets) {
    const outDir = join(root, 'public/assets', slug)
    mkdirSync(outDir, { recursive: true })
    const url = `${base}/render.html?slug=${encodeURIComponent(slug)}&export=glb`
    await page.goto(url, { waitUntil: 'load' })
    await page.waitForFunction(() => window.__renderReady === true, undefined, { timeout: 60000 })
    const b64 = await page.evaluate(() => window.__glbBase64)
    if (!b64) {
      console.warn(`  ⚠ ${slug}: no GLB produced`)
      continue
    }
    writeFileSync(join(outDir, 'model.glb'), Buffer.from(b64, 'base64'))
    count++
    console.log(`  ✓ ${slug}/model.glb`)
  }
} finally {
  await browser.close()
  await server.close()
}
console.log(`✅ Exported ${count} GLB models → public/assets/`)
