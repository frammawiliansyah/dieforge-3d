/**
 * Shared geometry helpers used across builders.
 * weldLatheSeam was duplicated per-builder upstream; it lives here once now.
 */
import * as THREE from 'three'

/**
 * LatheGeometry leaves a hard normal seam where the revolution closes (θ=0 == θ=2π).
 * Average the first/last column of normals so the seam disappears under shading.
 */
export function weldLatheSeam(geo: THREE.BufferGeometry, segments: number, points: number) {
  const n = geo.attributes.normal as THREE.BufferAttribute
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  for (let j = 0; j < points; j++) {
    const first = j
    const last = segments * points + j
    a.fromBufferAttribute(n, first)
    b.fromBufferAttribute(n, last)
    a.add(b).normalize()
    n.setXYZ(first, a.x, a.y, a.z)
    n.setXYZ(last, a.x, a.y, a.z)
  }
  n.needsUpdate = true
}

/** Build a revolved mesh-ready geometry with welded seam + smooth normals. */
export function makeLathe(points: THREE.Vector2[], segments = 128): THREE.LatheGeometry {
  const geo = new THREE.LatheGeometry(points, segments)
  geo.computeVertexNormals()
  weldLatheSeam(geo, segments, points.length)
  return geo
}

/** Circumradius (centre→vertex) of a regular hexagon given its across-flats width. */
export function hexCircumradius(acrossFlats: number): number {
  return acrossFlats / Math.sqrt(3)
}

/**
 * Regular hexagonal prism along +Y, centred at origin.
 * `acrossFlats` = wrench size (distance between opposite parallel faces).
 * flatToFront rotates a flat face toward +Z so heads read cleanly head-on.
 */
export function hexPrismGeometry(
  acrossFlats: number,
  height: number,
  flatToFront = true,
): THREE.CylinderGeometry {
  const R = hexCircumradius(acrossFlats)
  const geo = new THREE.CylinderGeometry(R, R, height, 6, 1, false)
  if (flatToFront) geo.rotateY(Math.PI / 6)
  return geo
}

/**
 * A recessed hex socket (Allen drive) — a dark hex prism sunk into a top face.
 * Returns a mesh positioned so its mouth sits at y=topY, opening downward.
 */
export function hexSocketRecess(
  acrossFlats: number,
  depth: number,
  topY: number,
  material: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(hexPrismGeometry(acrossFlats, depth, true), material)
  mesh.position.y = topY - depth / 2 + 0.001
  return mesh
}

/** A straight cross-drilled hole shown as a short dark cylinder (visual recess). */
export function crossHole(radius: number, length: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 24), material)
  mesh.rotation.z = Math.PI / 2
  return mesh
}

/** Positive modulo — JS `%` returns negatives for negative operands. */
function positiveMod(x: number, m: number): number {
  return ((x % m) + m) % m
}

/** Clamped smoothstep 0→1. */
function smooth01(t: number): number {
  const s = Math.min(1, Math.max(0, t))
  return s * s * (3 - 2 * s)
}

export interface ScrewThreadOptions {
  /** Minor (root) radius the thread rises from. */
  rootR: number
  /** Radial thread depth — crests reach rootR + depth. */
  depth: number
  /** Axial advance per turn. */
  pitch: number
  /** Total axial span, y ∈ [0, length]; caller positions the mesh. */
  length: number
  /** Columns around the circumference (default 128). */
  radialSegments?: number
  /** Grid rows per pitch (default 12). */
  stepsPerPitch?: number
  /** Thread depth fades in/out over this many turns at each end (default 0.7). */
  fadeTurns?: number
  /** Fraction of the pitch left flat at the crest (default 0.125). */
  crestFlat?: number
  /** Fraction of the pitch left flat at the root (default 0.25). */
  rootFlat?: number
}

/**
 * A machined-looking helical V-thread: a displaced-grid cylinder whose radius
 * follows a trapezoidal thread profile sweeping helically at `pitch`. Unlike
 * helicalThreadMesh (a round wire riding on the root cylinder) this gives
 * straight flanks and crisp crests, so screws read as machined hardware both
 * in renders and in GLB (where bump maps don't survive export).
 * Depth ramps to zero over `fadeTurns` at both ends (thread run-in/run-out),
 * so the open end rings sit exactly at rootR — lay them over a body lathe
 * whose root cylinder is ~0.002 below rootR to avoid z-fighting.
 * Column-major vertex layout (LatheGeometry-compatible), so weldLatheSeam
 * removes the θ-seam crease.
 */
