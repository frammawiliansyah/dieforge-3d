/**
 * Shared 3D product viewer — UASE product-3d studio.
 * Powers both the interactive React viewer and the deterministic offline renderer.
 *
 * `renderMode: true` freezes all time-based motion (the sweeping point light and
 * idle auto-rotate) so every captured frame is byte-stable — required for the
 * consistent 5-view WebP renders. See src/product-motion/views.ts for framing.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export { STUDIO_BG } from './constants'

export interface NoiseTextureOptions {
  size?: number
  base?: string
  amount?: number
  dots?: number
}

/** Tileable grayscale noise — use as bumpMap for cast / blasted surfaces. */
export function makeNoiseTexture({
  size = 256,
  base = '#7a7a7a',
  amount = 38,
  dots = 9000,
}: NoiseTextureOptions = {}) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < dots; i++) {
    const g = 110 + (Math.random() - 0.5) * amount * 2
    ctx.fillStyle = `rgb(${g},${g},${g})`
    const r = Math.random() * 1.6
    ctx.fillRect(Math.random() * size, Math.random() * size, r, r)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

export interface ViewerOptions {
  canvas: HTMLCanvasElement
  wrap: HTMLElement
  camera?: { fov?: number; position?: [number, number, number] }
  controls?: {
    minDistance?: number
    maxDistance?: number
    minPolar?: number
    maxPolar?: number
    target?: [number, number, number]
  }
  exposure?: number
  autoRotateSpeed?: number
  idleResumeMs?: number
  groundShadow?: boolean
  /** Brighter lighting + white scene — pairs with buildParams.catalogLook materials */
  catalogLook?: boolean
  /** Deterministic offline render: white bg, frozen lights, no idle auto-rotate. */
  renderMode?: boolean
  /** Fixed device pixel ratio (renders pass 1 for machine-independent output). */
  pixelRatio?: number
}

export interface ViewerState {
  autoRotate: boolean
  motion: boolean
}

export interface FrameContext {
  state: ViewerState
  product: THREE.Group | null
}

export interface ProductViewer {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  state: ViewerState
  setProduct: (group: THREE.Group) => THREE.Group
  onFrame: (cb: (t: number, dt: number, ctx: FrameContext) => void) => void
  renderOnce: () => void
  start: () => void
  stop: () => void
  resize: () => void
  reset: () => void
  setAutoRotate: (v: boolean) => void
  toggleAutoRotate: () => void
  toggleMotion: () => void
  set onAutoChange(fn: () => void)
  set onMotionChange(fn: () => void)
}

export function createViewer({
  canvas,
  wrap,
  camera: cam = {},
  controls: ctl = {},
  exposure = 1.04,
  autoRotateSpeed = 0.0038,
  idleResumeMs = 3500,
  groundShadow = false,
  catalogLook = false,
  renderMode = false,
  pixelRatio,
}: ViewerOptions): ProductViewer {
  const bright = catalogLook || renderMode

  const scene = new THREE.Scene()
  scene.background = bright ? new THREE.Color(0xffffff) : null

  const camera = new THREE.PerspectiveCamera(cam.fov ?? 38, 1, 0.1, 100)
  camera.position.fromArray(cam.position ?? [2.4, 0.6, 3.8])

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !bright })
  renderer.setPixelRatio(pixelRatio ?? Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(bright ? 0xffffff : 0x000000, bright ? 1 : 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = bright ? 1.18 : exposure
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), bright ? 0.08 : 0.04).texture
  pmrem.dispose()

  scene.add(new THREE.AmbientLight(bright ? 0xffffff : 0x4a505c, bright ? 0.52 : 0.35))
  const key = new THREE.DirectionalLight(0xffffff, bright ? 2.0 : 1.7)
  key.position.set(4, 5, 3)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xf0f4fa, bright ? 0.75 : 0.45)
  fill.position.set(-3, 1, -2)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, bright ? 0.9 : 0.65)
  rim.position.set(0, 2.5, -4)
  scene.add(rim)
  const sweep = new THREE.PointLight(0xffffff, bright ? 1.35 : 1.1, 14)
  // Frozen key accent for deterministic renders; animated only in interactive mode.
  sweep.position.set(renderMode ? 2.4 : 1.5, renderMode ? 2.1 : 1.5, renderMode ? 2.8 : 2.5)
  scene.add(sweep)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = !renderMode
  controls.dampingFactor = 0.06
  controls.enableZoom = false // fixed framing — rotate only, no scroll/pinch zoom
  controls.minDistance = ctl.minDistance ?? 2
  controls.maxDistance = ctl.maxDistance ?? 9
  if (ctl.minPolar != null) controls.minPolarAngle = ctl.minPolar
  if (ctl.maxPolar != null) controls.maxPolarAngle = ctl.maxPolar
  controls.target.fromArray(ctl.target ?? [0, 0, 0])
  controls.update()

  const defaultCamPos = camera.position.clone()
  const defaultTarget = controls.target.clone()

  const state: ViewerState = { autoRotate: !renderMode, motion: !renderMode }
  let idleTimer: ReturnType<typeof setTimeout> | null = null
  controls.addEventListener('start', () => {
    state.autoRotate = false
    if (idleTimer) clearTimeout(idleTimer)
    onAutoChange()
  })
  controls.addEventListener('end', () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      state.autoRotate = true
      onAutoChange()
    }, idleResumeMs)
  })

  let onAutoChange = () => {}
  let onMotionChange = () => {}

  let product: THREE.Group | null = null

  function disposeGroup(group: THREE.Group) {
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const m of mats) m.dispose()
      }
    })
  }

  function setProduct(group: THREE.Group) {
    if (product) {
      scene.remove(product)
      disposeGroup(product)
    }
    product = group
    scene.add(product)
    if (groundShadow) {
      const box = new THREE.Box3().setFromObject(product)
      const size = box.getSize(new THREE.Vector3())
      const footprint = Math.max(size.x, size.z) * 0.62
      const shadow = makeContactShadow(footprint, 0.42)
      shadow.position.set(0, box.min.y + 0.002, 0)
      scene.add(shadow)
    }
    return product
  }

  const frameCbs: Array<(t: number, dt: number, ctx: FrameContext) => void> = []
  function onFrame(cb: (t: number, dt: number, ctx: FrameContext) => void) {
    frameCbs.push(cb)
  }

  function resize() {
    const w = wrap.clientWidth
    const h = wrap.clientHeight
    if (!w || !h) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }

  const onResize = () => resize()
  window.addEventListener('resize', onResize)
  resize()

  const clock = new THREE.Clock()
  let rafId = 0
  let running = false

  function renderOnce() {
    controls.update()
    renderer.render(scene, camera)
  }

  function frame() {
    if (!running) return
    rafId = requestAnimationFrame(frame)
    if (document.hidden) return

    const dt = clock.getDelta()
    const t = clock.getElapsedTime()

    if (state.autoRotate && product && !renderMode) {
      product.rotation.y += autoRotateSpeed * (dt * 60)
      product.rotation.x = Math.sin(t * 0.25) * 0.045
    }

    if (!renderMode) {
      sweep.position.x = Math.sin(t * 0.55) * 3.2
      sweep.position.z = Math.cos(t * 0.4) * 2.6
      sweep.intensity = 1.0 + Math.sin(t * 1.1) * 0.35
    }

    const ctx: FrameContext = { state, product }
    for (const cb of frameCbs) cb(t, dt, ctx)
    controls.update()
    renderer.render(scene, camera)
  }

  function start() {
    if (running) return
    running = true
    clock.start()
    frame()
  }

  function stop() {
    running = false
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', onResize)
    controls.dispose()
    renderer.dispose()
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const m of mats) m.dispose()
      }
    })
    scene.environment?.dispose()
  }

  function reset() {
    camera.position.copy(defaultCamPos)
    controls.target.copy(defaultTarget)
    controls.update()
    state.autoRotate = true
    onAutoChange()
  }

  return {
    scene,
    camera,
    renderer,
    controls,
    state,
    setProduct,
    onFrame,
    renderOnce,
    start,
    stop,
    resize,
    reset,
    setAutoRotate(v: boolean) {
      state.autoRotate = v
      onAutoChange()
    },
    toggleAutoRotate() {
      state.autoRotate = !state.autoRotate
      onAutoChange()
    },
    toggleMotion() {
      state.motion = !state.motion
      onMotionChange()
    },
    set onAutoChange(fn: () => void) {
      onAutoChange = fn
    },
    set onMotionChange(fn: () => void) {
      onMotionChange = fn
    },
  }
}

function makeContactShadow(radius: number, opacity = 0.4) {
  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0.0, `rgba(0,0,0,${opacity})`)
  g.addColorStop(0.45, `rgba(0,0,0,${opacity * 0.55})`)
  g.addColorStop(1.0, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(c)
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    opacity: 1,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.renderOrder = -1
  return mesh
}
