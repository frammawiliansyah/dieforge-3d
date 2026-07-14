/**
 * Ref: public/product-refs/motion/guide-pin.jpg
 * Mold guide pin (leader pin) — SUJ2, solid headed type, straight shank.
 * Body Ø × length from variant.size (e.g. "16x80" → d=16 mm, L=80 mm).
 */
import * as THREE from 'three'
import { weldLatheSeam } from '../geometry'
import { lookupGuidePin } from '../guide-pin-dimensions'
import { resolvePinSteel } from '../materials'
import { parsePinVariantSize } from '../parse-variant-size'
import type { MotionBuildParams, ProductAssembly } from '../types'

const MM = 0.05

const DEFAULT_D1 = 16
const DEFAULT_L = 80

export function buildGuidePinProduct(params?: MotionBuildParams): ProductAssembly {
  const parsed = parsePinVariantSize(params?.variantSize)
  const d1 = parsed?.d1 ?? DEFAULT_D1
  const L = parsed?.L ?? DEFAULT_L
  return buildGuidePinForSize(d1, L, params?.catalogLook)
}

function buildGuidePinForSize(d1: number, L: number, catalogLook?: boolean): ProductAssembly {
  const spec = lookupGuidePin(d1)
  const steel = resolvePinSteel(catalogLook, 0.0036)

  const SEG = 128
  const r = (d1 / 2) * MM
  const headR = (spec.headD / 2) * MM
  let headH = spec.headH * MM
  const pinLen = L * MM

  headH = Math.min(headH, pinLen * 0.18)
  const tipCham = Math.min(r * 0.22, pinLen * 0.04, 0.012)
  const headCham = Math.min(headR * 0.08, headH * 0.25)

  const shankTop = pinLen - headH

  const product = new THREE.Group()
  product.name = 'guide-pin'

  // Solid throughout — chamfered flat tip, straight shank, headed top (no bore,
  // no groove). Corner points doubled so machined edges shade hard.
  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]
  const profile = [
    P(0.0001, 0),
    ...hard(Math.max(r - tipCham, r * 0.72), 0),
    ...hard(r, tipCham),
    ...hard(r, shankTop),
    ...hard(headR, shankTop),
    ...hard(headR, pinLen - headCham),
    ...hard(headR - headCham, pinLen),
    P(0.0001, pinLen),
  ]

  const bodyGeo = new THREE.LatheGeometry(profile, SEG)
  bodyGeo.computeVertexNormals()
  weldLatheSeam(bodyGeo, SEG, profile.length)
  const body = new THREE.Mesh(bodyGeo, steel)
  body.position.y = -pinLen / 2
  product.add(body)

  return {
    product,
    animate(t, motion) {
      if (!motion) {
        product.position.y = 0
        product.rotation.z = 0
        return
      }
      product.position.y = Math.sin(t * 0.75) * 0.012
      product.rotation.z = Math.sin(t * 0.35) * 0.05
    },
  }
}
