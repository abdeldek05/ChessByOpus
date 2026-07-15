// Réglages des NORMAL MAPS et de la rugosité par surface du splatting prairie.
// Le gazon réutilise la normal map du pack LAWN (createLawnTextures, Sobel
// LAWN_NORMAL_STRENGTH) ; roche et terre ont leur propre relief fBm généré par
// createNoiseNormalTexture. `normalScale` = curseur GLOBAL du micro-relief
// (0 = neutralise tout, garde-fou de réversibilité perf/rendu).

export const TERRAIN_NORMALS = {
  /** Roche : relief marqué et cassé (pentes raides, crêtes). */
  rock: { seed: 4242, grid: 12, octaves: 5, strength: 3.4 },
  /** Terre nue : mottes douces. */
  dirt: { seed: 907, grid: 16, octaves: 4, strength: 1.8 },
  /** Intensité globale du micro-relief (uniform uNormalScale du fragment). */
  normalScale: 1.0,
} as const

// Rugosité PBR par surface (mixée par les mêmes masques que l'albédo) : sol
// mat, la roche légèrement moins pour accrocher un éclat sous lumière rasante.
export const TERRAIN_ROUGHNESS = {
  grass: 0.95,
  dry: 0.92,
  dirt: 0.9,
  rock: 0.78,
} as const
