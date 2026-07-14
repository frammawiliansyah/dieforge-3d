/**
 * Headed guide bushing (Guide Bush Kepala) — flange top, hollow body, thin groove ring.
 *
 * Catalog photos use compact proportions: total height ≈ flange OD, flange ~17% of height,
 * flange OD ≈ 1.52× body OD, bore ≈ 58% of flange radius. When catalogLook is on (PDP),
 * dimensions follow those ratios scaled by variant diameter only.
 * Flange height is a thin disc (~17% of total).
 */
import * as THREE from 'three'
import { weldLatheSeam } from '../geometry'
import {
  createMaterials,
  resolveBushGroove,
  resolveBushSteel,
  resolvePinInterior,
} from '../materials'
import { parsePinVariantSize } from '../parse-variant-size'
import type { MotionBuildParams, ProductAssembly } from '../types'

const MM = 0.05
const DEFAULT_D = 16
const DEFAULT_L = 40

/** Catalog photo ratios (measured from product previews). */
const FLANGE_TO_BODY_R = 1.52
const TOTAL_H_TO_FLANGE_R = 2.08
const FLANGE_T_FRAC = 0.17
const BORE_TO_FLANGE_R = 0.58

export function buildGuideBushKepalaProduct(params?: MotionBuildParams): ProductAssembly {
  const parsed = parsePinVariantSize(params?.variantSize)
  const d = parsed?.d1 ?? DEFAULT_D
  const L = parsed?.L ?? DEFAULT_L
  return buildGuideBushKepalaForSize(d, L, params?.catalogLook)
}

interface BushDims {
  bushR: number
  flangeR: number
  boreR: number
  bushLen: number
  flangeT: number
  totalH: number
}

function resolveBushDims(d: number, L: number, catalogLook?: boolean): BushDims {
  const bushR = (d / 2) * MM
  const flangeR = bushR * FLANGE_TO_BODY_R

  if (catalogLook) {
    const totalH = flangeR * TOTAL_H_TO_FLANGE_R
    const flangeT = Math.min(totalH * FLANGE_T_FRAC, bushR * 0.34)
    const bushLen = totalH - flangeT
    const boreR = flangeR * BORE_TO_FLANGE_R
    return { bushR, flangeR, boreR, bushLen, flangeT, totalH }
  }

  const bushLen = L * MM
  const flangeT = Math.max(bushR * 0.65, bushLen * 0.34)
  const totalH = bushLen + flangeT
  const boreR = bushR * 0.58
  return { bushR, flangeR, boreR, bushLen, flangeT, totalH }
}

function buildGuideBushKepalaForSize(d: number, L: number, catalogLook?: boolean): ProductAssembly {
  const steel = resolveBushSteel(catalogLook)
  const boreMat = resolvePinInterior(catalogLook)
  const grooveMat = resolveBushGroove(catalogLook)
  const { holeMat } = createMaterials()

  const { bushR, flangeR, boreR, bushLen, flangeT, totalH } = resolveBushDims(d, L, catalogLook)

  const SEG = 144
  const bottomCham = Math.min(bushR * 0.08, 0.008)
  const topOuterCham = Math.min(flangeR * 0.055, 0.01)
  const topInnerCham = Math.min(boreR * 0.06, 0.008)

  const grooveY = bushLen * 0.5
  const grooveHalf = bushR * 0.032
  const grooveCut = bushR * 0.016

  const product = new THREE.Group()
  product.name = 'guide-bush-kepala'
  const body = new THREE.Group()

  // Corner points doubled so faces, chamfers, the snap-ring groove shoulders
  // and the flange step all shade as hard machined edges.
  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]
  const wallProfile = [
    P(boreR, 0),
    ...hard(bushR - bottomCham, 0),
    ...hard(bushR, bottomCham),
    ...hard(bushR, grooveY - grooveHalf),
    ...hard(bushR - grooveCut, grooveY - grooveHalf * 0.25),
    ...hard(bushR - grooveCut, grooveY + grooveHalf * 0.25),
    ...hard(bushR, grooveY + grooveHalf),
    ...hard(bushR, bushLen),
    ...hard(flangeR, bushLen),
    ...hard(flangeR, totalH - topOuterCham),
    ...hard(flangeR - topOuterCham, totalH),
    ...hard(boreR + topInnerCham, totalH - topInnerCham * 0.7),
    ...hard(boreR, totalH - topInnerCham),
    P(boreR, 0),
  ]
  const wallGeo = new THREE.LatheGeometry(wallProfile, SEG)
  wallGeo.computeVertexNormals()
  weldLatheSeam(wallGeo, SEG, wallProfile.length)
  body.add(new THREE.Mesh(wallGeo, steel))

  const grooveRing = new THREE.Mesh(
    new THREE.TorusGeometry(bushR - grooveCut * 0.45, bushR * 0.011, 10, SEG),
    grooveMat,
  )
  grooveRing.rotation.x = Math.PI / 2
  grooveRing.position.y = grooveY
  body.add(grooveRing)

  const boreTube = new THREE.Mesh(
    new THREE.CylinderGeometry(boreR * 0.985, boreR * 0.985, totalH * 0.992, 56, 1, true),
    boreMat,
  )
  boreTube.position.y = totalH / 2
  body.add(boreTube)

  const boreWell = new THREE.Mesh(
    new THREE.CylinderGeometry(boreR * 0.99, boreR * 0.99, Math.min(flangeT * 0.22, bushR * 0.06), 48),
    holeMat,
  )
  boreWell.position.y = totalH - flangeT * 0.15
  body.add(boreWell)

  body.position.y = -totalH / 2
  product.add(body)

  return {
    product,
    animate(t, motion) {
      product.position.y = motion ? Math.sin(t * 1.1) * 0.004 : 0
    },
  }
}
