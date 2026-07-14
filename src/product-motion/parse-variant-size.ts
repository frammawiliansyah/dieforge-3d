/** Parsed pin dimensions from variant.size (e.g. "8X45" → d1=8 mm, L=45 mm). */
export interface PinDimensions {
  d1: number
  L: number
}

const SIZE_PATTERN = /^(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)/

/** Parse diameter × length from catalog variant size strings. */
export function parsePinVariantSize(size: string | null | undefined): PinDimensions | null {
  if (!size?.trim()) return null
  const match = size.trim().match(SIZE_PATTERN)
  if (!match) return null
  const d1 = parseFloat(match[1])
  const L = parseFloat(match[2])
  if (!Number.isFinite(d1) || !Number.isFinite(L) || d1 <= 0 || L <= 0) return null
  return { d1, L }
}
