import * as THREE from 'three'
import { makeNoiseTexture } from './viewer'

/** PBR material palette — see STANDARDS.md */
export function createMaterials() {
  const castNoise = makeNoiseTexture({ base: '#3a3a40', amount: 42, dots: 22000 })
  castNoise.repeat.set(5, 5)

  const castIron = new THREE.MeshPhysicalMaterial({
    color: 0x2b2b31,
    metalness: 0.28,
    roughness: 0.9,
    bumpMap: castNoise,
    bumpScale: 0.05, // pebbly sand-cast grain (ref flanges are visibly rough)
  })
  const smoothBlack = new THREE.MeshPhysicalMaterial({
    color: 0x1b1b21,
    metalness: 0.35,
    roughness: 0.48,
    envMapIntensity: 0.65,
  })
  /** Ref: fasteners/primary.jpg — ground groove band: same steel tone, matte (not a black stripe) */
  const matteBand = new THREE.MeshPhysicalMaterial({
    color: 0x6f757d,
    metalness: 0.55,
    roughness: 0.72,
    envMapIntensity: 0.5,
  })
  const interior = new THREE.MeshPhysicalMaterial({
    color: 0x141418,
    metalness: 0.3,
    roughness: 0.55,
    envMapIntensity: 0.45,
    side: THREE.DoubleSide,
  })
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x070709,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
  })
  const chrome = new THREE.MeshPhysicalMaterial({
    color: 0xd6dae2,
    metalness: 1.0,
    roughness: 0.08,
    envMapIntensity: 1.3,
    clearcoat: 0.7,
    clearcoatRoughness: 0.06,
  })
  const cageMetal = new THREE.MeshPhysicalMaterial({
    color: 0xb0b6be,
    metalness: 0.95,
    roughness: 0.24,
    envMapIntensity: 1.0,
  })
  const springWire = new THREE.MeshPhysicalMaterial({
    color: 0x24242b,
    metalness: 0.55,
    roughness: 0.5,
    envMapIntensity: 0.4,
  })
  /** Ref: fasteners/primary.jpg — ground bushing shell: medium satin steel, not glossy white */
  const steel = new THREE.MeshPhysicalMaterial({
    color: 0x8b9099,
    metalness: 0.72,
    roughness: 0.52,
    envMapIntensity: 0.4,
  })
  /**
   * Ref: pins / punches / ejector-pins — bright *ground* steel: satin, axial brush.
   * Higher roughness + lower envMap kills the dark mirror banding so it reads as
   * brushed bar stock (the refs are bright but matte, never liquid chrome).
   */
  const polishedSteel = new THREE.MeshPhysicalMaterial({
    color: 0xcdd1d7,
    metalness: 0.9,
    roughness: 0.36,
    envMapIntensity: 0.62,
    clearcoat: 0.1,
    clearcoatRoughness: 0.4,
  })
  /** Ref: plugs / locking head — black-oxide hardware: dark, low-sheen */
  const blackOxide = new THREE.MeshPhysicalMaterial({
    color: 0x191a1f,
    metalness: 0.6,
    roughness: 0.52,
    envMapIntensity: 0.55,
  })
  const sleeveOrange = new THREE.MeshPhysicalMaterial({
    color: 0xd4622a,
    metalness: 0.06,
    roughness: 0.58,
    envMapIntensity: 0.32,
  })
  /** Ref: springs/primary.jpg — muted salmon polyurethane stripper spring (matte, faintly translucent) */
  const urethane = new THREE.MeshPhysicalMaterial({
    color: 0xbb6646,
    metalness: 0,
    roughness: 0.66,
    transmission: 0.08,
    thickness: 0.4,
    clearcoat: 0.08,
    clearcoatRoughness: 0.5,
    envMapIntensity: 0.22,
  })
  /** Ref: abrasives/primary.jpg — XEBEC ceramic fiber stone */
  const ceramicStone = new THREE.MeshPhysicalMaterial({
    color: 0x3d4450,
    metalness: 0.05,
    roughness: 0.88,
    envMapIntensity: 0.2,
  })

  return {
    castIron,
    smoothBlack,
    matteBand,
    interior,
    holeMat,
    chrome,
    cageMetal,
    springWire,
    steel,
    polishedSteel,
    blackOxide,
    sleeveOrange,
    urethane,
    ceramicStone,
  }
}

/** Bright satin steel — matches catalog photo thumbnails (SUJ2 pins). */
export function createCatalogPolishedSteel(bumpScale = 0.0028) {
  const steel = new THREE.MeshPhysicalMaterial({
    color: 0xedf0f4,
    metalness: 0.93,
    roughness: 0.16,
    envMapIntensity: 1.08,
    clearcoat: 0.42,
    clearcoatRoughness: 0.1,
  })
  steel.bumpMap = createMachiningBump()
  steel.bumpScale = bumpScale
  return steel
}

/** Pin body steel — catalog photo look vs default studio look. */
export function resolvePinSteel(catalogLook: boolean | undefined, bumpScale: number) {
  if (catalogLook) {
    return createCatalogPolishedSteel(bumpScale * 0.82)
  }
  const { polishedSteel } = createMaterials()
  const steel = polishedSteel.clone()
  steel.bumpMap = createMachiningBump()
  steel.bumpScale = bumpScale
  return steel
}

export function resolvePinInterior(catalogLook: boolean | undefined) {
  const { interior } = createMaterials()
  if (!catalogLook) return interior
  const mat = interior.clone()
  mat.color.setHex(0x3d434c)
  mat.roughness = 0.48
  mat.envMapIntensity = 0.55
  return mat
}

