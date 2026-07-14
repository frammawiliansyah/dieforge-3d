# DieForge 3D

**Procedural 3D asset studio for precision mold & die components.**

<p align="center">
  <a href="https://github.com/frammawiliansyah/dieforge-3d/blob/main/public/assets/coil-spring-biru/model.glb" title="Open interactive GLB — coil spring">
    <img src="https://raw.githubusercontent.com/frammawiliansyah/dieforge-3d/main/public/assets/coil-spring-biru/hero-right.webp" alt="Blue die coil spring — procedural render" width="280" />
  </a>
  &nbsp;&nbsp;
  <a href="https://github.com/frammawiliansyah/dieforge-3d/blob/main/public/assets/guide-bush-kepala/model.glb" title="Open interactive GLB — guide bush">
    <img src="https://raw.githubusercontent.com/frammawiliansyah/dieforge-3d/main/public/assets/guide-bush-kepala/hero-right.webp" alt="Headed guide bush — procedural render" width="280" />
  </a>
  &nbsp;&nbsp;
  <a href="https://github.com/frammawiliansyah/dieforge-3d/blob/main/public/assets/straight-punch/model.glb" title="Open interactive GLB — straight punch">
    <img src="https://raw.githubusercontent.com/frammawiliansyah/dieforge-3d/main/public/assets/straight-punch/hero-right.webp" alt="Straight punch — procedural render" width="280" />
  </a>
</p>

<p align="center">
  <sub>
    Click a render to open its interactive <strong>GLB</strong> in GitHub's 3D viewer —
    <a href="https://github.com/frammawiliansyah/dieforge-3d/blob/main/public/assets/coil-spring-biru/model.glb">coil spring</a>
    ·
    <a href="https://github.com/frammawiliansyah/dieforge-3d/blob/main/public/assets/guide-bush-kepala/model.glb">guide bush</a>
    ·
    <a href="https://github.com/frammawiliansyah/dieforge-3d/blob/main/public/assets/straight-punch/model.glb">straight punch</a>
  </sub>
</p>

One geometry pipeline powers everything: an interactive React viewer, five catalog-ready WebP renders per product, and portable GLB exports — all guaranteed consistent because they share the same Three.js builders.

```
  Procedural builders (TypeScript + three.js)
              │
              ├─► Interactive viewer   (React, orbit controls)
              ├─► Batch WebP renders   (5 curated angles, white background)
              └─► GLB export           (geometry + PBR materials)
```

---

## Why this exists

Industrial catalog sites need the same part shown three ways: a spin-able 3D preview, sharp product stills, and a file designers can drop into CAD or WebGL viewers. Hand-modeling 24+ SKUs is slow and drifts out of sync.

DieForge solves that with **code-first geometry**: each product is a typed builder with DIN/MISUMI-aware proportions, PBR materials, and deterministic offline rendering so pixels and meshes never disagree.

---

## Features

- **24 mold/die products** — pins, bushings, punches, springs, fasteners, locking, plugs, abrasives
- **Single source of truth** — `registry.ts` drives the gallery, viewer, renderer, and GLB exporter
- **5 curated camera angles** per product (`front`, `hero-left`, `hero-right`, `axial`, `low`) with bounding-box framing
- **Deterministic batch pipeline** — frozen lighting, opaque white background, fixed pixel ratio
- **Drop-in React component** — `<Product3DViewer slug="…" />` with lazy WebGL mount
- **Portable GLB** — export for `<model-viewer>`, React Three Fiber, Blender, etc.

---

## Quick start

```bash
npm install
npx playwright install chromium   # once, for batch rendering

npm run dev            # interactive QA gallery → http://localhost:5173
npm run render         # 120 WebP images → public/assets/<slug>/*.webp
npm run export:glb     # 24 GLB models    → public/assets/<slug>/model.glb
npm run assets         # render + GLB in one pass
npm run typecheck      # TypeScript check
npm run build          # production Vite build
```

Render and GLB scripts spin up their own headless Vite server — you do **not** need `npm run dev` running separately.

### Single product

```bash
node scripts/render-images.mjs dowel-pin-polos
node scripts/export-glb.mjs   dowel-pin-polos
node scripts/build-assets.mjs dowel-pin-polos   # both
```

---

## Product catalog

