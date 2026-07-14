/**
 * Ref: public/product-refs/punches/primary.jpg
 * Straight punch — satin steel shaft + base flange, matte black-oxide head
 * at the top with center recess (matches catalog photos).
 */
import * as THREE from 'three'
import { weldLatheSeam } from '../geometry'
import {
  resolvePinSteel,
  resolvePunchHead,
  resolvePunchRecess,
} from '../materials'
import type { MotionBuildParams, ProductAssembly } from '../types'

const SEG = 128

export function buildPunchesProduct(params?: MotionBuildParams): ProductAssembly {
  return buildStraightPunch(params?.catalogLook)
}

function buildStraightPunch(catalogLook?: boolean): ProductAssembly {
  const steel = resolvePinSteel(catalogLook, 0.0034)
  const head = resolvePunchHead(catalogLook)
  const recess = resolvePunchRecess(catalogLook)

  // Proportions tuned to catalog/previews: flange ~1.5× shaft Ø, head ≈ shaft Ø
  const shaftR = 0.108
  const flangeR = shaftR * 1.52
  const flangeT = 0.095
  const shaftLen = 1.05
  const headR = shaftR
  const headT = 0.105
  const baseCham = Math.min(flangeR * 0.06, 0.014)
  const topCham = Math.min(headR * 0.12, 0.012)

  const shaftTopY = flangeT + shaftLen

  const product = new THREE.Group()
  product.name = 'punches-headed'
  const body = new THREE.Group()

  // Steel body: base flange + uniform shaft (sharp shoulder step).
  // Corner points doubled so faces, chamfers and the step shade hard.
  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]
  const bodyProfile = [
    P(0.0001, 0),
    ...hard(flangeR - baseCham, 0),
    ...hard(flangeR, baseCham),
    ...hard(flangeR, flangeT),
    ...hard(shaftR, flangeT),
    P(shaftR, shaftTopY),
    P(0.0001, shaftTopY),
  ]
  const bodyGeo = new THREE.LatheGeometry(bodyProfile, SEG)
  bodyGeo.computeVertexNormals()
  weldLatheSeam(bodyGeo, SEG, bodyProfile.length)
  body.add(new THREE.Mesh(bodyGeo, steel))

  // Black-oxide head — straight cylinder, flat top with edge chamfer
  const headProfile = [
    P(0.0001, shaftTopY),
    ...hard(headR, shaftTopY),
    ...hard(headR, shaftTopY + headT - topCham),
    ...hard(headR - topCham, shaftTopY + headT),
    P(0.0001, shaftTopY + headT),
  ]
  const headGeo = new THREE.LatheGeometry(headProfile, SEG)
  headGeo.computeVertexNormals()
  weldLatheSeam(headGeo, SEG, headProfile.length)
  body.add(new THREE.Mesh(headGeo, head))

  // Center recess on head top (machining mark)
  const recessR = headR * 0.3
  const recessDepth = 0.018
  const recessMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(recessR, recessR, recessDepth, 32),
    recess,
  )
  recessMesh.position.y = shaftTopY + headT - recessDepth * 0.5 - 0.001
  body.add(recessMesh)

  const totalH = shaftTopY + headT
  body.position.y = -totalH / 2
  product.add(body)

  return {
    product,
    animate(t, motion) {
      product.position.y = motion ? Math.abs(Math.sin(t * 1.6)) * 0.02 : 0
    },
  }
}
