#!/usr/bin/env node
/**
 * Batch-render the 5 curated views for every product to WebP (1024×1024, white bg).
 * Spins up its own Vite server, so no separate `npm run dev` is needed.
 *
 *   node scripts/render-images.mjs            # all products
 *   node scripts/render-images.mjs baut-l     # single product
 *
 * Output: public/assets/<slug>/<view>.webp
 */
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import sharp from 'sharp'
import { createServer } from 'vite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SIZE = 1024
const QUALITY = 92
const arg = process.argv[2]
const only = arg && arg !== 'all' ? arg : null

const server = await createServer({ root, server: { port: 5179, strictPort: false } })
await server.listen()
const base = server.resolvedUrls?.local?.[0]?.replace(/\/$/, '') ?? 'http://localhost:5179'
console.log(`▶ Vite serving at ${base}`)

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})
const page = await browser.newPage({
  viewport: { width: SIZE + 80, height: SIZE + 80 },
  deviceScaleFactor: 1,
})

await page.goto(`${base}/render.html?list=1`, { waitUntil: 'load' })
await page.waitForFunction(() => window.__renderReady === true, undefined, { timeout: 30000 })
const { slugs, views } = await page.evaluate(() => window.__CATALOG__)
const targets = only ? [only] : slugs

let count = 0
try {
  for (const slug of targets) {
    const outDir = join(root, 'public/assets', slug)
    mkdirSync(outDir, { recursive: true })
    for (const view of views) {
      const url = `${base}/render.html?slug=${encodeURIComponent(slug)}&view=${view}&size=${SIZE}`
      await page.goto(url, { waitUntil: 'load' })
      await page.waitForFunction(() => window.__renderReady === true, undefined, { timeout: 30000 })
      const png = await page.locator('#stage').screenshot({ type: 'png' })
      await sharp(png)
        .resize(SIZE, SIZE, { fit: 'cover' })
        .webp({ quality: QUALITY })
        .toFile(join(outDir, `${view}.webp`))
      count++
      console.log(`  ✓ ${slug}/${view}.webp`)
    }
  }
} finally {
  await browser.close()
  await server.close()
}
console.log(`✅ Rendered ${count} images → public/assets/`)
