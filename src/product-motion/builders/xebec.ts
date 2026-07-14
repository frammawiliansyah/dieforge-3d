/**
 * XEBEC — Ceramic Stone "Meister Finish" (hand-finishing ceramic-fibre stone).
 *
 * Ref: xebec-tech.com (XEBEC Ceramic Stone). A long straight stick with a
 * rectangular ceramic-fibre cross-section, lightly rounded edges, flat ends, and
 * "XEBEC® / MADE IN JAPAN" printed along the face. Sold in grit colours
 * (red/white/blue/black/orange); blue is the recognisable XEBEC colour.
 *
 * NOT a brush and NOT a shank-mounted point — just the coloured stone stick.
 */
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { createCeramicGrainBump } from '../materials'
import type { MotionBuildParams, ProductAssembly } from '../types'

/** "XEBEC® / MADE IN JAPAN" printed along the stick — text runs along the length. */
function makeStoneLabel(): THREE.CanvasTexture {
  const W = 160
  const H = 2048
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(12,18,32,0.86)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const draw = (text: string, posY: number, font: string) => {
    ctx.save()
    ctx.translate(W / 2, posY)
    ctx.rotate(-Math.PI / 2)
    ctx.font = font
    ctx.fillText(text, 0, 0)
    ctx.restore()
  }
  draw('XEBEC®', H * 0.4, 'bold 96px Arial, sans-serif')
  draw('MADE IN JAPAN', H * 0.6, '52px Arial, sans-serif')
  const tex = new THREE.CanvasTexture(c)
  tex.anisotropy = 4
  return tex
}

export function buildXebecProduct(_params?: MotionBuildParams): ProductAssembly {
  const stoneMat = new THREE.MeshPhysicalMaterial({
    color: 0x154e9a, // XEBEC blue ceramic fibre — deep, matte stone (not plastic)
    metalness: 0.0,
    roughness: 0.75,
    envMapIntensity: 0.3,
    clearcoat: 0.04,
    clearcoatRoughness: 0.6,
  })
  const grain = createCeramicGrainBump()
  grain.repeat.set(3, 18) // fine speckle stretched along the stick — fibrous grain
  stoneMat.bumpMap = grain
  stoneMat.bumpScale = 0.028

  const w = 0.34 // wide face width
  const d = 0.18 // thickness
  const len = 3.8 // long stick
  const r = 0.02 // near-sharp ground edges

  const product = new THREE.Group()
  product.name = 'xebec'
  const body = new THREE.Group()

  const stick = new THREE.Mesh(new RoundedBoxGeometry(w, len, d, 4, r), stoneMat)
  body.add(stick)

  // printed branding on both wide faces
  const labelTex = makeStoneLabel()
  const labelMat = new THREE.MeshBasicMaterial({
    map: labelTex,
    transparent: true,
    depthWrite: false,
  })
  const labelGeo = new THREE.PlaneGeometry(w * 0.82, len * 0.95)
  const front = new THREE.Mesh(labelGeo, labelMat)
  front.position.z = d / 2 + 0.003
  body.add(front)
  const back = new THREE.Mesh(labelGeo, labelMat)
  back.position.z = -(d / 2 + 0.003)
  back.rotation.y = Math.PI
  body.add(back)

  product.add(body)

  return {
    product,
    animate(t, motion) {
      product.rotation.z = motion ? Math.sin(t * 0.5) * 0.04 : 0
    },
  }
}
