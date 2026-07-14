#!/usr/bin/env node
/**
 * Convenience: render all WebP views, then export all GLB models.
 *
 *   node scripts/build-assets.mjs            # everything
 *   node scripts/build-assets.mjs baut-l     # single product (images + glb)
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const target = process.argv[2] ?? 'all'

for (const script of ['render-images.mjs', 'export-glb.mjs']) {
  const res = spawnSync('node', [join(root, 'scripts', script), target], { stdio: 'inherit' })
  if (res.status !== 0) process.exit(res.status ?? 1)
}
