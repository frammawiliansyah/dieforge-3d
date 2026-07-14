/**
 * The 5 curated product views.
 *
 * Most parts here are bodies of revolution (pins, springs, bushes, plugs), so
 * strict orthographic front/back/left/right would be visually identical. Instead
 * we use 5 curated camera angles that orbit the part — a near-front elevation,
 * two 3/4 hero angles, a low angle, and a top/axial view that reveals the end
 * face (bore / hex socket). Framing is bounding-sphere based so every product
 * is centred and sized consistently regardless of its real dimensions.
 */
import * as THREE from 'three'
import type { ProductViewer } from './viewer'

export interface ViewAngle {
  id: string
  label: string
  /** Orbit azimuth in degrees (0 = front / +Z). */
  yaw: number
  /** Orbit elevation in degrees (positive = above). */
  pitch: number
  /** Optional per-view zoom multiplier (>1 pulls camera back). */
  distanceScale?: number
}

export const STANDARD_VIEWS: ViewAngle[] = [
  { id: 'front', label: 'Tampak Depan', yaw: 0, pitch: 7 },
  { id: 'hero-left', label: '3/4 Kiri', yaw: -33, pitch: 15 },
  { id: 'hero-right', label: '3/4 Kanan', yaw: 33, pitch: 15 },
  { id: 'axial', label: 'Tampak Ujung', yaw: 86, pitch: 8 },
  { id: 'low', label: 'Sudut Bawah', yaw: 20, pitch: -12 },
]

export const VIEW_IDS = STANDARD_VIEWS.map((v) => v.id)

export function getView(id: string): ViewAngle | undefined {
  return STANDARD_VIEWS.find((v) => v.id === id)
}

export interface FrameOptions {
  /** Padding factor around the bounding sphere (1 = tight). */
  margin?: number
  /** Per-product view override (merged onto the standard angle). */
  override?: Partial<ViewAngle>
}

/**
 * Position the camera for a given view by fitting the product's *projected*
 * bounding box (the silhouette as seen from that angle). Unlike a bounding-sphere
 * fit, this makes every view fill the frame by the same amount — so an end-on
 * axial view of a long pin reads at a comfortable size instead of tiny — while
 * lighting, background and material stay identical across all views.
 */
export function frameProductForView(
  viewer: ProductViewer,
  product: THREE.Object3D,
  view: ViewAngle,
  opts: FrameOptions = {},
) {
  const v = { ...view, ...opts.override }
  // margin is a padding factor: 1.12 ≈ 12% empty border around the silhouette.
  const margin = (opts.margin ?? 1.12) * (v.distanceScale ?? 1)

  const box = new THREE.Box3().setFromObject(product)
  const center = box.getCenter(new THREE.Vector3())
  const min = box.min
  const max = box.max
  const corners = [
    new THREE.Vector3(min.x, min.y, min.z),
    new THREE.Vector3(min.x, min.y, max.z),
    new THREE.Vector3(min.x, max.y, min.z),
    new THREE.Vector3(min.x, max.y, max.z),
    new THREE.Vector3(max.x, min.y, min.z),
    new THREE.Vector3(max.x, min.y, max.z),
    new THREE.Vector3(max.x, max.y, min.z),
    new THREE.Vector3(max.x, max.y, max.z),
  ]

  // Camera basis from yaw/pitch (dir points from the target out toward the camera).
  const yaw = THREE.MathUtils.degToRad(v.yaw)
  const pitch = THREE.MathUtils.degToRad(v.pitch)
  const cosP = Math.cos(pitch)
  const dir = new THREE.Vector3(
    Math.sin(yaw) * cosP,
    Math.sin(pitch),
    Math.cos(yaw) * cosP,
  ).normalize()
  const worldUp = new THREE.Vector3(0, 1, 0)
  const right = new THREE.Vector3().crossVectors(worldUp, dir)
  if (right.lengthSq() < 1e-6) right.set(1, 0, 0)
  right.normalize()
  const up = new THREE.Vector3().crossVectors(dir, right).normalize()

  // Project corners onto the camera plane to size the silhouette + depth.
  let halfW = 0
  let halfH = 0
  let halfDepth = 0
  const rel = new THREE.Vector3()
  for (const c of corners) {
    rel.copy(c).sub(center)
    halfW = Math.max(halfW, Math.abs(rel.dot(right)))
    halfH = Math.max(halfH, Math.abs(rel.dot(up)))
    halfDepth = Math.max(halfDepth, Math.abs(rel.dot(dir)))
  }

  const fovV = THREE.MathUtils.degToRad(viewer.camera.fov)
  const tanV = Math.tan(fovV / 2)
  const tanH = tanV // square aspect (1:1)
  const dist = Math.max(halfH / tanV, halfW / tanH) * margin + halfDepth

  viewer.camera.position.copy(center).addScaledVector(dir, dist)
  viewer.camera.near = Math.max(0.01, dist - halfDepth - 0.5)
  viewer.camera.far = dist + halfDepth + 2
  viewer.camera.updateProjectionMatrix()

  // Widen the orbit clamp to this framing distance — long parts need a far camera,
  // and the default maxDistance would otherwise pull it too close (blank/overflow).
  viewer.controls.minDistance = dist * 0.35
  viewer.controls.maxDistance = dist * 3.5

  viewer.controls.target.copy(center)
  viewer.camera.lookAt(center)
  viewer.controls.update()
}
