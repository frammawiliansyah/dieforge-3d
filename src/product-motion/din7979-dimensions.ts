/** DIN 7979 Type D — representative dimensions by pin diameter d1 (mm). */
export interface Din7979Dimensions {
  d3: number // counterbore Ø (mm) — must be < d1
  threadDepth: number // t (mm)
  f1: number // chamfer (mm)
}

const DIN7979_BY_D1: Record<number, Din7979Dimensions> = {
  4: { d3: 2.8, threadDepth: 4, f1: 1.4 },
  5: { d3: 3.5, threadDepth: 5, f1: 1.75 },
  6: { d3: 4.3, threadDepth: 6, f1: 2.1 },
  8: { d3: 5.3, threadDepth: 8, f1: 2.6 },
  10: { d3: 6.4, threadDepth: 10, f1: 3.0 },
  12: { d3: 6.4, threadDepth: 10, f1: 3.8 },
  16: { d3: 8.4, threadDepth: 12, f1: 4.7 },
  20: { d3: 10.5, threadDepth: 16, f1: 6.0 },
}

const SORTED_D1 = Object.keys(DIN7979_BY_D1)
  .map(Number)
  .sort((a, b) => a - b)

/** Interpolate between bracket rows for non-standard catalog diameters. */
function interpolateDin7979(d1: number): Din7979Dimensions {
  if (d1 <= SORTED_D1[0]) return scaleRow(DIN7979_BY_D1[SORTED_D1[0]], d1 / SORTED_D1[0])
  if (d1 >= SORTED_D1[SORTED_D1.length - 1]) {
    const top = SORTED_D1[SORTED_D1.length - 1]
    return scaleRow(DIN7979_BY_D1[top], d1 / top)
  }
  for (let i = 0; i < SORTED_D1.length - 1; i++) {
    const lo = SORTED_D1[i]
    const hi = SORTED_D1[i + 1]
    if (d1 >= lo && d1 <= hi) {
      const t = (d1 - lo) / (hi - lo)
      const a = DIN7979_BY_D1[lo]
      const b = DIN7979_BY_D1[hi]
      return clampRow({
        d3: a.d3 + (b.d3 - a.d3) * t,
        threadDepth: a.threadDepth + (b.threadDepth - a.threadDepth) * t,
        f1: a.f1 + (b.f1 - a.f1) * t,
      }, d1)
    }
  }
  return clampRow(DIN7979_BY_D1[6], d1)
}

function scaleRow(row: Din7979Dimensions, factor: number): Din7979Dimensions {
  return clampRow(
    {
      d3: row.d3 * factor,
      threadDepth: row.threadDepth * factor,
      f1: row.f1 * factor,
    },
    row.d3 / 0.72 * factor,
  )
}

/** d3 must stay inside the pin OD; thread depth has a sensible floor. */
function clampRow(row: Din7979Dimensions, d1: number): Din7979Dimensions {
  return {
    d3: Math.min(row.d3, d1 * 0.72),
    threadDepth: Math.max(2.5, Math.min(row.threadDepth, d1 * 1.5)),
    f1: Math.min(row.f1, d1 * 0.38),
  }
}

export function lookupDin7979(d1: number): Din7979Dimensions {
  const exact = DIN7979_BY_D1[d1]
  if (exact) return clampRow(exact, d1)
  return interpolateDin7979(d1)
}
