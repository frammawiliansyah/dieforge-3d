/**
 * Air jet (poppet) valve — a satin stainless (SUS420) cylinder, slip fit, no
 * thread. The head is a CUP: a full ring top face with a central cylindrical
 * cavity. A transverse slot (about as wide as the poppet) is milled down to a
 * flat ledge, interrupting the ring at two opposite sides. The black poppet
 * head sits recessed inside the cavity on a spring, retained by a bright
 * cross-pin that lies ALONG the slot, ends seated in the ring notches —
 * viewed from the front the pin reads end-on as a small circle under the head.
 * Built standing (axis +Y, slot channel along Z so it faces the hero cameras).
 * Refs: made-in-china "Precision Air Jet Valve" photos — three steel sizes
 * standing; one lying showing the pin end-on; brass/steel trio top view.
 */
import * as THREE from 'three'
import { makeLathe } from '../geometry'
import { createCoilMesh, createMachiningBump, createMaterials } from '../materials'
import type { ProductAssembly } from '../types'

export function buildAirJetValveProduct(): ProductAssembly {
  const { polishedSteel, blackOxide, springWire, holeMat } = createMaterials()

  // satin stainless — mid-grey with contrasty reflections, not washed-out white
  const body = polishedSteel.clone()
  body.color.setHex(0xa6acb3)
  body.metalness = 0.95
  body.roughness = 0.28
  body.envMapIntensity = 0.95
  body.bumpMap = createMachiningBump()
  body.bumpScale = 0.0025

  // black-oxide poppet head
  const poppetMat = blackOxide.clone()
  poppetMat.color.setHex(0x1d1f24)
  poppetMat.roughness = 0.45
  poppetMat.metalness = 0.7
  poppetMat.envMapIntensity = 0.6

  // bright ground pin/stem steel
  const stemMat = polishedSteel.clone()
  stemMat.color.setHex(0xc7ccd3)
  stemMat.roughness = 0.22
  stemMat.envMapIntensity = 0.9

  const springMat = springWire.clone()
  springMat.color.setHex(0x9aa0a8)
  springMat.metalness = 0.85
  springMat.roughness = 0.42
  springMat.envMapIntensity = 0.45

  const SEG = 96
  const bodyR = 0.32
  const H = 0.95
  const botY = -H / 2
  const topY = H / 2
  const cham = 0.035
  const headH = 0.32 // cup section height == cavity depth
  const shoulderY = topY - headH // cavity floor (spring seat)
  const cavR = 0.215 // central cavity radius — ring wall ≈ 1/3 of the radius
  const slotDepth = 0.24 // slot ledge sits this far below the ring plane
  const slotFloorY = topY - slotDepth
  const slotHalf = 0.15 // half the slot width (slot ≈ poppet diameter)

  const product = new THREE.Group()
  product.name = 'air-jet-valve'

  // --- one lathe: solid body → tube wall (outer bodyR / inner cavR) up to the
  //     slot ledge. Its top annulus face IS the slot floor where exposed.
  //     Corner points doubled for hard machined edges. ---
  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]
  const bodyProfile = [
    P(0.0001, botY),
    ...hard(bodyR - cham, botY),
    ...hard(bodyR, botY + cham),
    ...hard(bodyR, slotFloorY),
    ...hard(cavR, slotFloorY),
    ...hard(cavR, shoulderY),
    P(0.0001, shoulderY),
  ]
  product.add(new THREE.Mesh(makeLathe(bodyProfile, SEG), body))

  // --- two ring-arc wall pieces (C-shaped annulus segments) above the ledge.
  //     They complete the cup ring; the gaps between them are the slot notches.
  //     Shapes are inset by the bevel size so the beveled extrusion lands
  //     flush with the walls; the base bevel hides inside the tube below. ---
  const bev = 0.012
  const rOut = bodyR - bev
  const rIn = cavR + bev
  const gapHalf = slotHalf + bev
  const xOut = Math.sqrt(rOut * rOut - gapHalf * gapHalf)
  const xIn = Math.sqrt(rIn * rIn - gapHalf * gapHalf)
  const aOut = Math.asin(gapHalf / rOut)
  const aIn = Math.asin(gapHalf / rIn)
  const arcWall = (sign: number) => {
    const shape = new THREE.Shape()
    if (sign > 0) {
      shape.moveTo(xOut, gapHalf)
      shape.absarc(0, 0, rOut, aOut, Math.PI - aOut, false)
      shape.lineTo(-xIn, gapHalf)
      shape.absarc(0, 0, rIn, Math.PI - aIn, aIn, true)
      shape.closePath()
    } else {
      shape.moveTo(-xOut, -gapHalf)
      shape.absarc(0, 0, rOut, Math.PI + aOut, 2 * Math.PI - aOut, false)
      shape.lineTo(xIn, -gapHalf)
      shape.absarc(0, 0, rIn, 2 * Math.PI - aIn, Math.PI + aIn, true)
      shape.closePath()
    }
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: slotDepth - bev,
      bevelEnabled: true,
      bevelThickness: bev,
      bevelSize: bev,
      bevelSegments: 2,
      curveSegments: 48,
    })
    geo.rotateX(-Math.PI / 2) // extrude runs up +Y
    const mesh = new THREE.Mesh(geo, body)
    mesh.rotation.y = Math.PI / 2 // ring arcs to ±X, slot notches along Z
    mesh.position.y = slotFloorY
    return mesh
  }
  product.add(arcWall(1), arcWall(-1))

  // --- dark stem bore in the cavity floor ---
  const bore = new THREE.Mesh(new THREE.CircleGeometry(0.06, 32), holeMat)
  bore.rotation.x = -Math.PI / 2
  bore.position.y = shoulderY + 0.002
  product.add(bore)

  // --- spring inside the cavity, tucked below the slot ledge (the refs show
  //     darkness there, not coils) ---
  const springRestH = 0.08
  const spring = createCoilMesh(0.075, springRestH, 4, 0.013, springMat)
  spring.position.y = shoulderY + 0.004
  product.add(spring)

  // --- poppet: black chamfered head recessed in the cavity + stem into the
  //     spring. Head top sits just below the ring plane. ---
  const headR2 = 0.14
  const poppetH = 0.15
  const poppet = new THREE.Group()
  const headProfile = [
    P(0.0001, 0),
    ...hard(headR2, 0),
    ...hard(headR2, poppetH - 0.02),
    ...hard(headR2 - 0.02, poppetH),
    P(0.0001, poppetH),
  ]
  poppet.add(new THREE.Mesh(makeLathe(headProfile, 64), poppetMat))
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 32), stemMat)
  stem.position.y = -0.08 + 0.004 // hangs below the head, into the spring
  poppet.add(stem)
  const poppetBaseY = topY - 0.2 // head underside at rest → head top 0.05 under the ring
  poppet.position.y = poppetBaseY
  product.add(poppet)

  // --- bright cross-pin ALONG the slot (axis Z): passes under the poppet head,
  //     ends seated in the ring notches, flush with the outer wall. From the
  //     front it reads end-on as a small circle, like the ref photos. ---
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 2 * bodyR + 0.024, 24), stemMat)
  pin.rotation.x = Math.PI / 2 // axis along Z, through the slot notches
  pin.position.y = topY - 0.215 // just under the head, just above the ledge; ends a hair proud
  product.add(pin)

  return {
    product,
    animate(t, motion) {
      // poppet lifts a touch to crack the valve open, then re-seats
      const open = motion ? (Math.sin(t * 1.5) * 0.5 + 0.5) * 0.05 : 0
      poppet.position.y = poppetBaseY + open
      spring.scale.y = (springRestH + open) / springRestH
    },
  }
}
