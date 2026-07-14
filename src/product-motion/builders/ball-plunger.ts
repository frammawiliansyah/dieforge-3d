/**
 * Ball spring plunger — black-oxide body threaded over its full length with a
 * machined V-thread (wide flat crests), a bright chrome ball protruding from a
 * swaged CRIMP COLLAR at the top (smooth band → cone rolling up to the lip),
 * and a large hex (Allen) socket recessed in the bottom face.
 * Ball depresses on motion; spring stays captive.
 * Ref: hex-socket ball plunger photo pair — standing (ball/collar detail) and
 * lying (big hex socket face), L:D ≈ 2.2, ≈13–14 crests.
 */
import * as THREE from 'three'
import { hexCircumradius, hexPrismGeometry, makeLathe, screwThreadGeometry } from '../geometry'
import { createCoilMesh, createMaterials } from '../materials'
import type { ProductAssembly } from '../types'

export function buildBallPlungerProduct(): ProductAssembly {
  const { blackOxide, chrome, springWire, holeMat } = createMaterials()
  const ballMat = chrome.clone()
  ballMat.color = new THREE.Color(0xc6cbd3) // bright bearing ball (the one accent)
  ballMat.roughness = 0.1
  ballMat.envMapIntensity = 1.2

  const body = blackOxide.clone()
  body.color.setHex(0x1b1c21)
  body.roughness = 0.38
  body.metalness = 0.8
  body.envMapIntensity = 0.8
  body.clearcoat = 0.1 // slight oiled black-oxide sheen
  body.clearcoatRoughness = 0.35

  const bodyR = 0.2 // crest (major) radius — OD 0.4
  const L = 0.88 // L:D ≈ 2.2 like the photo
  const depth = 0.032 // thread depth
  const root = bodyR - depth
  const latheR = root - 0.002 // lathe tucked under the thread grid
  const pitch = 0.065 // ≈13–14 crests over the length
  const cham = 0.024
  const bandH = 0.06 // smooth collar band under the crimp cone
  const coneH = 0.055 // crimp cone rolling up toward the ball
  const lipR = 0.112 // ball hole at the cone tip
  const boreR = 0.118
  const ballR = 0.122
  const travel = 0.05
  const bandBot = L - coneH - bandH
  const runOut = 0.03 // root rises to the band OD under the last turns

  const product = new THREE.Group()
  product.name = 'ball-plunger'

  // hex socket sizing (bottom face) — counterbore wall touches the hex corners
  const sockAF = 0.21 // ≈52% of OD like the photo
  const cbR = hexCircumradius(sockAF)
  const cbDepth = 0.045 // counterbore ceiling above the bottom face
  const mch = 0.008 // socket-mouth chamfer (narrow in the photo)

  // body: recessed hex-socket mouth in a chamfered flat bottom → root cylinder
  // (the thread rides on it) → run-out → smooth band → crimp cone → lip →
  // ball bore. Corner points doubled so machined edges shade hard.
  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]
  const profile = [
    P(0.0001, cbDepth),
    ...hard(cbR, cbDepth),
    ...hard(cbR, mch),
    ...hard(cbR + mch, 0),
    ...hard(latheR - cham * 0.6, 0),
    ...hard(latheR, cham),
    ...hard(latheR, bandBot - runOut),
    ...hard(bodyR, bandBot),
    ...hard(bodyR, L - coneH),
    ...hard(lipR, L),
    ...hard(lipR, L - 0.03),
    P(boreR, L - 0.07),
    P(boreR, L - 0.16),
    P(0.0001, L - 0.16),
  ]
  const bodyMesh = new THREE.Mesh(makeLathe(profile, 96), body)
  bodyMesh.position.y = -L / 2
  product.add(bodyMesh)

  // machined thread with wide flat crests (the photo shows ribbon-like crests)
  const tStart = cham * 0.95
  const tEnd = bandBot - 0.005
  const thread = new THREE.Mesh(
    screwThreadGeometry({
      rootR: root,
      depth,
      pitch,
      length: tEnd - tStart,
      fadeTurns: 0.4,
      crestFlat: 0.14,
      rootFlat: 0.08, // thin root lines — the photo's flanks dominate the pitch
    }),
    body,
  )
  thread.position.y = tStart - L / 2
  product.add(thread)

  const bodyTop = L / 2
  const bodyBot = -L / 2
  const boreFloor = L - 0.16 - L / 2 // centered

  // dark bore floor disc for depth
  const floor = new THREE.Mesh(new THREE.CircleGeometry(boreR * 0.95, 32), holeMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = boreFloor + 0.001
  product.add(floor)

  // captive spring inside the bore
  const springH = 0.1
  const spring = createCoilMesh(boreR * 0.5, springH, 5, 0.009, springWire)
  spring.position.y = boreFloor + 0.004
  product.add(spring)

  // hex (Allen) socket sunk behind the counterbore mouth — how the plunger installs
  const sockDepth = 0.11
  const socket = new THREE.Mesh(hexPrismGeometry(sockAF, sockDepth, true), holeMat)
  socket.position.y = bodyBot + sockDepth / 2 + 0.006
  product.add(socket)

  // ball seated in the crimp — centre a touch below the lip plane, so a bit
  // under 40% of the ball shows; the sphere still overlaps the lip hole
  const moving = new THREE.Group()
  moving.add(new THREE.Mesh(new THREE.SphereGeometry(ballR, 48, 32), ballMat))
  const ballRestY = bodyTop - 0.028
  moving.position.y = ballRestY
  product.add(moving)

  return {
    product,
    animate(t, motion) {
      const phase = motion ? Math.sin(t * 1.3) * 0.5 + 0.5 : 0
      moving.position.y = ballRestY - phase * travel
    },
  }
}
