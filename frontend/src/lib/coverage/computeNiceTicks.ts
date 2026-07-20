/**
 * Graduations « rondes » pour un axe de graphe : choisit un pas 1/2/5×10ⁿ
 * donnant environ `targetCount` graduations sur [min, max]. Fonction pure.
 */
export function computeNiceTicks(min: number, max: number, targetCount = 6): number[] {
  const span = max - min
  if (span <= 0) return [min]
  const rawStep = span / targetCount
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  const step = (normalized < 1.5 ? 1 : normalized < 3.5 ? 2 : normalized < 7.5 ? 5 : 10) * magnitude
  const ticks: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) {
    ticks.push(Math.round(v / step) * step)
  }
  return ticks
}
