/** MISUMI-style mold guide pin (leader pin) proportions by body diameter d (mm). */
export interface GuidePinDimensions {
  /** Head / flange diameter (mm) */
  headD: number
  /** Head thickness (mm) */
  headH: number
  /** Internal tap bore diameter at mounting end (mm) — visual only */
  tapD: number
  /** Tap depth (mm) */
  tapDepth: number
}

const GUIDE_PIN_BY_D1: Record<number, GuidePinDimensions> = {
  12: { headD: 17, headH: 5, tapD: 6.5, tapDepth: 8 },
  16: { headD: 20, headH: 6, tapD: 8, tapDepth: 10 },
  20: { headD: 25, headH: 7.5, tapD: 10, tapDepth: 12 },
  25: { headD: 30, headH: 8, tapD: 12, tapDepth: 14 },
}

const SORTED = Object.keys(GUIDE_PIN_BY_D1)
  .map(Number)
  .sort((a, b) => a - b)

function clampRow(row: GuidePinDimensions, d1: number): GuidePinDimensions {
  return {
    headD: Math.max(d1 * 1.12, Math.min(row.headD, d1 * 1.55)),
    headH: Math.min(row.headH, d1 * 0.55),
    tapD: Math.min(row.tapD, row.headD * 0.55),
    tapDepth: Math.min(row.tapDepth, d1 * 1.2),
  }
}

function interpolate(d1: number): GuidePinDimensions {
  if (d1 <= SORTED[0]) {
    const base = GUIDE_PIN_BY_D1[SORTED[0]]
    const t = d1 / SORTED[0]
    return clampRow(
      {
        headD: base.headD * t,
        headH: base.headH * t,
        tapD: base.tapD * t,
        tapDepth: base.tapDepth * t,
      },
      d1,
    )
  }
  if (d1 >= SORTED[SORTED.length - 1]) {
    const top = SORTED[SORTED.length - 1]
    const base = GUIDE_PIN_BY_D1[top]
    const t = d1 / top
    return clampRow(
      {
        headD: base.headD * t,
        headH: base.headH * t,
        tapD: base.tapD * t,
        tapDepth: base.tapDepth * t,
      },
      d1,
    )
  }
  for (let i = 0; i < SORTED.length - 1; i++) {
    const lo = SORTED[i]
    const hi = SORTED[i + 1]
    if (d1 >= lo && d1 <= hi) {
      const t = (d1 - lo) / (hi - lo)
      const a = GUIDE_PIN_BY_D1[lo]
      const b = GUIDE_PIN_BY_D1[hi]
      return clampRow(
        {
          headD: a.headD + (b.headD - a.headD) * t,
          headH: a.headH + (b.headH - a.headH) * t,
          tapD: a.tapD + (b.tapD - a.tapD) * t,
          tapDepth: a.tapDepth + (b.tapDepth - a.tapDepth) * t,
        },
        d1,
      )
    }
  }
  return clampRow(GUIDE_PIN_BY_D1[12], d1)
}

export function lookupGuidePin(d1: number): GuidePinDimensions {
  const exact = GUIDE_PIN_BY_D1[d1]
  if (exact) return clampRow(exact, d1)
  return interpolate(d1)
}
