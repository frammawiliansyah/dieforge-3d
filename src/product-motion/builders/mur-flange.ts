/**
 * Mur Flange — serrated hex flange nut (DIN 6923). Hex body with a chamfered
 * crown, an integrated conical washer flange whose bearing face carries
 * ratchet SERRATIONS, and a threaded through-bore with REAL internal threads
 * visible in the mouth. Bright zinc-plated steel.
 * Ref: mitranusa M8-N-2 photo (pair — crown view + serrated-face view).
 */
import * as THREE from 'three'
import { hexPrismGeometry, makeLathe, screwThreadGeometry } from '../geometry'
import { resolvePinSteel } from '../materials'
import type { MotionBuildParams, ProductAssembly } from '../types'

const MM = 0.05

export function buildMurFlangeProduct(params?: MotionBuildParams): ProductAssembly {
  const catalogLook = params?.catalogLook ?? true
  const steel = resolvePinSteel(catalogLook, 0.0026)

  // internal thread — same zinc, a touch darker, lit from its inside faces
  const threadMat = steel.clone()
  threadMat.color.multiplyScalar(0.88)
  threadMat.roughness = Math.min(1, threadMat.roughness + 0.05)
  threadMat.side = THREE.BackSide

  const af = 15 * MM // hex across-flats 0.75
  const flangeR = (21 / 2) * MM // 0.525
  const flangeT = 3.4 * MM // 0.17
  const hexH = 8 * MM // 0.4
  const boreR = (10 / 2) * MM * 0.92 // tapped bore ~ minor dia
  const crownH = 0.06 // chamfered crown replacing the top of the hex
  const totalH = flangeT + hexH
  const hexTop = totalH - crownH

  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]

  // --- conical washer flange: bore entry chamfer → serration band (flat) →
  //     rim → cone up to the hex root. Hard machined corners. ---
  const flange: THREE.Vector2[] = [
    P(boreR, 0.028),
    ...hard(boreR + 0.03, 0),
    ...hard(flangeR - 0.015, 0),
    ...hard(flangeR, 0.018),
    ...hard(flangeR, flangeT * 0.45),
    ...hard(af * 0.5, flangeT),
    P(boreR, flangeT),
  ]
  const flangeMesh = new THREE.Mesh(makeLathe(flange, 96), steel)

  // --- ratchet serrations on the bearing face: a ring of tilted wedge teeth
  //     half-buried in the flange underside (classic DIN 6923 locking teeth) ---
  const TEETH = 26
  const serrR = 0.41 // teeth span ≈ 0.31–0.51: smooth ring at the bore, rim intact
  const toothGeo = new THREE.BoxGeometry(0.08, 0.016, 0.2)
  for (let i = 0; i < TEETH; i++) {
    const a = (i / TEETH) * Math.PI * 2
    const tooth = new THREE.Mesh(toothGeo, steel)
    tooth.position.set(Math.sin(a) * serrR, -0.001, Math.cos(a) * serrR)
    tooth.rotation.y = a
    tooth.rotateZ(0.12) // tilt about the radial axis → tangential ramp
    flangeMesh.add(tooth)
  }

  // --- hex body (flat facet normals) topped by a chamfered crown ---
  const hexGeo = hexPrismGeometry(af, hexTop - flangeT).toNonIndexed()
  hexGeo.computeVertexNormals()
  const hexMesh = new THREE.Mesh(hexGeo, steel)
  hexMesh.position.y = flangeT + (hexTop - flangeT) / 2

  const crown = new THREE.Mesh(
    makeLathe(
      [
        P(0.435, hexTop),
        ...hard(0.345, totalH),
        ...hard(boreR + 0.03, totalH),
        P(boreR, totalH - 0.028),
      ],
      96,
    ),
    steel,
  )

  // --- real internal thread lining the bore (viewed from inside → BackSide);
  //     negative depth turns the helical crests inward ---
  const thread = new THREE.Mesh(
    screwThreadGeometry({
      rootR: boreR + 0.002,
      depth: -0.022,
      pitch: 0.07,
      length: totalH - 0.05,
      radialSegments: 96,
      stepsPerPitch: 10,
      fadeTurns: 0.3,
      crestFlat: 0.15,
      rootFlat: 0.2,
    }),
    threadMat,
  )
  thread.position.y = 0.025

  const body = new THREE.Group()
  body.add(flangeMesh, hexMesh, crown, thread)
  body.position.y = -totalH / 2

  const product = new THREE.Group()
  product.name = 'mur-flange'
  product.add(body)

  return {
    product,
    animate(t, motion) {
      product.rotation.y = motion ? t * 0.5 : 0
    },
  }
}
