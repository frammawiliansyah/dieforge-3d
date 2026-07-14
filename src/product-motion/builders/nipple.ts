/**
 * Nipple — brass hex double nipple pipe fitting (male–male adapter).
 * A HOLLOW brass fitting: two externally-threaded ends around a chunky hex
 * wrench collar; the top end shows the open bore with a bright inner wall and
 * dark depth; the bottom end carries a smooth pilot band under its threads.
 * Aged satin brass.
 * Ref: bigcommerce 731BR product photo.
 */
import * as THREE from 'three'
import { hexPrismGeometry, makeLathe, screwThreadGeometry } from '../geometry'
import { createMaterials } from '../materials'
import type { MotionBuildParams, ProductAssembly } from '../types'

export function buildNippleProduct(_params?: MotionBuildParams): ProductAssembly {
  const { holeMat } = createMaterials()
  const brass = new THREE.MeshPhysicalMaterial({
    color: 0xa98b52, // aged satin brass — muted warm, not glossy gold
    metalness: 1.0,
    roughness: 0.42,
    envMapIntensity: 0.7,
  })

  const crestR = 0.31 // thread OD — the fitting is chunky, nearly as wide as tall
  const depth = 0.022 // fine pipe-thread depth
  const pitch = 0.036
  const root = crestR - depth
  const latheR = root - 0.002 // lathe tucked under the thread grids
  const boreR = 0.24 // through-bore (thin pipe wall like the photo)
  const bandH = 0.09 // smooth pilot band at the bottom end
  const hexBot = 0.3
  const hexTop = 0.49
  const total = 0.84
  const hexAF = 0.72

  const P = (x: number, y: number) => new THREE.Vector2(x, y)
  const hard = (x: number, y: number) => [P(x, y), P(x, y)]

  // --- one revolved body: bottom bore mouth → smooth band → lower thread root
  //     → (hidden behind the hex) → upper thread root → top face → open bore ---
  const profile = [
    P(boreR, 0.07),
    ...hard(boreR, 0),
    ...hard(crestR - 0.02, 0),
    ...hard(crestR, 0.02),
    ...hard(crestR, bandH),
    ...hard(latheR, bandH + 0.012),
    P(latheR, total - 0.012),
    ...hard(latheR, total),
    ...hard(boreR + 0.012, total),
    ...hard(boreR, total - 0.014),
    P(boreR, 0.38),
    P(0.0001, 0.38),
  ]
  const bodyMesh = new THREE.Mesh(makeLathe(profile, 96), brass)

  // --- external threads on both ends (fine machined Vs, crisp crests) ---
  const lowerThread = new THREE.Mesh(
    screwThreadGeometry({
      rootR: root,
      depth,
      pitch,
      length: hexBot - bandH - 0.03,
      fadeTurns: 0.5,
    }),
    brass,
  )
  lowerThread.position.y = bandH + 0.015

  const upperThread = new THREE.Mesh(
    screwThreadGeometry({
      rootR: root,
      depth,
      pitch,
      length: total - hexTop - 0.06,
      fadeTurns: 0.5,
    }),
    brass,
  )
  upperThread.position.y = hexTop + 0.015

  // --- chunky hex wrench collar (flat facet normals) ---
  const hexGeo = hexPrismGeometry(hexAF, hexTop - hexBot).toNonIndexed()
  hexGeo.computeVertexNormals()
  const hexMesh = new THREE.Mesh(hexGeo, brass)
  hexMesh.position.y = (hexBot + hexTop) / 2

  // --- bore depth shadows: dark floor inside the top bore, dark cap at the
  //     bottom mouth ---
  const topShadow = new THREE.Mesh(new THREE.CircleGeometry(boreR * 0.99, 40), holeMat)
  topShadow.rotation.x = -Math.PI / 2
  topShadow.position.y = 0.385
  const botShadow = new THREE.Mesh(new THREE.CircleGeometry(boreR * 0.99, 40), holeMat)
  botShadow.rotation.x = Math.PI / 2
  botShadow.position.y = 0.065

  const body = new THREE.Group()
  body.add(bodyMesh, lowerThread, upperThread, hexMesh, topShadow, botShadow)
  body.position.y = -total / 2

  const product = new THREE.Group()
  product.name = 'nipple'
  product.add(body)

  return {
    product,
    animate(t, motion) {
      product.rotation.y = motion ? t * 0.5 : 0
    },
  }
}