export function screwThreadGeometry(opts: ScrewThreadOptions): THREE.BufferGeometry {
  const {
    rootR,
    depth,
    pitch,
    length,
    radialSegments = 128,
    stepsPerPitch = 12,
    fadeTurns = 0.7,
    crestFlat = 0.125,
    rootFlat = 0.25,
  } = opts

  const rows = Math.max(2, Math.ceil((length / pitch) * stepsPerPitch)) + 1
  const cols = radialSegments + 1 // duplicated seam column, like LatheGeometry
  const rise = Math.max(0.001, (1 - crestFlat - rootFlat) / 2)
  const fadeSpan = Math.max(1e-6, fadeTurns * pitch)

  // Trapezoid wave over one pitch; the root flat straddles frac 0/1 so
  // profile(0) === profile(1) and the θ-seam lands mid-root-flat.
  const halfRoot = rootFlat / 2
  const profile = (t: number): number => {
    if (t < halfRoot) return 0
    if (t < halfRoot + rise) return (t - halfRoot) / rise
    if (t < halfRoot + rise + crestFlat) return 1
    if (t < 1 - halfRoot) return 1 - (t - (halfRoot + rise + crestFlat)) / rise
    return 0
  }

  const positions = new Float32Array(cols * rows * 3)
  const uvs = new Float32Array(cols * rows * 2)
  for (let i = 0; i < cols; i++) {
    const u = i / radialSegments
    const phi = u * Math.PI * 2
    const sin = Math.sin(phi)
    const cos = Math.cos(phi)
    for (let j = 0; j < rows; j++) {
      const v = j / (rows - 1)
      const y = v * length
      const fade = smooth01(y / fadeSpan) * smooth01((length - y) / fadeSpan)
      const r = rootR + depth * fade * profile(positiveMod(y / pitch - u, 1))
      const k = i * rows + j
      positions[k * 3] = sin * r
      positions[k * 3 + 1] = y
      positions[k * 3 + 2] = cos * r
      uvs[k * 2] = u
      uvs[k * 2 + 1] = v
    }
  }

  const indices: number[] = []
  for (let i = 0; i < radialSegments; i++) {
    for (let j = 0; j < rows - 1; j++) {
      const a = i * rows + j
      const b = (i + 1) * rows + j
      const c = (i + 1) * rows + j + 1
      const d = i * rows + j + 1
      indices.push(a, b, d, b, c, d)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  weldLatheSeam(geo, radialSegments, rows)
  return geo
}

/**
 * Straight (axial) knurling as geometry: an open cylinder band whose radius is
 * a triangle wave around θ — `teeth` fine ridges with crests at `radius` and
 * grooves cut `depth` inward. Spans y ∈ [0, height]; caller positions it just
 * proud of the smooth wall it decorates (groove floor above the wall radius).
 */
export function straightKnurlGeometry(
  radius: number,
  depth: number,
  height: number,
  teeth = 72,
  colsPerTooth = 4,
): THREE.BufferGeometry {
  const radialSegments = teeth * colsPerTooth
  const cols = radialSegments + 1
  const rows = 2
  const positions = new Float32Array(cols * rows * 3)
  const uvs = new Float32Array(cols * rows * 2)
  for (let i = 0; i < cols; i++) {
    const u = i / radialSegments
    const phi = u * Math.PI * 2
    const ft = positiveMod(u * teeth, 1)
    const tri = 1 - 2 * Math.abs(ft - 0.5)
    const r = radius - depth * (1 - tri)
    const sin = Math.sin(phi)
    const cos = Math.cos(phi)
    for (let j = 0; j < rows; j++) {
      const k = i * rows + j
      positions[k * 3] = sin * r
      positions[k * 3 + 1] = j * height
      positions[k * 3 + 2] = cos * r
      uvs[k * 2] = u
      uvs[k * 2 + 1] = j
    }
  }
  const indices: number[] = []
  for (let i = 0; i < radialSegments; i++) {
    const a = i * rows
    const b = (i + 1) * rows
    indices.push(a, b, a + 1, b, b + 1, a + 1)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  weldLatheSeam(geo, radialSegments, rows)
  return geo
}

/**
 * A real helical screw thread: a thin tube swept along a helix that rides on a
 * root cylinder of radius `rRoot` (which the caller provides, e.g. as part of the
 * body lathe). The crest reaches ~rRoot + threadH. This reads as a proper spiral
 * thread instead of a stack of concentric sawtooth rings. Centred at y=0,
 * spanning ±length/2; the open tube ends should be tucked inside the body.
 */
export function helicalThreadMesh(
  rRoot: number,
  threadH: number,
  length: number,
  pitch: number,
  material: THREE.Material,
  segPerTurn = 30,
): THREE.Mesh {
  const wireR = threadH * 0.6
  const rHelix = rRoot + threadH * 0.34 // tube straddles the root surface
  const turns = Math.max(1, length / pitch)
  const segs = Math.max(64, Math.ceil(turns * segPerTurn))
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    const a = t * turns * Math.PI * 2
    pts.push(
      new THREE.Vector3(Math.cos(a) * rHelix, -length / 2 + t * length, Math.sin(a) * rHelix),
    )
  }
  const curve = new THREE.CatmullRomCurve3(pts)
  return new THREE.Mesh(new THREE.TubeGeometry(curve, segs, wireR, 10, false), material)
}
