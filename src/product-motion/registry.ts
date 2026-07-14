/**
 * Single source of truth for the 24 products.
 * Drives the interactive viewer, the gallery, and the offline batch renderer.
 */
import { buildAirJetValveProduct } from './builders/air-jet-valve'
import { buildBallPlungerProduct } from './builders/ball-plunger'
import { buildBautLProduct } from './builders/baut-l'
import { buildBautPolosProduct } from './builders/baut-polos'
import { buildCoilSpringProduct } from './builders/coil-spring'
import { buildDowelPinDratProduct } from './builders/dowel-pin-drat'
import { buildDowelPinPolosProduct } from './builders/dowel-pin-polos'
import { buildEjectorPinProduct } from './builders/ejector-pin'
import { buildGuideBushKepalaProduct } from './builders/guide-bush-kepala'
import { buildGuideBushPolosProduct } from './builders/guide-bush-polos'
import { buildGuidePinProduct } from './builders/guide-pin'
import { buildGuidePostProduct } from './builders/guide-post'
import { buildMurFlangeProduct } from './builders/mur-flange'
import { buildNippleProduct } from './builders/nipple'
import { buildPartingLockProduct } from './builders/parting-lock'
import { buildPunchesProduct } from './builders/punches'
import { buildReturnPinProduct } from './builders/return-pin'
import { buildScrewPlugProduct } from './builders/screw-plug'
import { buildTSlotNutProduct } from './builders/t-slot-nut'
import { buildTaperLockProduct } from './builders/taper-lock'
import { buildXebecProduct } from './builders/xebec'
import type { MotionBuildParams, ProductAssembly } from './types'

export type Orient = [number, number, number]

/** Lay a vertically-built (long-axis = Y) part down so its axis runs along X. */
const HORIZONTAL: Orient = [0, 0, Math.PI / 2]

export interface ProductDef {
  slug: string
  /** Indonesian display label. */
  label: string
  /** User-facing category. */
  category: string
  /** User-facing type. */
  type: string
  /** Short material / colour note. */
  material: string
  build: (params?: MotionBuildParams) => ProductAssembly
  /** Canonical pose rotation applied before framing/export. */
  orient?: Orient
  /** Optional framing padding override (>1.2 = more margin). */
  viewMargin?: number
}

