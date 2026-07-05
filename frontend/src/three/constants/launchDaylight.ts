// Conditions atmosphériques de la scène de lancement : identiques pour tous
// les sites (on simule un beau jour dégagé, pas la météo réelle du site).
// Soleil, ciel physique (shader de diffusion), brume d'horizon et nuages.

export const SUN_POSITION: [number, number, number] = [60, 46, -34]

// Position de la lumière directionnelle alignée sur le soleil du ciel,
// rapprochée de l'origine pour garder une shadow camera compacte.
export const SUN_LIGHT_POSITION: [number, number, number] = [30, 23, -17]

// Paramètres du shader de ciel (diffusion Rayleigh/Mie) : bleu profond au
// zénith, halo chaud discret autour du soleil, horizon légèrement laiteux.
export const SKY = {
  distance: 45000,
  turbidity: 3.2,
  rayleigh: 1.05,
  mieCoefficient: 0.0045,
  mieDirectionalG: 0.8,
}

// Brume d'horizon : fond la pelouse dans le ciel au loin.
export const HAZE_COLOR = '#dce9f3'

export interface CloudPuffConfig {
  seed: number
  position: [number, number, number]
  bounds: [number, number, number]
  segments: number
  volume: number
  opacity: number
  growth: number
}

// Cumulus épars, loin de la plateforme pour ne jamais gêner la lecture.
export const CLOUD_PUFFS: CloudPuffConfig[] = [
  { seed: 1, position: [-95, 55, -140], bounds: [26, 7, 14], segments: 16, volume: 18, opacity: 0.88, growth: 5 },
  { seed: 7, position: [75, 62, -110], bounds: [20, 6, 12], segments: 14, volume: 14, opacity: 0.8, growth: 4 },
  { seed: 3, position: [125, 48, 60], bounds: [24, 6, 12], segments: 14, volume: 15, opacity: 0.75, growth: 4 },
  { seed: 11, position: [-65, 44, 115], bounds: [18, 5, 10], segments: 12, volume: 10, opacity: 0.7, growth: 3 },
  { seed: 5, position: [10, 72, -195], bounds: [30, 8, 16], segments: 16, volume: 20, opacity: 0.85, growth: 5 },
]

export const CLOUD_SEGMENT_LIMIT = 220
export const CLOUD_DRIFT_SPEED = 0.08

// Panneaux lumineux de l'environnement baké (IBL) : donnent aux matériaux
// métalliques (fusée, garde-corps) des reflets de plein air — voûte bleue,
// disque solaire, bandeau d'horizon et rebond vert de la pelouse.
export interface IblPanelConfig {
  form: 'rect' | 'circle' | 'ring'
  intensity: number
  position: [number, number, number]
  scale: number | [number, number, number]
  color: string
}

export const IBL_PANELS: IblPanelConfig[] = [
  { form: 'rect', intensity: 2, position: [0, 16, 0], scale: [50, 50, 1], color: '#a3c8ec' },
  { form: 'circle', intensity: 8, position: [30, 23, -17], scale: 5, color: '#fff3da' },
  { form: 'rect', intensity: 1.2, position: [0, 3, -30], scale: [60, 10, 1], color: '#dfe9f2' },
  { form: 'rect', intensity: 1.2, position: [0, 3, 30], scale: [60, 10, 1], color: '#dfe9f2' },
  { form: 'rect', intensity: 0.8, position: [0, -12, 0], scale: [50, 50, 1], color: '#5d7a46' },
]

export const IBL_RESOLUTION = 256

export const LIGHTING = {
  sunColor: '#fff4e0',
  sunIntensity: 2.3,
  skyTint: '#bfd9f2',
  groundTint: '#57713f',
  hemiIntensity: 0.6,
}
