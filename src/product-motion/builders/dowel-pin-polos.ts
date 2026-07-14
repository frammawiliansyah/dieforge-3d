/**
 * Ref: public/product-refs/motion/dowel-pin-polos.jpg
 * DIN 6325 / ISO 8734 — hardened ground parallel dowel pin (plain, solid).
 * One end 15° chamfer (press-fit), opposite end radiused.
 * Dimensions driven by variant.size (e.g. "6X20" → d1=6 mm, L=20 mm).
 */
import * as THREE from 'three'
import { lookupDin6325 } from '../din6325-dimensions'
import { weldLatheSeam } from '../geometry'
import { resolvePinSteel } from '../materials'
import { parsePinVariantSize } from '../parse-variant-size'
import type { MotionBuildParams, ProductAssembly } from '../types'

/** Scene scale: 1 unit ≈ 20 mm */
const MM = 0.05

const DEFAULT_D1 = 6
const DEFAULT_L = 24

export function buildDowelPinPolosProduct(params?: MotionBuildParams): ProductAssembly {
  const parsed = parsePinVariantSize(params?.variantSize)
  const d1 = parsed?.d1 ?? DEFAULT_D1
  const L = parsed?.L ?? DEFAULT_L
  return buildDowelPinPolosForSize(d1, L, params?.catalogLook)
}

function buildDowelPinPolosForSize(d1: number, L: number, catalogLook?: boolean): ProductAssembly {
  const din = lookupDin6325(d1)
  const steel = resolvePinSteel(catalogLook, d1 >= 6 ? 0.0038 : 0.0032)

  const SEG = d1 >= 6 ? 128 : 96
  const r = (d1 / 2) * MM
  const pinLen = L * MM
  const halfL = pinLen / 2

  const chamBottom = Math.min(din.z2 * MM * 0.28, r * 0.32, halfL * 0.16)
  const rEndBottom = Math.max(r - chamBottom, r * 0.74)

  const endRound = Math.min(din.endRadius * MM * 0.12, r * 0.22, halfL * 0.14)
  const chamTop = Math.min(din.z1 * MM * 0.18, r * 0.2, halfL * 0.1)

  const product = new THREE.Group()
  product.name = 'dowel-pin-polos'

  // Solid cylinder — chamfered press-fit end, radiused opposite end (no bore).
  // Face/chamfer corners doubled for hard ground edges; the rounded end keeps
  // smooth shared points so it still shades as a blend radius.
  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]
  const profile = [
    P(0.0001, -halfL),
    ...hard(rEndBottom, -halfL),
    ...hard(r, -halfL + chamBottom),
    P(r, halfL - endRound - chamTop),
    P(r * 0.992, halfL - endRound),
    P(r * 0.97, halfL - endRound * 0.35),
    P(0.0001, halfL),
  ]

  const bodyGeo = new THREE.LatheGeometry(profile, SEG)
  bodyGeo.computeVertexNormals()
  weldLatheSeam(bodyGeo, SEG, profile.length)
  product.add(new THREE.Mesh(bodyGeo, steel))

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
