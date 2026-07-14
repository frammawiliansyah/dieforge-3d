/**
 * Baut L — socket head cap screw (DIN 912 / ISO 4762), M8×30 proportions.
 * Cylindrical head with a straight-knurled side band and hex (Allen) socket,
 * partially threaded shank with a machined-profile helical V-thread.
 * Black-oxide 12.9 finish.
 * Ref: alentafastener.com "baut L socket cap screw grade 8.8/12.9" photo.
 */
import * as THREE from 'three'
import {
  hexCircumradius,
  hexSocketRecess,
  makeLathe,
  screwThreadGeometry,
  straightKnurlGeometry,
} from '../geometry'
import { createMaterials } from '../materials'
import type { MotionBuildParams, ProductAssembly } from '../types'

const MM = 0.05

export function buildBautLProduct(_params?: MotionBuildParams): ProductAssembly {
  const { blackOxide, holeMat } = createMaterials()
  const metal = blackOxide.clone()
  metal.color.setHex(0x1f2127)
  metal.roughness = 0.35
  metal.metalness = 0.8
  metal.envMapIntensity = 0.85
  metal.clearcoat = 0.12 // lightly-oiled 12.9 black-oxide sheen
  metal.clearcoatRoughness = 0.3

  const shaftR = (8 / 2) * MM // M8 → 0.2
  const shaftLen = 30 * MM // 1.5
  const headR = (13 / 2) * MM // 0.325
  const headH = 8 * MM // 0.4

  const pitch = 1.25 * MM // M8×1.25
  const depth = 0.61 * pitch // ISO metric thread depth
  const gridRoot = shaftR - depth // thread root; crests come out flush with shank OD
  const latheRoot = gridRoot - 0.002 // lathe tucked under the thread grid (no z-fight)
  const tipCham = shaftR * 0.26
  const threadTopY = shaftLen * 0.72
  const runOut = pitch * 1.2 // root rises to the shank OD over the thread run-out

  // shaft: chamfered tip → root cylinder under the thread → run-out cone →
  // smooth shank → small flare into the head (under-head fillet)
  const shaftProfile = [
    new THREE.Vector2(0.0001, 0),
    new THREE.Vector2(gridRoot - tipCham * 0.4, 0),
    new THREE.Vector2(latheRoot, tipCham),
    new THREE.Vector2(latheRoot, threadTopY - runOut),
    new THREE.Vector2(shaftR, threadTopY),
    new THREE.Vector2(shaftR, shaftLen - 0.03),
    new THREE.Vector2(shaftR + 0.016, shaftLen),
    new THREE.Vector2(0.0001, shaftLen),
  ]
  const shaftMesh = new THREE.Mesh(makeLathe(shaftProfile, 96), metal)

  // machined V-thread: run-in just above the tip chamfer, run-out sinking
  // into the cone below threadTopY
  const tStart = tipCham * 0.95
  const tEnd = threadTopY - runOut * 0.2
  const thread = new THREE.Mesh(
    screwThreadGeometry({
      rootR: gridRoot,
      depth,
      pitch,
      length: tEnd - tStart,
      fadeTurns: 0.6,
    }),
    metal,
  )
  thread.position.y = tStart

  // head: chamfered cylinder + knurled side band + socket counterbore
  const headBot = shaftLen
  const headTop = shaftLen + headH
  const hcham = headR * 0.12
  const bcham = 0.018
  const sockAF = 6 * MM // DIN 912 M8 → 6 mm key
  const sockR = hexCircumradius(sockAF) // hex corners touch the counterbore wall
  const sockDepth = headH * 0.6
  const mcham = 0.02 // socket-mouth chamfer
  const head = [
    new THREE.Vector2(0.0001, headBot),
    new THREE.Vector2(headR - bcham, headBot),
    new THREE.Vector2(headR, headBot + bcham),
    new THREE.Vector2(headR, headTop - hcham),
    new THREE.Vector2(headR - hcham, headTop),
    new THREE.Vector2(sockR + mcham, headTop),
    new THREE.Vector2(sockR, headTop - mcham),
    new THREE.Vector2(sockR, headTop - sockDepth),
    new THREE.Vector2(0.0001, headTop - sockDepth),
  ]
  const headMesh = new THREE.Mesh(makeLathe(head, 96), metal)

  const kDepth = 0.0065
  const bandBot = headBot + bcham + 0.012
  const bandTop = headTop - hcham - 0.012
  const knurl = new THREE.Mesh(
    straightKnurlGeometry(headR + 0.001 + kDepth, kDepth, bandTop - bandBot, 84),
    metal,
  )
  knurl.position.y = bandBot

  const socket = hexSocketRecess(sockAF, sockDepth - mcham, headTop - mcham + 0.002, holeMat)

  const body = new THREE.Group()
  body.add(shaftMesh, thread, headMesh, knurl, socket)
  body.position.y = -headTop / 2

  const product = new THREE.Group()
  product.name = 'baut-l'
  product.add(body)

  return {
    product,
    animate(t, motion) {
      product.rotation.y = motion ? t * 0.5 : 0
    },
  }
}
