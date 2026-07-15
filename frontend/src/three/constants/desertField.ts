// Réglages du biome DÉSERT (site midāna, Arabie saoudite) : sable, cactus,
// oasis et buissons secs. Le relief est le même que la prairie (les collines
// deviennent des dunes) — seuls le sol et la végétation changent.

// --- Sol de sable ---
// Albédo volontairement CONTENU : un sable trop clair sature l'exposition et
// déclenche le Bloom sur tout le sol (« trop de soleil »). Répétition large
// pour un tuilage invisible.
export const SAND = {
  /** Unités de scène couvertes par une répétition de la texture. */
  unitsPerRepeat: 44,
  textureSize: 256,
  base: '#c2a171',
  light: '#d2b586',
  dark: '#a5875c',
  ripple: '#8f744b',
} as const

// Exposition tone-mapping du désert en JOURNÉE : plus basse que la prairie
// (le sable renvoie beaucoup — on compense pour un rendu photo, pas cramé).
export const DESERT_EXPOSURE = 0.8

// Roseaux de l'oasis : palette vert profond (pas la pelouse de prairie).
export const REED_COLORS = { base: '#25451d', mid: '#3c682a', tip: '#6d9040' } as const

// --- Cactus (saguaros procéduraux instanciés) ---
export const CACTUS = {
  count: 18,
  /** Rayon minimal de semis (écarte le complexe de lancement). */
  minRadius: 48,
  /** Fraction du rayon terrain utilisée (évite le bord brumeux). */
  edgeFrac: 0.92,
  /** Demi-côté d'exclusion carré autour de la dalle béton. */
  padExclusion: 34,
  color: '#4c7a3d',
  scaleMin: 0.7,
  scaleMax: 1.5,
  seed: 91,
} as const

// --- Oasis (eau + sable mouillé + roseaux + palmiers) ---
export const OASIS = {
  /** Position monde (x, z) — au sud-est du pas de tir, hors des voies béton. */
  x: 145,
  z: 95,
  waterRadius: 13,
  /** Teinte de l'eau (les reflets réels viennent du MeshReflectorMaterial). */
  waterColor: '#2b5560',
  /** Auréole de sable MOUILLÉ autour de l'eau (sombre, légèrement satinée). */
  ringOuter: 20,
  wetSandColor: '#a8875a',
  /** Roseaux/touffes vertes au bord de l'eau. */
  reedCount: 130,
  reedInner: 13.4,
  reedOuter: 17.5,
  reedHeight: 1.15,
  palmCount: 7,
  palmRadius: 17,
  /** Rayon d'exclusion pour cactus/buissons (rien ne pousse dans l'oasis). */
  exclusionRadius: 32,
  seed: 17,
} as const

// --- Buissons secs épars (touffes paille clairsemées) ---
export const SCRUB = {
  density: 0.02, // touffes par unité² (très clairsemé)
  maxCount: 3000,
  height: 0.9,
  width: 0.9,
  jitter: 0.5,
  padExclusion: 30,
  seed: 29,
  colors: { base: '#6f5f33', mid: '#9c8a4a', tip: '#cdbb79' },
} as const

// Brume d'horizon du désert (plus chaude/sableuse que la prairie).
export const DESERT_FOG_COLOR = '#ecd096'
