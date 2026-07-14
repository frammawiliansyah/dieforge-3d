/**
 * Baut Polos — plain hex-head bolt (DIN 933/931 style). Hex head + washer face +
 * partially threaded shank with a machined-profile helical V-thread (M10×1.5).
 * Bright satin steel.
 */
import * as THREE from 'three'
import { hexPrismGeometry, makeLathe, screwThreadGeometry } from '../geometry'
import { resolvePinSteel } from '../materials'
import type { MotionBuildParams, ProductAssembly } from '../types'

const MM = 0.05

export function buildBautPolosProduct(params?: MotionBuildParams): ProductAssembly {
  const steel = resolvePinSteel(params?.catalogLook ?? true, 0.0032)

  const shaftR = (10 / 2) * MM // M10 → 0.25
  const shaftLen = 40 * MM // 2.0
  const af = 17 * MM // wrench across-flats 0.85
  const headH = 6.4 * MM // 0.32
  const washerR = af * 0.62

  const pitch = 1.5 * MM // M10×1.5
  const depth = 0.61 * pitch // ISO metric thread depth
  const root = shaftR - depth // crests come out flush with the shank OD
  const latheRoot = root - 0.002 // lathe tucked under the thread grid (no z-fight)
  const tipCham = shaftR * 0.28
  const threadTopY = shaftLen * 0.6
  const runOut = pitch * 1.2 // root rises to the shank OD over the thread run-out

  // body: chamfered tip → root cylinder under the thread → run-out cone →
  // smooth shank. Corner points doubled for hard machined edges.
  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]
  const profile = [
    P(0.0001, 0),
    ...hard(root - tipCham * 0.4, 0),
    ...hard(latheRoot, tipCham),
    ...hard(latheRoot, threadTopY - runOut),
    ...hard(shaftR, threadTopY),
    ...hard(shaftR, shaftLen),
    P(0.0001, shaftLen),
  ]
  const shaftMesh = new THREE.Mesh(makeLathe(profile, 96), steel)

  // machined V-thread: run-in above the tip chamfer, run-out into the cone
  const tStart = tipCham * 0.95
  const tEnd = threadTopY - runOut * 0.2
  const thread = new THREE.Mesh(
    screwThreadGeometry({
      rootR: root,
      depth,
      pitch,
      length: tEnd - tStart,
      fadeTurns: 0.6,
    }),
    steel,
  )
  thread.position.y = tStart

  // washer face + hex head (flat facet normals so the hex shades crisp)
  const washerT = headH * 0.18
  const washer = new THREE.Mesh(new THREE.CylinderGeometry(washerR, washerR, washerT, 64), steel)
  washer.position.y = shaftLen + washerT / 2
  const hexBot = shaftLen + washerT
  const hexGeo = hexPrismGeometry(af, headH).toNonIndexed()
  hexGeo.computeVertexNormals()
  const head = new THREE.Mesh(hexGeo, steel)
  head.position.y = hexBot + headH / 2

  const totalH = hexBot + headH
  const body = new THREE.Group()
  body.add(shaftMesh, thread, washer, head)
  body.position.y = -totalH / 2

  const product = new THREE.Group()
  product.name = 'baut-polos'
  product.add(body)

  return {
    product,
    animate(t, motion) {
      product.rotation.y = motion ? t * 0.5 : 0
    },
  }
}
