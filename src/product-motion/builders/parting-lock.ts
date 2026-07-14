/**
 * Parting Lock (PO LOCK, S45C) — a mold parting-line spring-plunger that
 * controls the plate opening sequence. A tall vivid-orange nylon sleeve with a
 * slim black threaded stud on top (short neck, no wide shoulder) and, at the
 * bottom, a small black neck stepping into a wider KNURLED black adjustment
 * nut whose underside carries the engagement socket.
 * Ref: product photo — four sizes standing; sleeve H ≈ 1.5×Ø, stud ≈ ⅓×Ø.
 */
import * as THREE from 'three'
import { makeLathe, screwThreadGeometry, straightKnurlGeometry } from '../geometry'
import { createMaterials } from '../materials'
import type { MotionBuildParams, ProductAssembly } from '../types'

export function buildPartingLockProduct(_params?: MotionBuildParams): ProductAssembly {
  const { sleeveOrange, blackOxide, holeMat } = createMaterials()

  // vivid red-orange nylon sleeve (the photo is brighter than the default burnt orange)
  const orange = sleeveOrange.clone()
  orange.color.setHex(0xd84515)
  orange.roughness = 0.38
  orange.clearcoat = 0.28
  orange.clearcoatRoughness = 0.4
  orange.envMapIntensity = 0.35

  // black-oxide S45C steel for the stud, necks and knurled nut
  const steel = blackOxide.clone()
  steel.color.setHex(0x15161b)
  steel.roughness = 0.5
  steel.envMapIntensity = 0.6

  // --- dimensions (world units), traced from the largest unit in the photo ---
  const rBody = 0.4 // orange sleeve radius
  const sleeveL = 1.2 // sleeve height ≈ 1.5×Ø
  const nutR = 0.27 // knurled nut ≈ ⅔ of the sleeve Ø
  const nutH = 0.32
  const neckR = 0.19 // short neck between nut and sleeve
  const neckH = 0.14
  const rStud = 0.13 // slim stud ≈ ⅓ of the sleeve Ø
  const studNeckH = 0.06
  const studL = 0.56
  const depth = 0.02 // stud thread depth
  const root = rStud - depth
  const pitch = 0.052
  const sCham = 0.012 // sleeve edges stay near-sharp like the photo

  const sleeveBot = nutH + neckH
  const sleeveTop = sleeveBot + sleeveL
  const studBase = sleeveTop + studNeckH
  const studTop = studBase + studL
  const total = studTop

  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]

  const body = new THREE.Group()

  // --- knurled black adjustment nut with the engagement socket underneath ---
  const nutProfile = [
    P(0.11, 0.1), // socket floor
    ...hard(0.11, 0), // socket wall down to the mouth
    ...hard(nutR - 0.022, 0),
    ...hard(nutR, 0.022),
    ...hard(nutR, nutH - 0.022),
    ...hard(nutR - 0.022, nutH),
    P(0.0001, nutH),
  ]
  body.add(new THREE.Mesh(makeLathe(nutProfile, 96), steel))
  const kDepth = 0.007
  const knurl = new THREE.Mesh(
    straightKnurlGeometry(nutR + 0.001 + kDepth, kDepth, nutH - 0.06, 64),
    steel,
  )
  knurl.position.y = 0.03
  body.add(knurl)
  const socketFloor = new THREE.Mesh(new THREE.CircleGeometry(0.105, 32), holeMat)
  socketFloor.rotation.x = Math.PI / 2 // face the mouth (−Y)
  socketFloor.position.y = 0.096
  body.add(socketFloor)

  // --- short black neck stepping up into the sleeve ---
  body.add(
    new THREE.Mesh(
      makeLathe(
        [P(0.0001, nutH), ...hard(neckR, nutH), ...hard(neckR, sleeveBot), P(0.0001, sleeveBot)],
        64,
      ),
      steel,
    ),
  )

  // --- tall orange nylon sleeve (near-sharp chamfered ends) ---
  const sleeveProfile = [
    P(0.0001, sleeveBot),
    ...hard(rBody - sCham, sleeveBot),
    ...hard(rBody, sleeveBot + sCham),
    ...hard(rBody, sleeveTop - sCham),
    ...hard(rBody - sCham, sleeveTop),
    P(0.0001, sleeveTop),
  ]
  body.add(new THREE.Mesh(makeLathe(sleeveProfile, 96), orange))

  // --- slim black stud: short neck → root cylinder → chamfered tip ---
  const studCham = 0.03
  const studProfile = [
    P(0.0001, sleeveTop),
    ...hard(rStud + 0.01, sleeveTop),
    ...hard(rStud + 0.01, studBase),
    ...hard(root - 0.002, studBase + 0.005),
    P(root - 0.002, studTop - studCham),
    ...hard(root, studTop - studCham),
    ...hard(root - studCham * 0.5, studTop),
    P(0.0001, studTop),
  ]
  body.add(new THREE.Mesh(makeLathe(studProfile, 64), steel))

  // machined V-thread over the stud (crisp crests like the photo)
  const tStart = studBase + 0.01
  const tEnd = studTop - studCham - 0.005
  const thread = new THREE.Mesh(
    screwThreadGeometry({
      rootR: root,
      depth,
      pitch,
      length: tEnd - tStart,
      fadeTurns: 0.5,
    }),
    steel,
  )
  thread.position.y = tStart
  body.add(thread)

  body.position.y = -total / 2

  const product = new THREE.Group()
  product.name = 'parting-lock'
  product.add(body)

  return {
    product,
    animate(t, motion) {
      // gentle spin about the long axis to show all sides
      product.rotation.y = motion ? t * 0.4 : 0
    },
  }
}