/** Hardened punch tip — matte black-oxide cap matching catalog photos. */
export function resolvePunchHead(catalogLook: boolean | undefined) {
  const { blackOxide } = createMaterials()
  const head = blackOxide.clone()
  if (catalogLook) {
    head.color.setHex(0x101114)
    head.metalness = 0.52
    head.roughness = 0.62
    head.envMapIntensity = 0.28
  }
  return head
}

/** Center recess on punch head top face. */
export function resolvePunchRecess(catalogLook: boolean | undefined) {
  const { holeMat } = createMaterials()
  if (!catalogLook) return holeMat
  const mat = holeMat.clone()
  mat.color.setHex(0x040406)
  return mat
}

/** Bright chrome bushing shell — matches headed/plain bush catalog photos. */
export function resolveBushSteel(catalogLook: boolean | undefined) {
  if (!catalogLook) return resolvePinSteel(false, 0.0032)
  const steel = createCatalogPolishedSteel(0.0018)
  steel.color.setHex(0xf2f4f7)
  steel.roughness = 0.09
  steel.metalness = 0.96
  steel.envMapIntensity = 1.28
  steel.clearcoat = 0.58
  steel.clearcoatRoughness = 0.06
  return steel
}

/** Thin oil-groove ring on guide bush body. */
export function resolveBushGroove(catalogLook: boolean | undefined) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: catalogLook ? 0x0a0b0d : 0x6f757d,
    metalness: 0.15,
    roughness: catalogLook ? 0.95 : 0.72,
    envMapIntensity: catalogLook ? 0.05 : 0.45,
  })
  return mat
}

/**
 * Sawtooth radial profile for LatheGeometry — turns into a surface of revolution
 * that reads as external machine threads (concentric, cheap, convincing from any angle).
 * Returns Vector2[] from y=0 (bottom) to y=len (top), closed flat at both ends.
 */
export function threadProfile(len: number, rCrest: number, depth: number, pitch: number) {
  const pts: THREE.Vector2[] = []
  const root = rCrest - depth
  const teeth = Math.max(3, Math.round(len / pitch))
  pts.push(new THREE.Vector2(0.0001, 0))
  pts.push(new THREE.Vector2(root, 0))
  for (let i = 0; i < teeth; i++) {
    const y0 = (i / teeth) * len
    pts.push(new THREE.Vector2(rCrest, y0 + (len / teeth) * 0.45))
    pts.push(new THREE.Vector2(root, y0 + len / teeth))
  }
  pts.push(new THREE.Vector2(0.0001, len))
  return pts
}

export function createThreadBump(repeatY = 5) {
  const threadCanvas = document.createElement('canvas')
  threadCanvas.width = 64
  threadCanvas.height = 256
  const tctx = threadCanvas.getContext('2d')!
  tctx.fillStyle = '#808080'
  tctx.fillRect(0, 0, 64, 256)
  for (let y = 0; y < 256; y += 3) {
    const shift = (y * 0.22) % 64
    for (let x = 0; x < 64; x += 2) {
      const v = 108 + (((x + shift) % 10) < 5 ? 18 : 0)
      tctx.fillStyle = `rgb(${v},${v},${v})`
      tctx.fillRect(x, y, 2, 2)
    }
  }
  const tex = new THREE.CanvasTexture(threadCanvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, repeatY)
  return tex
}

export function createCoilMesh(
  radius: number,
  height: number,
  turns: number,
  wireR: number,
  material: THREE.Material,
) {
  const pts: THREE.Vector3[] = []
  const segs = turns * 40
  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    const a = t * turns * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(a) * radius, t * height, Math.sin(a) * radius))
  }
  const curve = new THREE.CatmullRomCurve3(pts)
  return new THREE.Mesh(new THREE.TubeGeometry(curve, segs, wireR, 8, false), material)
}

export function createGrooveBump(size = 512) {
  const bumpCanvas = document.createElement('canvas')
  bumpCanvas.width = bumpCanvas.height = size
  const bctx = bumpCanvas.getContext('2d')!
  const cx = size / 2
  const cy = size / 2
  bctx.fillStyle = '#808080'
  bctx.fillRect(0, 0, size, size)
  for (let r = 18; r < size / 2 - 4; r += 2.5) {
    const wave = Math.sin(r * 0.22) * 0.5 + 0.5
    const bv = Math.floor(118 + wave * 22)
    bctx.strokeStyle = `rgb(${bv}, ${bv}, ${bv})`
    bctx.lineWidth = 1
    bctx.beginPath()
    bctx.arc(cx, cy, r, 0, Math.PI * 2)
    bctx.stroke()
  }
  return new THREE.CanvasTexture(bumpCanvas)
}

export function createMachiningBump() {
  const machCanvas = document.createElement('canvas')
  machCanvas.width = 256
  machCanvas.height = 64
  const mctx = machCanvas.getContext('2d')!
  mctx.fillStyle = '#808080'
  mctx.fillRect(0, 0, 256, 64)
  for (let i = 0; i < 256; i += 2) {
    const v = 120 + Math.random() * 16
    mctx.fillStyle = `rgb(${v},${v},${v})`
    mctx.fillRect(i, 0, 1, 64)
  }
  const tex = new THREE.CanvasTexture(machCanvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 8)
  return tex
}

export function createCeramicGrainBump() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#4a5058'
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 6000; i++) {
    const v = 60 + Math.random() * 40
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 2)
  return tex
}

export function hollowCylinder(
  outerR: number,
  innerR: number,
  height: number,
  material: THREE.Material,
  segments = 64,
) {
  const shape = new THREE.Shape()
  shape.absarc(0, 0, outerR, 0, Math.PI * 2, false)
  const hole = new THREE.Path()
  hole.absarc(0, 0, innerR, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: segments,
  })
  geo.translate(0, 0, -height / 2)
  geo.rotateX(Math.PI / 2)
  return new THREE.Mesh(geo, material)
}
