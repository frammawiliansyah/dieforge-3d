/**
 * Interactive 3D product viewer (white studio background).
 *
 *   <Product3DViewer slug="dowel-pin-polos" />
 *
 * Drag to orbit. Geometry + materials are the exact same source as the rendered
 * 5-view WebP images and the exported GLB, so the live model stays consistent
 * with the stills.
 *
 * The WebGL context is created lazily when the viewer scrolls into view and torn
 * down when it leaves, so a page can list many products without exhausting the
 * browser's WebGL context limit. On a real product detail page you'd typically
 * mount just one.
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { PRODUCT_BY_SLUG } from '@/product-motion/registry'
import { createViewer, type ProductViewer } from '@/product-motion/viewer'
import { STANDARD_VIEWS, frameProductForView, getView } from '@/product-motion/views'

export interface Product3DViewerProps {
  slug: string
  className?: string
  /** Turntable auto-rotate when idle (default true). */
  autoRotate?: boolean
  /** Mechanism animation, e.g. poppet dips / ball depresses (default false). */
  motion?: boolean
}

export function Product3DViewer({
  slug,
  className,
  autoRotate = true,
  motion = false,
}: Product3DViewerProps) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const def = PRODUCT_BY_SLUG[slug]
    if (!def) return

    let viewer: ProductViewer | null = null
    let canvas: HTMLCanvasElement | null = null

    const mount = () => {
      if (viewer) return
      canvas = document.createElement('canvas')
      canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none'
      wrap.appendChild(canvas)

      viewer = createViewer({ canvas, wrap, camera: { fov: 32 }, catalogLook: true })
      const assembly = def.build({ catalogLook: true })
      const root = new THREE.Group()
      root.add(assembly.product)
      if (def.orient) root.rotation.set(def.orient[0], def.orient[1], def.orient[2])
      viewer.setProduct(root)
      frameProductForView(viewer, root, getView('hero-right') ?? STANDARD_VIEWS[0], {
        margin: (def.viewMargin ?? 1.12) * 1.05,
      })
      viewer.setAutoRotate(autoRotate)
      viewer.state.motion = motion
      viewer.onFrame((t, _dt, ctx) => assembly.animate(t, ctx.state.motion))
      viewer.start()
    }

    const unmount = () => {
      viewer?.stop()
      viewer = null
      canvas?.remove()
      canvas = null
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.isIntersecting ? mount() : unmount()
      },
      { rootMargin: '150px' },
    )
    io.observe(wrap)

    const ro = new ResizeObserver(() => viewer?.resize())
    ro.observe(wrap)

    return () => {
      io.disconnect()
      ro.disconnect()
      unmount()
    }
  }, [slug, autoRotate, motion])

  return (
    <div
      ref={wrapRef}
      className={className}
      role="img"
      aria-label={`${PRODUCT_BY_SLUG[slug]?.label ?? slug} 3D — seret untuk memutar`}
      style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#ffffff' }}
    />
  )
}
