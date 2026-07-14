/**
 * Screw Plug — tapered threaded sealing plug for cooling/oil channels
 * (DIN 906 / R-taper). Squat body (H ≈ 0.75×Ø), coarse truncated pipe thread
 * with a slight taper, and a BIG sunk hex (Allen) socket dominating the flat
 * top. Black-oxide.
 * Ref: MISUMI/NBK product photo 221000237939.
 */
import * as THREE from 'three'
import { hexSocketRecess, makeLathe, screwThreadGeometry } from '../geometry'
import { createMaterials } from '../materials'
import type { MotionBuildParams, ProductAssembly } from '../types'

export function buildScrewPlugProduct(_params?: MotionBuildParams): ProductAssembly {
  const { blackOxide, holeMat } = createMaterials()
  const metal = blackOxide.clone()
  metal.color.setHex(0x1e1f24)
  metal.roughness = 0.45
  metal.envMapIntensity = 0.7

  const R = 0.32 // body OD 0.64
  const H = 0.48 // squat: H ≈ 0.75×Ø like the photo
  const depth = 0.026 // thread depth
  const pitch = 0.07 // coarse — 6–7 crests over the body
  const rootTop = R - depth
  const taper = 0.94 // DIN 906 plugs taper slightly toward the tip
  const rootBot = rootTop * taper
  const rimY = H - 0.055 // short full-OD seat band under the top face
  const sockAF = 0.4 // big hex socket ≈ 62% of OD
  const sockR = sockAF / Math.sqrt(3)
  const sockDepth = 0.28
  const mch = 0.02 // socket mouth chamfer

  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]

  // tapered root body → full-OD seat band → chamfered flat top with the
  // socket counterbore. Hard machined corners throughout.
  const profile = [
    P(0.0001, 0),
    ...hard(rootBot - 0.027, 0),
    ...hard(rootBot - 0.002, 0.025),
    P(rootTop - 0.002, rimY), // tapered root line under the thread grid
    ...hard(rootTop, rimY),
    ...hard(R, rimY),
    ...hard(R, H - 0.03),
    ...hard(R - 0.03, H),
    ...hard(sockR + mch, H),
    ...hard(sockR, H - mch),
    P(sockR, H - sockDepth),
    P(0.0001, H - sockDepth),
  ]
  const bodyMesh = new THREE.Mesh(makeLathe(profile, 96), metal)

  // coarse truncated pipe thread, tapered to match the root line
  const tStart = 0.028
  const tEnd = rimY - 0.015
  const threadGeo = screwThreadGeometry({
    rootR: rootTop,
    depth,
    pitch,
    length: tEnd - tStart,
    fadeTurns: 0.5,
    crestFlat: 0.3,
    rootFlat: 0.15,
  })
  // gentle radial taper toward the tip (≈3° flank tilt — normals stay fine)
  const pos = threadGeo.attributes.position as THREE.BufferAttribute
  const len = tEnd - tStart
  for (let i = 0; i < pos.count; i++) {
    const f = taper + (1 - taper) * (pos.getY(i) / len)
    pos.setX(i, pos.getX(i) * f)
    pos.setZ(i, pos.getZ(i) * f)
  }
  pos.needsUpdate = true
  const thread = new THREE.Mesh(threadGeo, metal)
  thread.position.y = tStart

  const socket = hexSocketRecess(sockAF, sockDepth - mch, H - mch + 0.002, holeMat)

  const body = new THREE.Group()
  body.add(bodyMesh, thread, socket)
  body.position.y = -H / 2

  const product = new THREE.Group()
  product.name = 'screw-plug'
  product.add(body)

  return {
    product,
    animate(t, motion) {
      product.rotation.y = motion ? t * 0.45 : 0
    },
  }
}
