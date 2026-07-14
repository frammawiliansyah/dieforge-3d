/** MISUMI-style mold ejector pin head proportions by shaft diameter d (mm). */
export interface EjectorPinDimensions {
  /** Head / flange diameter (mm) */
  headD: number
  /** Head thickness along axis (mm) */
  headT: number
}

const EJECTOR_PIN_BY_D1: Record<number, EjectorPinDimensions> = {
  2.5: { headD: 4, headT: 1.5 },
  3: { headD: 5, headT: 1.5 },
  4: { headD: 6.5, headT: 2 },
  5: { headD: 8, headT: 2 },
  6: { headD: 9.5, headT: 2.5 },
  8: { headD: 12, headT: 3 },
  10: { headD: 15, headT: 4 },
  12: { headD: 18, headT: 4 },
  16: { headD: 22, headT: 5 },
  20: { headD: 26, headT: 6 },
  25: { headD: 32, headT: 8 },
}

const SORTED = Object.keys(EJECTOR_PIN_BY_D1)
  .map(Number)
  .sort((a, b) => a - b)

function clampRow(row: EjectorPinDimensions, d1: number): EjectorPinDimensions {
  return {
    headD: Math.max(d1 * 1.15, Math.min(row.headD, d1 * 1.65)),
    headT: Math.min(row.headT, d1 * 0.45),
  }
}

function interpolate(d1: number): EjectorPinDimensions {
  if (d1 <= SORTED[0]) {
    const base = EJECTOR_PIN_BY_D1[SORTED[0]]
    const t = d1 / SORTED[0]
    return clampRow({ headD: base.headD * t, headT: base.headT * t }, d1)
  }
  if (d1 >= SORTED[SORTED.length - 1]) {
    const top = SORTED[SORTED.length - 1]
    const base = EJECTOR_PIN_BY_D1[top]
    const t = d1 / top
    return clampRow({ headD: base.headD * t, headT: base.headT * t }, d1)
  }
  for (let i = 0; i < SORTED.length - 1; i++) {
    const lo = SORTED[i]
    const hi = SORTED[i + 1]
    if (d1 >= lo && d1 <= hi) {
      const t = (d1 - lo) / (hi - lo)
      const a = EJECTOR_PIN_BY_D1[lo]
      const b = EJECTOR_PIN_BY_D1[hi]
      return clampRow(
        {
          headD: a.headD + (b.headD - a.headD) * t,
          headT: a.headT + (b.headT - a.headT) * t,
        },
        d1,
      )
    }
  }
  return clampRow(EJECTOR_PIN_BY_D1[10], d1)
}

export function lookupEjectorPin(d1: number): EjectorPinDimensions {
  const exact = EJECTOR_PIN_BY_D1[d1]
  if (exact) return clampRow(exact, d1)
  return interpolate(d1)
}
