/**
 * Interpolation de Hermite classique (comme GLSL `smoothstep`) : renvoie 0 pour
 * `value <= edge0`, 1 pour `value >= edge1`, et une transition douce (dérivées
 * nulles aux bords) entre les deux. Fonction pure — partagée par tous les
 * échantillonneurs de relief et les profils de densité de végétation.
 */
export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
