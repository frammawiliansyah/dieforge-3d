import type * as THREE from 'three'

export interface ProductAssembly {
  product: THREE.Group
  animate: (t: number, motion: boolean) => void
}

export interface ProductViewerConfig {
  fov?: number
  position?: [number, number, number]
  minDistance?: number
  maxDistance?: number
  minPolar?: number
  maxPolar?: number
  /** Smaller value pulls camera back (model appears smaller in frame). Default 1.2 */
  fitRefDim?: number
  /** Upper bound for auto-fit zoom-out (tall slender parts). Default 3.2 */
  fitScaleMax?: number
  /** Initial orbit angle in degrees. */
  initialView?: { yaw: number; pitch: number }
}

export interface MotionBuildParams {
  /** Catalog variant size, e.g. "8X45" */
  variantSize?: string | null
  /** Brighter polished steel tuned to match catalog photo thumbnails */
  catalogLook?: boolean
}

export interface ProductMotionViewerOptions {
  /** Enable drag orbit (default true) */
  interactive?: boolean
  /** Auto-rotate when idle (default true) */
  autoRotate?: boolean
  /** Mechanism animation (default true) */
  motion?: boolean
}
