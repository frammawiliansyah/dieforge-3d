/**
 * T-slot nut (DIN 508) — matched to the MISUMI catalog photo: a compact,
 * near-square black-oxide block. WIDE base slab at the bottom (rides in the
 * slot), narrower boss on top carrying a BIG threaded hole with clearly
 * visible internal threads and a chamfered mouth.
 * Built as two vertical extrusions (base + bossed slab with a REAL circular
 * hole) so the bore is genuinely open; the extrude bevel chamfers the top
 * edges and the hole mouth in one go.
 */
import * as THREE from 'three'
import { screwThreadGeometry } from '../geometry'
import { createMaterials } from '../materials'
import type { MotionBuildParams, ProductAssembly } from '../types'

export function buildTSlotNutProduct(_params?: MotionBuildParams): ProductAssembly {
  const { blackOxide, holeMat } = createMaterials()

  const metal = blackOxide.clone() // worn black-oxide body
  metal.color.setHex(0x26272d)
  metal.roughness = 0.52
  metal.envMapIntensity = 0.55

  // internal thread lining — mid-dark steel so the ridges read without blowing out
  const threadMat = blackOxide.clone()
  threadMat.color.setHex(0x5c6167)
  threadMat.metalness = 0.8
  threadMat.roughness = 0.48
  threadMat.envMapIntensity = 0.38
  threadMat.side = THREE.BackSide

  // --- compact near-square proportions traced from the photo ---
  const baseW = 1.0 // across the slot
  const L = 0.95 // along the slot (nearly square in plan)
  const baseH = 0.3
  const bossW = 0.66
  const bossH = 0.5
  const boreR = 0.155 // big tapped hole ≈ 46% of the boss width
  const bev = 0.018
  const totalH = baseH + bossH

  // vertical extrusion helper: shape in XZ, extruded up +Y with chamfer bevel
  const slab = (w: number, l: number, h: number, hole?: number) => {
    const shape = new THREE.Shape()
    shape.moveTo(-w / 2, -l / 2)
    shape.lineTo(w / 2, -l / 2)
    shape.lineTo(w / 2, l / 2)
    shape.lineTo(-w / 2, l / 2)
    shape.closePath()
    if (hole) {
      const path = new THREE.Path()
      path.absarc(0, 0, hole, 0, Math.PI * 2, true)
      shape.holes.push(path)
    }
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: h - 2 * bev,
      bevelEnabled: true,
      bevelThickness: bev,
      bevelSize: bev,
      bevelSegments: 2,
      curveSegments: 40,
    })
    geo.rotateX(-Math.PI / 2) // extrude runs up +Y, spans [-bev, h - bev]
    return geo
  }

  const base = new THREE.Mesh(slab(baseW - 2 * bev, L - 2 * bev, baseH), metal)
  base.position.y = bev
  const boss = new THREE.Mesh(slab(bossW - 2 * bev, L - 2 * bev, bossH, boreR + bev), metal)
  boss.position.y = baseH + bev

  // internal thread lining the bore (negative depth → crests point inward;
  // viewed from inside via BackSide)
  // root sits just behind the extrude's widest hole wall (the bevel bulges the
  // hole to boreR+bev mid-depth), so no gap ring lets light hit the base slab
  const threadLen = bossH + 0.1
  const thread = new THREE.Mesh(
    screwThreadGeometry({
      rootR: boreR + bev + 0.001,
      depth: -0.035,
      pitch: 0.062,
      length: threadLen,
      radialSegments: 80,
      stepsPerPitch: 10,
      fadeTurns: 0.15, // full crests almost to the mouth, like the photo
      crestFlat: 0.15,
      rootFlat: 0.2,
    }),
    threadMat,
  )
  thread.position.y = totalH - threadLen - 0.004

  // dark floor at the thread lining's open bottom — wide enough to blank out
  // the lit base slab under the hole
  const floor = new THREE.Mesh(new THREE.CircleGeometry(boreR + bev + 0.002, 40), holeMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = totalH - threadLen - 0.002

  const body = new THREE.Group()
  body.add(base, boss, thread, floor)
  body.position.y = -totalH / 2

  const product = new THREE.Group()
  product.name = 't-slot-nut'
  product.add(body)

  return {
    product,
    animate(t, motion) {
      product.position.y = motion ? Math.sin(t * 0.9) * 0.008 : 0
    },
  }
}
