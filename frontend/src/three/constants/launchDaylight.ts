// Conditions atmosphériques : plein jour ensoleillé, ciel bleu physique
// profond, soleil haut dans le ciel — identiques pour tous les sites.

// Soleil haut et de côté : ombres portées nettes et courtes, pleine lumière.
export const SUN_POSITION: [number, number, number] = [45, 62, 30]

export const SUN_LIGHT_POSITION: [number, number, number] = [22, 31, 15]

// Ciel de beau temps : turbidity basse = air limpide, rayleigh standard =
// bleu franc au zénith qui s'éclaircit vers l'horizon.
export const SKY = {
  distance: 450000,
  turbidity: 2.6,
  rayleigh: 1.1,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.8,
}

export interface CloudPuffConfig {
  seed: number
  position: [number, number, number]
  bounds: [number, number, number]
  segments: number
  volume: number
  opacity: number
  growth: number
}

// Moins de nuages et moins de segments par nuage : rendu allégé, le ciel reste
// habité sans surcharger le fill-rate.
export const CLOUD_PUFFS: CloudPuffConfig[] = [
  { seed: 1,  position: [-110, 60, -160], bounds: [32, 9, 18],  segments: 12, volume: 22, opacity: 0.9,  growth: 5 },
  { seed: 3,  position: [145,  52,   70], bounds: [28, 7, 15],  segments: 11, volume: 18, opacity: 0.78, growth: 4 },
  { seed: 5,  position: [15,   78, -220], bounds: [36, 10, 20], segments: 13, volume: 24, opacity: 0.88, growth: 6 },
  { seed: 23, position: [200,  56,  -20], bounds: [30, 8, 16],  segments: 12, volume: 20, opacity: 0.8,  growth: 5 },
]

export const CLOUD_SEGMENT_LIMIT = 120
export const CLOUD_DRIFT_SPEED = 0.06

// IBL plein air : panneaux couvrant voûte céleste, disque solaire, horizon
// et rebond pelouse — les métaux de la fusée réfléchissent un ciel de jour.
export interface IblPanelConfig {
  form: 'rect' | 'circle' | 'ring'
  intensity: number
  position: [number, number, number]
  scale: number | [number, number, number]
  color: string
}

export const IBL_PANELS: IblPanelConfig[] = [
  // Voûte céleste bleu clair
  { form: 'rect',   intensity: 1.6, position: [0, 20, 0],   scale: [60, 60, 1], color: '#8fbEEA' },
  // Disque solaire — blanc chaud, intense
  { form: 'circle', intensity: 9,   position: [22, 31, 15], scale: 6,           color: '#fff6e2' },
  // Bandeau d'horizon clair tout autour
  { form: 'rect',   intensity: 1.1, position: [0, 4, -40],  scale: [90, 12, 1], color: '#d6e6f2' },
  { form: 'rect',   intensity: 1.1, position: [0, 4,  40],  scale: [90, 12, 1], color: '#d6e6f2' },
  // Rebond vert de la pelouse par en dessous
  { form: 'rect',   intensity: 0.6, position: [0, -14, 0],  scale: [60, 60, 1], color: '#3f5c28' },
]

// IBL baké une seule fois : 256 suffit pour des reflets diffus, moitié moins
// lourd à générer que 512.
export const IBL_RESOLUTION = 256

export const LIGHTING = {
  sunColor: '#fff4e0',   // soleil blanc chaud
  sunIntensity: 3.1,     // plein soleil
  skyTint: '#bcd8f5',    // ciel bleu clair
  groundTint: '#4a6a2c', // rebond herbe
  hemiIntensity: 0.85,   // remplissage ciel/sol généreux
}

// Rendu : exposition plein jour et fond ciel clair (visible avant le chargement
// du shader de ciel).
export const DAYLIGHT_EXPOSURE = 1.05
export const DAYLIGHT_BACKGROUND = '#a9cdec'
