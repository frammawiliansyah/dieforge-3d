/**
 * JIS B5012 mold die coil spring — flat rectangular wire, open hollow ends,
 * color-coded load rating (Per Putih/Kuning/Biru/Merah).
 */
import * as THREE from 'three'
import { parsePinVariantSize } from '../parse-variant-size'
import type { MotionBuildParams, ProductAssembly } from '../types'

const MM = 0.05

export type CoilSpringColor = 'putih' | 'kuning' | 'biru' | 'merah'

// deep bases — the matte paint shows these as diffuse under the bright
// catalog lights, so they are darker than the perceived colors
const COLOR_HEX: Record<CoilSpringColor, number> = {
  putih: 0xd4d7db,
  kuning: 0xdc9f08,
  biru: 0x16409e,
  merah: 0x8e0e14,
}

const DEFAULT_OD = 10
const DEFAULT_LEN = 30

/** Catalog mesh matched to product photos (~10 coils, flat wire, open ends). */
const CATALOG = {
  outerR: 0.2,
  height: 0.65,
  coils: 10,
  wireRadial: 0.052,
  wireAxial: 0.019,
}

export function buildCoilSpringProduct(
  params: MotionBuildParams | undefined,
  color: CoilSpringColor,
): ProductAssembly {
  const parsed = parsePinVariantSize(params?.variantSize)
  const od = parsed?.d1 ?? DEFAULT_OD
  const len = parsed?.L ?? DEFAULT_LEN
  return buildCoilSpringForSize(od, len, color, params?.catalogLook)
}

function resolveDieSpringPaint(catalogLook: boolean | undefined, color: CoilSpringColor) {
  // powder-coat / enamel paint — matte with a slight sheen, NOT glossy metal
  return new THREE.MeshPhysicalMaterial({
    color: COLOR_HEX[color],
    metalness: 0.15,
    roughness: catalogLook ? 0.55 : 0.6,
    envMapIntensity: 0.45,
    clearcoat: 0.12,
    clearcoatRoughness: 0.5,
  })
}

interface SpringDims {
  coilR: number
  height: number
  coils: number
  wireRadial: number
  wireAxial: number
  pitch: number
}

function resolveSpringDims(od: number, len: number, catalogLook?: boolean): SpringDims {
  if (catalogLook) {
    const { outerR, height, coils, wireRadial, wireAxial } = CATALOG
    const coilR = outerR - wireRadial / 2
    return { coilR, height, coils, wireRadial, wireAxial, pitch: height / coils }
  }

  const outerR = (od / 2) * MM
  const wireRadial = Math.max(outerR * 0.38, 0.038)
  const wireAxial = Math.max(outerR * 0.11, 0.014)
  const coilR = Math.max(outerR - wireRadial / 2, wireAxial * 1.4)
  const height = len * MM
  const pitch = wireAxial * 2.4
  const coils = THREE.MathUtils.clamp(Math.round(height / pitch), 6, 12)
  return { coilR, height, coils, wireRadial, wireAxial, pitch: height / coils }
}

class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private coilR: number,
    private height: number,
    private coils: number,
  ) {
    super()
  }

  override getPoint(t: number, target = new THREE.Vector3()) {
    const angle = t * this.coils * Math.PI * 2
    return target.set(Math.cos(angle) * this.coilR, t * this.height, Math.sin(angle) * this.coilR)
  }
}

/**
 * Continuous rectangular wire swept along a helix — one smooth mesh, no end caps.
 * Profile: wide face radial (outward), thin face axial (pitch direction).
 */
function buildRectProfileHelixGeometry(dims: SpringDims): THREE.BufferGeometry {
  const { coilR, height, coils, wireRadial, wireAxial } = dims
  const halfR = wireRadial / 2
  const halfA = wireAxial / 2
  const segs = Math.max(120, Math.round(coils * 40))
  const curve = new HelixCurve(coilR, height, coils)

  const positions: number[] = []
  const indices: number[] = []
  const ringStarts: number[] = []

  const p = new THREE.Vector3()
  const pNext = new THREE.Vector3()
  const tangent = new THREE.Vector3()
  const radial = new THREE.Vector3()
  const binormal = new THREE.Vector3()
  const outward = new THREE.Vector3()
  const corner = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)

  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    curve.getPoint(t, p)
    curve.getPoint(Math.min(1, t + 1 / segs), pNext)
    tangent.copy(pNext).sub(p).normalize()

    // Keep wide wire face radial-outward; thin face follows pitch (minimal twist).
    radial.crossVectors(up, tangent).normalize()
    outward.set(p.x, 0, p.z)
    if (outward.lengthSq() > 1e-10 && radial.dot(outward) < 0) radial.negate()
    binormal.crossVectors(tangent, radial).normalize()

    ringStarts.push(positions.length / 3)

    // Outer-top, inner-top, inner-bottom, outer-bottom (CCW from outside).
    // Each corner is pushed once per adjacent FACE (8 verts/ring) so the
    // rectangular wire keeps hard edges instead of smoothing into a tube.
    const offsets = [
      [halfR, halfA],
      [-halfR, halfA],
      [-halfR, -halfA],
      [halfR, -halfA],
    ] as const

    for (let f = 0; f < 4; f++) {
      for (const [dr, da] of [offsets[f], offsets[(f + 1) % 4]]) {
        corner
          .copy(p)
          .addScaledVector(radial, dr)
          .addScaledVector(binormal, da)
        positions.push(corner.x, corner.y, corner.z)
      }
    }
  }

  for (let i = 0; i < segs; i++) {
    const a = ringStarts[i]
    const b = ringStarts[i + 1]
    for (let f = 0; f < 4; f++) {
      const j = 2 * f
      indices.push(a + j, a + j + 1, b + j + 1, a + j, b + j + 1, b + j)
    }
  }

  // flat caps closing the wire's open cross-sections at both coil ends
  const firstRing = ringStarts[0]
  const lastRing = ringStarts[segs]
  // corner order around the profile via face starts: 0,2,4,6 = the 4 corners
  indices.push(firstRing, firstRing + 2, firstRing + 4, firstRing, firstRing + 4, firstRing + 6)
  indices.push(lastRing, lastRing + 4, lastRing + 2, lastRing, lastRing + 6, lastRing + 4)

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

function buildDieSpringBody(dims: SpringDims, material: THREE.Material): THREE.Group {
  const { height } = dims
  const group = new THREE.Group()
  const coil = new THREE.Mesh(buildRectProfileHelixGeometry(dims), material)
  group.add(coil)
  group.position.y = -height / 2
  return group
}

function buildCoilSpringForSize(
  od: number,
  len: number,
  color: CoilSpringColor,
  catalogLook?: boolean,
): ProductAssembly {
  const mat = resolveDieSpringPaint(catalogLook, color)
  const dims = resolveSpringDims(od, len, catalogLook)

  const product = new THREE.Group()
  product.name = `coil-spring-${color}`
  product.add(buildDieSpringBody(dims, mat))

  const { height } = dims
  return {
    product,
    animate(t, motion) {
      if (!motion) {
        product.scale.y = 1
        product.position.y = 0
        return
      }
      const squash = (Math.sin(t * 1.4) * 0.5 + 0.5) * 0.1
      product.scale.y = 1 - squash
      product.position.y = squash * height * 0.06
    },
  }
}
