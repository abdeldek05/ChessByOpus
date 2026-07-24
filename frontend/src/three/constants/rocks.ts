// Rochers procéduraux du décor : icosaèdres déformés par du bruit, SEMÉS sur
// TOUTE la map (comme l'herbe/les chênes) — quelques VARIANTES de forme
// (géométrie partagée, peu coûteuse) répétées en InstancedMesh à de nombreuses
// positions, plutôt qu'une liste de positions fixes. Crédibilise le relief
// minéral sans modèle externe lourd. Unités scène (1 u = 8 m).

// Teintes de la pierre (granit gris chaud sous golden hour).
export const ROCK_COLORS = {
  light: '#8a8377',
  dark: '#4d4842',
} as const

// Amplitude de la déformation par le bruit (fraction du rayon).
export const ROCK_NOISE_AMOUNT = 0.35

// Nombre de FORMES distinctes générées (variété visuelle) — chacune devient un
// InstancedMesh séparé, partagé par toutes ses occurrences sur la map.
export const ROCK_VARIANT_COUNT = 8
// Rayon de base d'une variante (avant l'échelle aléatoire par instance).
export const ROCK_BASE_RADIUS = 3.2
// Graine de génération des variantes (formes), distincte du semis (positions).
export const ROCK_VARIANT_SEED = 7331

// Semis : nombre total d'instances, portée et échelle — mêmes leviers que le
// scatter GLB (useScatterInstances), pas de position fixe. Densité RELEVÉE
// (260 → 420) pour crédibiliser un sol trop nu — 8 variantes instanciées, coût
// GPU négligeable (voir feedback_gpu_budget, on reste très en deçà du pic).
export const ROCK_SCATTER = {
  count: 420,
  seed: 8823,
  baseScale: 1,
  scaleJitter: 0.75,
  innerRadius: 45,
  cutoffRadius: 30000,
  sink: 0.6,
} as const
