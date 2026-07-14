/**
 * Ref: public/product-refs/motion/return-pin.jpg
 * Mold return pin — 20Cr, headed type (resets ejector plate).
 * Body Ø × length from variant.size (e.g. "25x250" → d=25 mm, L=250 mm).
 */
import * as THREE from 'three'
import { weldLatheSeam } from '../geometry'
import { lookupReturnPin } from '../return-pin-dimensions'
import { resolvePinSteel } from '../materials'
import { parsePinVariantSize } from '../parse-variant-size'
import type { MotionBuildParams, ProductAssembly } from '../types'

const MM = 0.05

const DEFAULT_D1 = 16
const DEFAULT_L = 130

export function buildReturnPinProduct(params?: MotionBuildParams): ProductAssembly {
  const parsed = parsePinVariantSize(params?.variantSize)
  const d1 = parsed?.d1 ?? DEFAULT_D1
  const L = parsed?.L ?? DEFAULT_L
  return buildReturnPinForSize(d1, L, params?.catalogLook)
}

function buildReturnPinForSize(d1: number, L: number, catalogLook?: boolean): ProductAssembly {
  const spec = lookupReturnPin(d1)
  const steel = resolvePinSteel(catalogLook, 0.0036)

  const SEG = 128
  const shaftR = (d1 / 2) * MM
  const flangeR = (spec.headD / 2) * MM
  let headT = spec.headT * MM
  const pinLen = L * MM

  headT = Math.min(headT, pinLen * 0.08)
  const cham = Math.min(flangeR * 0.07, headT * 0.35, 0.012)
  const topCham = Math.min(shaftR * 0.18, pinLen * 0.012, 0.014)
  const shoulderBlend = Math.min(headT * 0.35, shaftR * 0.15)

  const product = new THREE.Group()
  product.name = 'return-pin'

  // Solid — wide flange head at base, long shaft, chamfered flat top (no bore).
  // Face/chamfer corners doubled for hard ground edges; the flange→shaft
  // shoulder keeps smooth shared points so it still shades as a fillet.
  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]
  const profile = [
    P(0.0001, 0),
    ...hard(flangeR - cham, 0),
    ...hard(flangeR, cham),
    ...hard(flangeR, headT),
    P(shaftR + shoulderBlend * 0.4, headT + shoulderBlend * 0.25),
    P(shaftR, headT + shoulderBlend),
    ...hard(shaftR, pinLen - topCham),
    ...hard(shaftR - topCham, pinLen),
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
        return
      }
      // Return stroke — pushes ejector plate back each cycle
      const phase = Math.sin(t * 1.1) * 0.5 + 0.5
      product.position.y = phase * Math.min(pinLen * 0.06, 0.08)
    },
  }
}
