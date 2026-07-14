/**
 * GLB export — turns a built product Group into a portable binary glTF.
 * Geometry + PBR materials + baked canvas bump textures export fine; lighting
 * and environment are the viewer's job, so consumers must light the scene.
 */
import type * as THREE from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'

export function exportGLB(object: THREE.Object3D): Promise<ArrayBuffer> {
  const exporter = new GLTFExporter()
  return new Promise((resolve, reject) => {
    exporter.parse(
      object,
      (result) => resolve(result as ArrayBuffer),
      (error) => reject(error),
      { binary: true, onlyVisible: true },
    )
  })
}

/** Base64-encode an ArrayBuffer in the browser (chunked to avoid call-stack limits). */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}
