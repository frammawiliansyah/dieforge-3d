/**
 * Taper Lock — round two-piece mold split-line interlock set (male + female),
 * SUJ2 ground steel. Shown as the catalog does: the MALE (cylindrical body
 * with a small centre screw hole on top and a tapered spigot underneath)
 * hovering over the FEMALE (a ring with a chamfered, tapered socket bore).
 * Ref: ezb2b H-1 product photo (pairs shown separated).
 */
import * as THREE from 'three'
import { makeLathe } from '../geometry'
import { createMaterials, resolvePinSteel } from '../materials'
import type { MotionBuildParams, ProductAssembly } from '../types'

export function buildTaperLockProduct(params?: MotionBuildParams): ProductAssembly {
  const { holeMat } = createMaterials()
  const steel = resolvePinSteel(params?.catalogLook, 0.0034)

  // --- proportions traced from the reference photo (right-hand stacked pair) ---
  const R = 0.28 // both pieces share the same OD
  const femH = 0.45 // female ring height
  const gap = 0.14 // display separation between the pieces
  const spigotH = 0.27
  const spigotTopR = 0.196 // ≈70% of the OD at the body
  const spigotBotR = 0.15 // tapers to ≈54% at the flat nose
  const maleBodyH = 0.6
  const holeR = 0.06 // small centre screw hole in the male top
  const boreMouthR = 0.19 // female tapered socket
  const boreBotR = 0.165
  const boreDepth = 0.32

  const fTop = femH
  const mBot = femH + gap
  const spigotTop = mBot + spigotH
  const mTop = spigotTop + maleBodyH
  const total = mTop

  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]

  const body = new THREE.Group()

  // ---- FEMALE: ring with a chamfered mouth and tapered socket bore ----
  const female = new THREE.Mesh(
    makeLathe(
      [
        P(0.0001, 0),
        ...hard(R - 0.02, 0),
        ...hard(R, 0.02),
        ...hard(R, fTop - 0.025),
        ...hard(R - 0.025, fTop),
        ...hard(boreMouthR + 0.02, fTop),
        ...hard(boreMouthR, fTop - 0.018),
        P(boreBotR, fTop - boreDepth),
        P(0.0001, fTop - boreDepth),
      ],
      128,
    ),
    steel,
  )
  body.add(female)
  const boreFloor = new THREE.Mesh(new THREE.CircleGeometry(boreBotR * 0.98, 48), holeMat)
  boreFloor.rotation.x = -Math.PI / 2
  boreFloor.position.y = fTop - boreDepth + 0.004
  body.add(boreFloor)

  // ---- MALE: tapered spigot → overhang step → cylindrical body → top face
  //      with a small chamfered centre hole ----
  const male = new THREE.Mesh(
    makeLathe(
      [
        P(0.0001, mBot),
        ...hard(spigotBotR - 0.02, mBot),
        ...hard(spigotBotR, mBot + 0.02),
        P(spigotTopR, spigotTop), // the taper
        ...hard(spigotTopR, spigotTop),
        ...hard(R, spigotTop),
        ...hard(R, mTop - 0.03),
        ...hard(R - 0.03, mTop),
        ...hard(holeR + 0.018, mTop),
        ...hard(holeR, mTop - 0.018),
        P(holeR, mTop - 0.1),
        P(0.0001, mTop - 0.1),
      ],
      128,
    ),
    steel,
  )
  body.add(male)
  const holeFloor = new THREE.Mesh(new THREE.CircleGeometry(holeR * 0.95, 24), holeMat)
  holeFloor.rotation.x = -Math.PI / 2
  holeFloor.position.y = mTop - 0.095
  body.add(holeFloor)

  body.position.y = -total / 2

  const product = new THREE.Group()
  product.name = 'taper-lock'
  product.add(body)

  const maleRestY = 0
  return {
    product,
    animate(t, motion) {
      // the male dips toward the female socket and lifts back
      const phase = motion ? (Math.sin(t * 0.9) * 0.5 + 0.5) * 0.07 : 0
      male.position.y = maleRestY - phase
      holeFloor.position.y = mTop - 0.095 - phase
    },
  }
}