export const PRODUCTS: ProductDef[] = [
  {
    slug: 'air-jet-valve',
    label: 'Air Jet Valve',
    category: 'Plugs',
    type: 'Air Jet Valve',
    material: 'Stainless steel (SUS420)',
    build: buildAirJetValveProduct,
    // Stands upright: the slotted poppet head faces the hero cameras (+Z).
  },
  {
    slug: 'ball-plunger',
    label: 'Ball Plunger',
    category: 'Locking',
    type: 'Ball Plunger',
    material: 'Black-oxide + bola chrome',
    build: buildBallPlungerProduct,
    orient: HORIZONTAL,
  },
  {
    slug: 'baut-l',
    label: 'Baut L',
    category: 'Fasteners',
    type: 'Baut L',
    material: 'Black-oxide 12.9',
    build: buildBautLProduct,
    // Flipped so the axial view looks onto the knurled socket head (like taper-lock).
    orient: [0, 0, -Math.PI / 2],
  },
  {
    slug: 'baut-polos',
    label: 'Baut Polos',
    category: 'Fasteners',
    type: 'Baut Polos',
    material: 'Satin steel',
    build: buildBautPolosProduct,
    orient: HORIZONTAL,
  },
  {
    slug: 'dowel-pin-drat',
    label: 'Dowel Pin Drat',
    category: 'Pins',
    type: 'Dowel Pin Drat',
    material: 'Satin steel (DIN 7979)',
    build: buildDowelPinDratProduct,
    orient: HORIZONTAL,
  },
  {
    slug: 'dowel-pin-polos',
    label: 'Dowel Pin Polos',
    category: 'Pins',
    type: 'Dowel Pin Polos',
    material: 'Satin steel (DIN 6325)',
    build: buildDowelPinPolosProduct,
    orient: HORIZONTAL,
  },
  {
    slug: 'ejector-pin',
    label: 'Ejector Pin',
    category: 'Ejector Pins',
    type: 'Ejector Pin',
    material: 'Satin steel',
    build: buildEjectorPinProduct,
    orient: HORIZONTAL,
  },
  {
    slug: 'guide-bush-kepala',
    label: 'Guide Bush Kepala',
    category: 'Guide Posts',
    type: 'Guide Bush Kepala',
    material: 'Bright steel',
    build: buildGuideBushKepalaProduct,
    orient: HORIZONTAL,
  },
  {
    slug: 'guide-bush-polos',
    label: 'Guide Bush Polos',
    category: 'Guide Posts',
    type: 'Guide Bush Polos',
    material: 'Bright steel',
    build: buildGuideBushPolosProduct,
    orient: HORIZONTAL,
  },
  {
    slug: 'guide-pin',
    label: 'Guide Pin',
    category: 'Pins',
    type: 'Guide Pin',
    material: 'Satin steel (SUJ2)',
    build: buildGuidePinProduct,
    orient: HORIZONTAL,
  },
  {
    slug: 'guide-post',
    label: 'Guide Post',
    category: 'Guide Posts',
    type: 'Guide Post',
    material: 'Spiral-groove guide post + cast-iron flange plates',
    build: buildGuidePostProduct,
    // Full guide post set: built standing (plates horizontal) like the reference.
  },
  {
    slug: 'mur-flange',
    label: 'Mur Flange',
    category: 'Fasteners',
    type: 'Mur Flange',
    material: 'Satin steel',
    build: buildMurFlangeProduct,
    orient: HORIZONTAL,
  },
  {
    slug: 'nipple',
    label: 'Nipple',
    category: 'Fasteners',
    type: 'NIPPLE',
    material: 'Brass / zinc',
    build: buildNippleProduct,
    orient: HORIZONTAL,
  },
  {
    slug: 'parting-lock',
    label: 'Parting Lock',
    category: 'Locking',
    type: 'Parting Lock',
    material: 'Orange nylon sleeve + S45C steel',
    build: buildPartingLockProduct,
    orient: HORIZONTAL,
  },
  {
    slug: 'coil-spring-biru',
    label: 'Per Biru',
    category: 'Coil Springs',
    type: 'Per Biru',
    material: 'Biru (medium load)',
    build: (p) => buildCoilSpringProduct(p, 'biru'),
    orient: HORIZONTAL,
  },
  {
    slug: 'coil-spring-kuning',
    label: 'Per Kuning',
    category: 'Coil Springs',
    type: 'Per Kuning',
    material: 'Kuning (light load)',
    build: (p) => buildCoilSpringProduct(p, 'kuning'),
    orient: HORIZONTAL,
  },
  {
    slug: 'coil-spring-merah',
    label: 'Per Merah',
    category: 'Coil Springs',
    type: 'Per Merah',
    material: 'Merah (heavy load)',
    build: (p) => buildCoilSpringProduct(p, 'merah'),
    orient: HORIZONTAL,
  },
  {
    slug: 'coil-spring-putih',
    label: 'Per Putih',
    category: 'Coil Springs',
    type: 'Per Putih',
    material: 'Putih (extra-light)',
    build: (p) => buildCoilSpringProduct(p, 'putih'),
    orient: HORIZONTAL,
  },
  {
    slug: 'return-pin',
    label: 'Return Pin',
    category: 'Pins',
    type: 'Return Pin',
    material: 'Satin steel (20Cr)',
    build: buildReturnPinProduct,
    orient: HORIZONTAL,
  },
  {
    slug: 'screw-plug',
    label: 'Screw Plug',
    category: 'Plugs',
    type: 'Screw Plug',
    material: 'Black-oxide',
    build: buildScrewPlugProduct,
    // Flipped so the hero/axial views look onto the big hex-socket face.
    orient: [0, 0, -Math.PI / 2],
  },
  {
    slug: 'straight-punch',
    label: 'Straight Punch',
    category: 'Punches',
    type: 'Straight Punch',
    material: 'Satin steel + kepala black-oxide',
    build: buildPunchesProduct,
    orient: HORIZONTAL,
  },
  {
    slug: 't-slot-nut',
    label: 'T-Slot Nut',
    category: 'Fasteners',
    type: 'T-Slot Nut',
    material: 'Black-oxide steel',
    build: buildTSlotNutProduct,
  },
  {
    slug: 'taper-lock',
    label: 'Taper Lock',
    category: 'Locking',
    type: 'Taper Lock',
    material: 'Bright steel (SUJ2)',
    build: buildTaperLockProduct,
    // Stands upright: the separated male/female pair reads like the catalog photo.
  },
  {
    slug: 'xebec',
    label: 'XEBEC',
    category: 'Abrasives',
    type: 'XEBEC',
    material: 'Ceramic fibre biru + shank steel',
    build: buildXebecProduct,
    // Flipped horizontal so the axial view shows the blue fibre face, not the shank end.
    orient: [0, 0, -Math.PI / 2],
  },
]

export const PRODUCT_BY_SLUG: Record<string, ProductDef> = Object.fromEntries(
  PRODUCTS.map((p) => [p.slug, p]),
)

export const PRODUCT_SLUGS: string[] = PRODUCTS.map((p) => p.slug)
