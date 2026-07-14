/** MISUMI-style mold return pin proportions by shaft diameter d (mm). */
export interface ReturnPinDimensions {
  /** Head / flange diameter (mm) */
  headD: number
  /** Head thickness along axis (mm) — T=4 or 8 */
  headT: number
}

const RETURN_PIN_BY_D1: Record<number, ReturnPinDimensions> = {
  15: { headD: 20, headT: 4 },
  16: { headD: 22, headT: 4 },
  20: { headD: 26, headT: 6 },
  25: { headD: 32, headT: 8 },
}

const SORTED = Object.keys(RETURN_PIN_BY_D1)
  .map(Number)
  .sort((a, b) => a - b)

function clampRow(row: ReturnPinDimensions, d1: number): ReturnPinDimensions {
  return {
    headD: Math.max(d1 * 1.15, Math.min(row.headD, d1 * 1.65)),
    headT: Math.min(row.headT, d1 * 0.45),
  }
}

function interpolate(d1: number): ReturnPinDimensions {
  if (d1 <= SORTED[0]) {
    const base = RETURN_PIN_BY_D1[SORTED[0]]
    const t = d1 / SORTED[0]
    return clampRow({ headD: base.headD * t, headT: base.headT * t }, d1)
  }
  if (d1 >= SORTED[SORTED.length - 1]) {
    const top = SORTED[SORTED.length - 1]
    const base = RETURN_PIN_BY_D1[top]
    const t = d1 / top
    return clampRow({ headD: base.headD * t, headT: base.headT * t }, d1)
  }
  for (let i = 0; i < SORTED.length - 1; i++) {
    const lo = SORTED[i]
    const hi = SORTED[i + 1]
    if (d1 >= lo && d1 <= hi) {
      const t = (d1 - lo) / (hi - lo)
      const a = RETURN_PIN_BY_D1[lo]
      const b = RETURN_PIN_BY_D1[hi]
      return clampRow(
        {
          headD: a.headD + (b.headD - a.headD) * t,
          headT: a.headT + (b.headT - a.headT) * t,
        },
        d1,
      )
    }
  }
  return clampRow(RETURN_PIN_BY_D1[16], d1)
}

export function lookupReturnPin(d1: number): ReturnPinDimensions {
  const exact = RETURN_PIN_BY_D1[d1]
  if (exact) return clampRow(exact, d1)
  return interpolate(d1)
}