| Category | Type | Slug | Material / finish |
|---|---|---|---|
| Plugs | Air Jet Valve | `air-jet-valve` | Stainless steel (SUS420) |
| Locking | Ball Plunger | `ball-plunger` | Black-oxide body + chrome ball |
| Fasteners | Baut L (SHCS) | `baut-l` | Black-oxide grade 12.9 |
| Fasteners | Baut Polos | `baut-polos` | Satin steel |
| Pins | Dowel Pin Drat | `dowel-pin-drat` | Satin steel (DIN 7979) |
| Pins | Dowel Pin Polos | `dowel-pin-polos` | Satin steel (DIN 6325) |
| Ejector Pins | Ejector Pin | `ejector-pin` | Satin steel |
| Guide Posts | Guide Bush Kepala | `guide-bush-kepala` | Bright steel |
| Guide Posts | Guide Bush Polos | `guide-bush-polos` | Bright steel |
| Pins | Guide Pin | `guide-pin` | Satin steel (SUJ2) |
| Guide Posts | Guide Post | `guide-post` | Satin steel |
| Fasteners | Mur Flange | `mur-flange` | Satin steel |
| Fasteners | Nipple | `nipple` | Brass / zinc |
| Locking | Parting Lock | `parting-lock` | Steel + black-oxide plate |
| Coil Springs | Per Biru | `coil-spring-biru` | Blue die spring |
| Coil Springs | Per Kuning | `coil-spring-kuning` | Yellow die spring |
| Coil Springs | Per Merah | `coil-spring-merah` | Red die spring |
| Coil Springs | Per Putih | `coil-spring-putih` | White die spring |
| Pins | Return Pin | `return-pin` | Satin steel (20Cr) |
| Plugs | Screw Plug | `screw-plug` | Black-oxide |
| Punches | Straight Punch | `straight-punch` | Satin steel + black-oxide head |
| Fasteners | T-Slot Nut | `t-slot-nut` | Black-oxide steel |
| Locking | Taper Lock | `taper-lock` | Bright steel (SUJ2) |
| Abrasives | XEBEC | `xebec` | Blue ceramic fibre + steel shank |

---

## Project structure

```
3d-model/
├── index.html              # Dev gallery entry (ProductGallery)
├── render.html             # Headless render / GLB export entry
├── public/assets/<slug>/   # Output: 5× WebP + model.glb per product
├── scripts/
│   ├── render-images.mjs   # Playwright batch WebP capture
│   ├── export-glb.mjs      # Headless GLB export
│   └── build-assets.mjs    # Convenience wrapper (render + GLB)
└── src/
    ├── main.tsx            # Gallery bootstrap
    ├── render-entry.ts     # Offline render harness
    ├── components/
    │   ├── Product3DViewer.tsx   # Drop-in interactive viewer
    │   └── ProductGallery.tsx    # Local QA showcase
    └── product-motion/
        ├── registry.ts           # 24-product catalog (slug → builder)
        ├── viewer.ts             # Scene, lights, controls, render mode
        ├── materials.ts          # PBR palette & texture helpers
        ├── geometry.ts           # Lathe, knurl, thread, hollow cylinder utils
        ├── views.ts              # 5 standard camera angles + framing
        ├── glb.ts                # GLTFExporter wrapper
        ├── fit-viewer-camera.ts
        ├── *-dimensions.ts       # DIN tables for pin variants
        └── builders/             # One procedural builder per product archetype
```

---

## Camera angles

Most parts are rotationally symmetric, so six orthographic sides would look redundant. Instead, five **curated** views fill the frame evenly via projected bounding-box framing (see `STANDARD_VIEWS` in `src/product-motion/views.ts`):

| ID | Role |
|---|---|
| `front` | Profile / side elevation |
| `hero-left` | Three-quarter, camera left |
| `hero-right` | Three-quarter, camera right |
| `axial` | End-on — bore, socket, or tip detail |
| `low` | Low hero angle for depth |

---

## Using in another app

### 1. Product stills (lightest — listings, cards)

Copy `public/assets/` into your static host, then:

```tsx
<img src={`/assets/${slug}/hero-right.webp`} alt={label} loading="lazy" />
```

### 2. Interactive 3D viewer (product detail pages)

Copy `src/product-motion/` and `src/components/Product3DViewer.tsx` into your project (keep the `@/` alias or adjust imports), then:

```tsx
import { Product3DViewer } from '@/components/Product3DViewer'

<Product3DViewer slug="dowel-pin-polos" />
```

`Product3DViewer` lazy-mounts WebGL via `IntersectionObserver` — safe for long lists if you only mount one viewer per detail page.

### 3. GLB files (CAD, R3F, `<model-viewer>`)

`public/assets/<slug>/model.glb` includes mesh geometry and PBR materials. Lighting is **not** baked — bring your own environment map in the target app.

---

## Extending the catalog

1. Add a builder in `src/product-motion/builders/<slug>.ts`
2. Register it in `src/product-motion/registry.ts`
3. Run `node scripts/build-assets.mjs <slug>`

To tweak proportions for an existing pin, edit the relevant `*-dimensions.ts` table and re-render that slug only.

---

## Tech stack

| Layer | Choice |
|---|---|
| Bundler | Vite 6 |
| UI | React 19 |
| Language | TypeScript |
| 3D | three.js 0.184 |
| Batch render | Playwright (headless Chromium + SwiftShader) |
| Image encode | sharp → WebP |

---

## License

Add a `LICENSE` file before publishing (MIT is a common choice for tooling libraries). Until then, all rights reserved by the repository owner.
