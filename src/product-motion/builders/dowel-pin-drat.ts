/**
 * Ref: public/product-refs/motion/dowel-pin-drat.jpg
 * DIN 7979 / ISO 8735 — parallel pin with internal extract thread (Type D).
 * Dimensions driven by variant.size (e.g. "8X45" → d1=8 mm, L=45 mm).
 */
import * as THREE from 'three'
import { lookupDin7979 } from '../din7979-dimensions'
import { weldLatheSeam } from '../geometry'
import { createMaterials, createThreadBump, resolvePinInterior, resolvePinSteel } from '../materials'
import { parsePinVariantSize } from '../parse-variant-size'
import type { MotionBuildParams, ProductAssembly } from '../types'

/** Scene scale: 1 unit ≈ 20 mm */
const MM = 0.05

const DEFAULT_D1 = 6
const DEFAULT_L = 24

export function buildDowelPinDratProduct(params?: MotionBuildParams): ProductAssembly {
  const parsed = parsePinVariantSize(params?.variantSize)
  const d1 = parsed?.d1 ?? DEFAULT_D1
  const L = parsed?.L ?? DEFAULT_L
  return buildDowelPinDratForSize(d1, L, params?.catalogLook)
}

function buildDowelPinDratForSize(d1: number, L: number, catalogLook?: boolean): ProductAssembly {
  const din = lookupDin7979(d1)
  const steel = resolvePinSteel(catalogLook, d1 >= 6 ? 0.0038 : 0.0032)
  const interior = resolvePinInterior(catalogLook)
  const { holeMat } = createMaterials()

  const SEG = d1 >= 6 ? 128 : 96
  const r = (d1 / 2) * MM
  const pinLen = L * MM
  const halfL = pinLen / 2

  // Chamfer — capped so thin pins (4–5 mm) keep a visible cylindrical shank
  const cham = Math.min(din.f1 * MM * 0.27, r * 0.28, halfL * 0.18)
  const rEnd = Math.max(r - cham, r * 0.72)

  // Counterbore mouth must stay inside the end face ring
  let rCs = (din.d3 * MM) / 2
  rCs = Math.min(rCs, rEnd * 0.88, r * 0.85)

  // Thread bore — scale with diameter; never consume the whole pin on short lengths
  const rMajor = Math.min(r * (d1 >= 6 ? 0.567 : 0.52), rCs * 0.82)
  const rMinor = rMajor * 0.812

  const maxThreadByLen = pinLen * (d1 >= 6 ? 0.45 : 0.38)
  const threadDepth = Math.min(din.threadDepth * MM, maxThreadByLen, halfL * 0.68)
  const csDepth = Math.min(
    0.44 * MM * (d1 / 6),
    threadDepth * 0.22,
    halfL * 0.1,
    r * 0.35,
  )

  const floorY = halfL - threadDepth
  const mouthY = halfL - csDepth

  const product = new THREE.Group()
  product.name = 'dowel-pin-drat'

  // Face/chamfer/mouth corners doubled for hard ground edges
  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]
  const profile = [
    P(0.0001, -halfL),
    ...hard(rEnd, -halfL),
    ...hard(r, -halfL + cham),
    ...hard(r, halfL - cham),
    ...hard(rEnd, halfL),
    ...hard(rCs, halfL),
    P(rMajor, mouthY),
  ]
  const bodyGeo = new THREE.LatheGeometry(profile, SEG)

  // Air-release flat — subtler on thin pins so the shank stays round-looking
  const flatFactor = d1 >= 6 ? 0.89 : 0.935
  const flatX = flatFactor * r
  const pos = bodyGeo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    if (pos.getX(i) > flatX) pos.setX(i, flatX)
  }
  pos.needsUpdate = true
  bodyGeo.computeVertexNormals()
  weldLatheSeam(bodyGeo, SEG, profile.length)
  product.add(new THREE.Mesh(bodyGeo, steel))

  const span = mouthY - floorY
  if (span > r * 0.15) {
    const threadMat = interior.clone()
    threadMat.color.multiplyScalar(0.78) // darker bore so the teeth read
    threadMat.roughness = Math.min(1, threadMat.roughness + 0.08)
    threadMat.bumpMap = createThreadBump(d1 >= 6 ? 10 : 6)
    threadMat.bumpScale = d1 >= 6 ? 0.03 : 0.018
    const threadPts: THREE.Vector2[] = [new THREE.Vector2(rMajor, mouthY)]
    const pitch = 0.7 * MM * Math.max(d1 / 6, 0.55)
    const teeth = THREE.MathUtils.clamp(Math.round(span / pitch), 3, d1 >= 6 ? 8 : 5)
    for (let i = 0; i < teeth; i++) {
      const yRoot = mouthY - (i / teeth) * span
      const yCrest = mouthY - ((i + 0.5) / teeth) * span
      // doubled points → crisp tooth edges instead of smoothed ripples
      threadPts.push(P(rMinor, yCrest), P(rMinor, yCrest))
      threadPts.push(P(rMajor, yRoot - span / teeth), P(rMajor, yRoot - span / teeth))
    }
    const threadGeo = new THREE.LatheGeometry(threadPts, 64)
    threadGeo.computeVertexNormals()
    weldLatheSeam(threadGeo, 64, threadPts.length)
    product.add(new THREE.Mesh(threadGeo, threadMat))

    const boreFloor = new THREE.Mesh(new THREE.CircleGeometry(rMajor * 0.92, 32), holeMat)
    boreFloor.rotation.x = -Math.PI / 2
    boreFloor.position.y = floorY + 0.001
    product.add(boreFloor)
  }

  return {
    product,
    animate(t, motion) {
      if (!motion) {
        product.position.y = 0
        product.rotation.z = 0
        return
      }
      product.position.y = Math.sin(t * 0.9) * 0.01
      product.rotation.z = Math.sin(t * 0.4) * 0.06
    },
  }
}
