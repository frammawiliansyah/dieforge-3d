import * as THREE from 'three'
import type { ProductViewerConfig } from './types'
import type { ProductViewer } from './viewer'

/** Scale camera distance so longer / thicker parts stay framed in the viewport. */
export function fitViewerToProduct(
  viewer: ProductViewer,
  product: THREE.Group,
  cfg: ProductViewerConfig,
) {
  const box = new THREE.Box3().setFromObject(product)
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 0.001)
  const refDim = cfg.fitRefDim ?? 1.2
  const scaleMax = cfg.fitScaleMax ?? 3.2
  const scale = THREE.MathUtils.clamp(maxDim / refDim, 0.6, scaleMax)
  const pos = cfg.position ?? [0.2, 0.85, 2.3]
  viewer.camera.position.set(pos[0] * scale, pos[1] * scale, pos[2] * scale)
  viewer.controls.minDistance = (cfg.minDistance ?? 1.7) * scale * 0.85
  viewer.controls.maxDistance = (cfg.maxDistance ?? 6) * scale * 1.25
  viewer.controls.target.set(0, 0, 0)
  applyInitialView(viewer, cfg)
  viewer.controls.update()
}

/** Orbit camera to preview angle while preserving fit distance. */
function applyInitialView(viewer: ProductViewer, cfg: ProductViewerConfig) {
  const view = cfg.initialView
  if (!view) return

  const target = viewer.controls.target
  const dist = viewer.camera.position.distanceTo(target)
  const yaw = THREE.MathUtils.degToRad(view.yaw)
  const pitch = THREE.MathUtils.degToRad(view.pitch)
  const cosP = Math.cos(pitch)

  viewer.camera.position.set(
    target.x + dist * Math.sin(yaw) * cosP,
    target.y + dist * Math.sin(pitch),
    target.z + dist * Math.cos(yaw) * cosP,
  )
}
