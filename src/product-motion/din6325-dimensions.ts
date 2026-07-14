/** DIN 6325 — hardened ground parallel dowel pin (plain, no thread). */
export interface Din6325Dimensions {
  /** 15° chamfer depth on press-fit end (mm) — z2 */
  z2: number
  /** Chamfer / lead-in on opposite end (mm) — z1 */
  z1: number
  /** Spherical end radius (mm) — r */
  endRadius: number
}

const DIN6325_BY_D1: Record<number, Din6325Dimensions> = {
  2: { z2: 0.18, z1: 0.3, endRadius: 2 },
  3: { z2: 0.3, z1: 0.45, endRadius: 3 },
  4: { z2: 0.4, z1: 0.6, endRadius: 4 },
  5: { z2: 0.5, z1: 0.75, endRadius: 5 },
  6: { z2: 0.6, z1: 0.9, endRadius: 6 },
  8: { z2: 0.8, z1: 1.2, endRadius: 8 },
  10: { z2: 1.0, z1: 1.5, endRadius: 10 },
  12: { z2: 1.3, z1: 1.8, endRadius: 12 },
  14: { z2: 1.3, z1: 2.0, endRadius: 14 },
  16: { z2: 1.7, z1: 2.5, endRadius: 16 },
  20: { z2: 2.0, z1: 3.0, endRadius: 20 },
}

const SORTED_D1 = Object.keys(DIN6325_BY_D1)
  .map(Number)
  .sort((a, b) => a - b)

function clampRow(row: Din6325Dimensions, d1: number): Din6325Dimensions {
  return {
    z2: Math.min(row.z2, d1 * 0.35),
    z1: Math.min(row.z1, d1 * 0.42),
    endRadius: Math.min(row.endRadius, d1 * 1.05),
  }
}

function interpolate(d1: number): Din6325Dimensions {
  if (d1 <= SORTED_D1[0]) {
    const base = DIN6325_BY_D1[SORTED_D1[0]]
    const t = d1 / SORTED_D1[0]
    return clampRow(
      { z2: base.z2 * t, z1: base.z1 * t, endRadius: base.endRadius * t },
      d1,
    )
  }
  if (d1 >= SORTED_D1[SORTED_D1.length - 1]) {
    const top = SORTED_D1[SORTED_D1.length - 1]
    const base = DIN6325_BY_D1[top]
    const t = d1 / top
    return clampRow(
      { z2: base.z2 * t, z1: base.z1 * t, endRadius: base.endRadius * t },
      d1,
    )
  }
  for (let i = 0; i < SORTED_D1.length - 1; i++) {
    const lo = SORTED_D1[i]
    const hi = SORTED_D1[i + 1]
    if (d1 >= lo && d1 <= hi) {
      const t = (d1 - lo) / (hi - lo)
      const a = DIN6325_BY_D1[lo]
      const b = DIN6325_BY_D1[hi]
      return clampRow(
        {
          z2: a.z2 + (b.z2 - a.z2) * t,
          z1: a.z1 + (b.z1 - a.z1) * t,
          endRadius: a.endRadius + (b.endRadius - a.endRadius) * t,
        },
        d1,
      )
    }
  }
  return clampRow(DIN6325_BY_D1[6], d1)
}

export function lookupDin6325(d1: number): Din6325Dimensions {
  const exact = DIN6325_BY_D1[d1]
  if (exact) return clampRow(exact, d1)
  return interpolate(d1)
}
