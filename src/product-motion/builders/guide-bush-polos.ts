/**
 * Plain guide bushing — hollow cylinder with thin oil-groove ring mid-body.
 * Catalog photos: height ≈ 1.5× OD, polished ends, matte gray band (~25% height) center.
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
const DEFAULT_L = 50

/** Catalog: total height ≈ 1.5× outer diameter; middle matte band ≈ 25% of height. */
const TOTAL_H_TO_OUTER_R = 3.0
const BORE_TO_OUTER_R = 0.62
const CATALOG_BAND_FRAC = 0.25

export function buildGuideBushPolosProduct(params?: MotionBuildParams): ProductAssembly {
  const parsed = parsePinVariantSize(params?.variantSize)
  const d = parsed?.d1 ?? DEFAULT_D
  const L = parsed?.L ?? DEFAULT_L
  return buildGuideBushPolosForSize(d, L, params?.catalogLook)
}

interface PolosDims {
  outerR: number
  boreR: number
  len: number
}

function resolvePolosDims(d: number, L: number, catalogLook?: boolean): PolosDims {
  const outerR = (d / 2) * MM
  if (catalogLook) {
    const len = outerR * TOTAL_H_TO_OUTER_R
    const boreR = outerR * BORE_TO_OUTER_R
    return { outerR, boreR, len }
  }
  return { outerR, boreR: outerR * 0.58, len: L * MM }
}

function buildGuideBushPolosForSize(d: number, L: number, catalogLook?: boolean): ProductAssembly {
  const steel = resolveBushSteel(catalogLook)
  const boreMat = resolvePinInterior(catalogLook)
  const grooveMat = resolveBushGroove(catalogLook)
  const { holeMat } = createMaterials()

  const { outerR, boreR, len } = resolvePolosDims(d, L, catalogLook)

  const SEG = 144
  const bottomCham = Math.min(outerR * 0.09, 0.008)
  const topCham = Math.min(outerR * 0.09, 0.008)
  const topInnerCham = Math.min(boreR * 0.06, 0.008)

  const grooveY = len * 0.5
  const bandH = catalogLook ? len * CATALOG_BAND_FRAC : outerR * 0.064
  const bandY0 = catalogLook ? len * ((1 - CATALOG_BAND_FRAC) / 2) : grooveY - bandH / 2
  const bandY1 = bandY0 + bandH
  const grooveHalf = catalogLook ? bandH / 2 : outerR * 0.032
  const grooveCut = catalogLook ? outerR * 0.008 : outerR * 0.016

  const product = new THREE.Group()
  product.name = 'guide-bush-polos'
  const body = new THREE.Group()

  // Corner points doubled so face, chamfer and groove edges shade hard
  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]
  const wallProfile = catalogLook
    ? [
        P(boreR, 0),
        ...hard(outerR - bottomCham, 0),
        ...hard(outerR, bottomCham),
        ...hard(outerR, len - topCham),
        ...hard(outerR - topCham, len),
        ...hard(boreR + topInnerCham, len - topInnerCham * 0.7),
        ...hard(boreR, len - topInnerCham),
        P(boreR, 0),
      ]
    : [
        P(boreR, 0),
        ...hard(outerR - bottomCham, 0),
        ...hard(outerR, bottomCham),
        ...hard(outerR, grooveY - grooveHalf),
        ...hard(outerR - grooveCut, grooveY - grooveHalf * 0.25),
        ...hard(outerR - grooveCut, grooveY + grooveHalf * 0.25),
        ...hard(outerR, grooveY + grooveHalf),
        ...hard(outerR, len - topCham),
        ...hard(outerR - topCham, len),
        ...hard(boreR + topInnerCham, len - topInnerCham * 0.7),
        ...hard(boreR, len - topInnerCham),
        P(boreR, 0),
      ]
  const wallGeo = new THREE.LatheGeometry(wallProfile, SEG)
  wallGeo.computeVertexNormals()
  weldLatheSeam(wallGeo, SEG, wallProfile.length)
  body.add(new THREE.Mesh(wallGeo, steel))

  const bandMat = grooveMat.clone()
  if (catalogLook) {
    bandMat.color.setHex(0x7a8088)
    bandMat.roughness = 0.82
    bandMat.metalness = 0.42
    bandMat.envMapIntensity = 0.18
  }

  if (catalogLook) {
    const bandShell = new THREE.Mesh(
      new THREE.CylinderGeometry(outerR * 1.002, outerR * 1.002, bandH, SEG, 1, true),
      bandMat,
    )
    bandShell.position.y = (bandY0 + bandY1) / 2
    body.add(bandShell)
  } else {
    const grooveRing = new THREE.Mesh(
      new THREE.TorusGeometry(outerR - grooveCut * 0.45, outerR * 0.011, 10, SEG),
      grooveMat,
    )
    grooveRing.rotation.x = Math.PI / 2
    grooveRing.position.y = grooveY
    body.add(grooveRing)
  }

  const boreTube = new THREE.Mesh(
    new THREE.CylinderGeometry(boreR * 0.985, boreR * 0.985, len * 0.992, 56, 1, true),
    boreMat,
  )
  boreTube.position.y = len / 2
  body.add(boreTube)

  const boreWell = new THREE.Mesh(
    new THREE.CylinderGeometry(boreR * 0.99, boreR * 0.99, Math.min(len * 0.08, outerR * 0.06), 48),
    holeMat,
  )
  boreWell.position.y = len - len * 0.04
  body.add(boreWell)

  body.position.y = -len / 2
  product.add(body)

  return {
    product,
    animate(t, motion) {
      product.position.y = motion ? Math.sin(t * 1.1) * 0.004 : 0
    },
  }
}
