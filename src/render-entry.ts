/**
 * Offline render route (served at /render.html).
 *
 * Image:  /render.html?slug=<slug>&view=<view>&size=1024
 * GLB:    /render.html?slug=<slug>&export=glb
 * List:   /render.html?list=1            → exposes window.__CATALOG__ for the batch script
 *
 * Deterministic: white background, frozen lighting, no motion. Sets
 * window.__renderReady = true once the frame is painted / GLB is encoded.
 */
import * as THREE from 'three'
import { arrayBufferToBase64, exportGLB } from './product-motion/glb'
import { PRODUCT_BY_SLUG, PRODUCT_SLUGS } from './product-motion/registry'
import { createViewer } from './product-motion/viewer'
import { STANDARD_VIEWS, VIEW_IDS, frameProductForView, getView } from './product-motion/views'

declare global {
  interface Window {
    __renderReady?: boolean
    __glbBase64?: string
    __CATALOG__?: { slugs: string[]; views: string[] }
  }
}

const params = new URLSearchParams(location.search)
window.__CATALOG__ = { slugs: PRODUCT_SLUGS, views: VIEW_IDS }

function buildRoot(slug: string) {
  const def = PRODUCT_BY_SLUG[slug]
  if (!def) throw new Error(`Unknown slug: ${slug}`)
  const assembly = def.build({ catalogLook: true })
  const root = new THREE.Group()
  root.add(assembly.product)
  if (def.orient) root.rotation.set(def.orient[0], def.orient[1], def.orient[2])
  assembly.animate(0, false)
  return { def, root }
}

function markReady() {
  window.__renderReady = true
}

async function main() {
  if (params.get('list') === '1') {
    markReady()
    return
  }

  const slug = params.get('slug') ?? 'dowel-pin-polos'
  const exportMode = params.get('export')

  let built
  try {
    built = buildRoot(slug)
  } catch (e) {
    console.error(e)
    markReady() // unblock the batch script; missing output is detected downstream
    return
  }
  const { def, root } = built

  if (exportMode === 'glb') {
    try {
      const buf = await exportGLB(root)
      window.__glbBase64 = arrayBufferToBase64(buf)
    } catch (e) {
      console.error('GLB export failed', e)
    }
    markReady()
    return
  }

  // --- image render ---
  const size = parseInt(params.get('size') ?? '1024', 10)
  const stage = document.getElementById('stage') as HTMLDivElement
  stage.style.width = `${size}px`
  stage.style.height = `${size}px`
  stage.style.background = '#ffffff'

  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'display:block;width:100%;height:100%'
  stage.appendChild(canvas)

  const viewer = createViewer({
    canvas,
    wrap: stage,
    camera: { fov: 32 },
    renderMode: true,
    pixelRatio: 1,
  })

  viewer.setProduct(root)

  const view = getView(params.get('view') ?? 'front') ?? STANDARD_VIEWS[0]
  frameProductForView(viewer, root, view, { margin: def.viewMargin ?? 1.2 })

  // Paint a few settle frames so AA / env reflections are stable, then flag ready.
  let n = 0
  const tick = () => {
    viewer.renderOnce()
    if (++n > 6) {
      markReady()
      return
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

void main()
