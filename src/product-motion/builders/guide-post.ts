/**
 * Demountable ball-cage guide post SET, modelled from the reference photo
 * (tistatic "Guide Post Set"): two near-black rectangular flange plates with
 * three bolt holes along each side; a bright ground base boss on the bottom
 * plate; a coarse-spiral shaft; a bright ball-cage sleeve studded with
 * staggered chrome balls; a large smooth bush hanging from the bored top
 * plate, whose bore shows a bright countersink ring from above.
 */
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { makeLathe, screwThreadGeometry } from '../geometry'
import { createMaterials, resolveBushSteel } from '../materials'
import type { MotionBuildParams, ProductAssembly } from '../types'

export function buildGuidePostProduct(params?: MotionBuildParams): ProductAssembly {
  const { castIron, chrome, holeMat } = createMaterials()

  // near-black machined plates with a soft sheen (photo shows edge highlights)
  const plateMat = castIron.clone()
  plateMat.color.setHex(0x17181b)
  plateMat.bumpScale = 0.015
  plateMat.roughness = 0.55
  plateMat.envMapIntensity = 0.25

  const steel = resolveBushSteel(params?.catalogLook) // bright boss / cage / bush
  const shaftSteel = steel.clone() // the spiral shaft reads darker/oily in the photo
  shaftSteel.color.setHex(0x878c93)
  shaftSteel.metalness = 0.9
  shaftSteel.roughness = 0.34
  shaftSteel.envMapIntensity = 0.55
  const ballMat = chrome.clone()
  ballMat.roughness = 0.12

  // --- layout (world units), proportions traced from the reference photo ---
  const plateW = 1.4 // X
  const plateD = 1.05 // Z — the plates are rectangular in the photo
  const plateT = 0.28
  const bossR = 0.278
  const bossTop = plateT + 0.14
  const shaftR = 0.208
  const spiralBot = bossTop + 0.04
  const spiralTop = 0.98
  const cageR = 0.218
  const cageBot = spiralTop
  const cageTop = 1.15
  const bushR = 0.317
  const bushBot = 1.14
  const total = 1.86
  const topPlateBot = total - plateT // 1.58
  const boreR = 0.23 // top-plate bore ≈ bush inner wall

  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]

  const body = new THREE.Group()

  // ---- near-black flange plate: crisp slab + 3 bolt holes along each side ----
  const flangePlate = (centerY: number) => {
    const g = new THREE.Group()
    g.add(new THREE.Mesh(new RoundedBoxGeometry(plateW, plateT, plateD, 2, 0.015), plateMat))
    const hx = plateW / 2 - 0.14
    for (const sx of [-1, 1]) {
      for (const z of [-0.32, 0, 0.32]) {
        // caps sit a hair proud of the faces → read as flush dark bolt holes
        const hole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.055, plateT + 0.004, 20),
          holeMat,
        )
        hole.position.set(sx * hx, 0, z)
        g.add(hole)
      }
    }
    g.position.y = centerY
    return g
  }
  body.add(flangePlate(plateT / 2)) // bottom plate
  body.add(flangePlate(total - plateT / 2)) // top plate — bore dressed separately below

  // ---- bright ground base boss seating the post on the bottom plate ----
  body.add(
    new THREE.Mesh(
      makeLathe(
        [
          P(0.0001, plateT - 0.02),
          ...hard(bossR - 0.02, plateT - 0.02),
          ...hard(bossR, plateT),
          ...hard(bossR, bossTop - 0.018),
          ...hard(bossR - 0.018, bossTop),
          P(0.0001, bossTop),
        ],
        96,
      ),
      steel,
    ),
  )

  // ---- shaft: smooth stub → spiral root section → smooth top into the cage ----
  body.add(
    new THREE.Mesh(
      makeLathe(
        [
          P(0.0001, bossTop),
          ...hard(shaftR, bossTop),
          ...hard(shaftR, spiralBot),
          ...hard(shaftR - 0.025, spiralBot + 0.005),
          ...hard(shaftR - 0.025, spiralTop - 0.005),
          ...hard(shaftR, spiralTop),
          ...hard(shaftR, cageTop + 0.02),
          P(0.0001, cageTop + 0.02),
        ],
        96,
      ),
      shaftSteel,
    ),
  )

  // ---- coarse rounded spiral (ball-screw look): wide bright crests, narrow
  //      dark grooves — ≈8–9 turns like the photo ----
  const spiral = new THREE.Mesh(
    screwThreadGeometry({
      rootR: shaftR - 0.023,
      depth: 0.023,
      pitch: 0.066,
      length: spiralTop - spiralBot - 0.01,
      fadeTurns: 0.5,
      crestFlat: 0.38,
      rootFlat: 0.12,
    }),
    shaftSteel,
  )
  spiral.position.y = spiralBot + 0.005
  body.add(spiral)

  // ---- ball-cage sleeve: bright ring studded with staggered chrome balls ----
  const cage = new THREE.Mesh(
    new THREE.CylinderGeometry(cageR, cageR, cageTop - cageBot, 64),
    steel,
  )
  cage.position.y = (cageBot + cageTop) / 2
  body.add(cage)

  const ballGeo = new THREE.SphereGeometry(0.016, 12, 8)
  const rows = 5
  const perRow = 18
  for (let row = 0; row < rows; row++) {
    const y = cageBot + 0.025 + row * ((cageTop - cageBot - 0.05) / (rows - 1))
    const offset = (row % 2) * (Math.PI / perRow) // staggered pattern
    for (let i = 0; i < perRow; i++) {
      const a = offset + (i / perRow) * Math.PI * 2
      const ball = new THREE.Mesh(ballGeo, ballMat)
      ball.position.set(Math.sin(a) * cageR, y, Math.cos(a) * cageR)
      body.add(ball)
    }
  }

  // ---- large smooth bush hanging from the top plate (flat bottom face) ----
  body.add(
    new THREE.Mesh(
      makeLathe(
        [
          P(cageR + 0.007, bushBot),
          ...hard(bushR - 0.012, bushBot),
          ...hard(bushR, bushBot + 0.012),
          ...hard(bushR, topPlateBot + 0.02),
          P(cageR + 0.007, topPlateBot + 0.02),
          P(cageR + 0.007, bushBot),
        ],
        96,
      ),
      steel,
    ),
  )

  // ---- top-plate bore dressing (the plate box is solid, so the bore is a
  //      flush flat stack on its face): bright chamfer ring + dark bore disc ----
  const csRing = new THREE.Mesh(new THREE.RingGeometry(boreR + 0.005, boreR + 0.08, 64), steel)
  csRing.rotation.x = -Math.PI / 2
  csRing.position.y = total + 0.002
  body.add(csRing)
  const boreDisc = new THREE.Mesh(new THREE.CircleGeometry(boreR + 0.005, 48), holeMat)
  boreDisc.rotation.x = -Math.PI / 2
  boreDisc.position.y = total + 0.002
  body.add(boreDisc)

  body.position.y = -total / 2

  const product = new THREE.Group()
  product.name = 'guide-post'
  product.add(body)

  return {
    product,
    animate(t, motion) {
      body.rotation.y = motion ? t * 0.4 : 0
    },
  }
}
