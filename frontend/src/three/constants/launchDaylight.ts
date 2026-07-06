// Conditions atmosphériques : NUIT CLAIRE ÉTOILÉE. Ciel nuit bleu profond,
// étoiles, lune comme source principale. Sol lisible en lumière lunaire froide.
// (Le fichier garde son nom historique pour ne pas casser les imports.)

// Lune : position dans le ciel (haute et de côté) — donne des ombres douces.
export const MOON_POSITION: [number, number, number] = [45, 68, 30]

// Position de la lumière directionnelle (lune) alignée sur MOON_POSITION,
// rapprochée pour une shadow-camera compacte.
export const SUN_LIGHT_POSITION: [number, number, number] = [22, 34, 15]

// Dôme de ciel nuit : dégradé + disque lunaire + halo + nuages peints dans le
// shader (statique, quasi gratuit).
export const NIGHT_SKY = {
  // Couleur du zénith (haut) et de l'horizon (bas) du dégradé de ciel nuit.
  zenithColor: '#05070f',
  horizonColor: '#182842',
  // Disque lunaire et son halo.
  moonColor: '#eef2ff',
  moonHaloColor: '#3a4a72',
  moonSize: 0.045,
  moonHalo: 0.28,
}

// Étoiles (drei <Stars>) figées : champ discret, sans animation (speed 0).
export const STARS = {
  radius: 300,
  depth: 60,
  count: 1800,
  factor: 4,
  saturation: 0,
  fade: true,
}

// IBL nuit : panneaux faibles et froids — la lune éclaire les métaux, le ciel
// nuit se reflète en bleu profond, le sol renvoie très peu.
export interface IblPanelConfig {
  form: 'rect' | 'circle' | 'ring'
  intensity: number
  position: [number, number, number]
  scale: number | [number, number, number]
  color: string
}

export const IBL_PANELS: IblPanelConfig[] = [
  // Voûte nuit bleu profond
  { form: 'rect',   intensity: 0.6,  position: [0, 20, 0],   scale: [60, 60, 1], color: '#13203c' },
  // Disque lunaire — froid, source de reflet principale
  { form: 'circle', intensity: 5.5,  position: [22, 34, 15], scale: 6,           color: '#eef2ff' },
  // Halo péri-lunaire
  { form: 'ring',   intensity: 1.8,  position: [22, 34, 15], scale: 18,          color: '#5f74a8' },
  // Bandeau d'horizon nuit
  { form: 'rect',   intensity: 0.6,  position: [0, 4, -40],  scale: [90, 12, 1], color: '#22314f' },
  { form: 'rect',   intensity: 0.6,  position: [0, 4,  40],  scale: [90, 12, 1], color: '#22314f' },
  // Rebond sol
  { form: 'rect',   intensity: 0.35, position: [0, -14, 0],  scale: [60, 60, 1], color: '#1a2416' },
]

// 512 : reflets nettement plus fins sur les métaux (mât, garde-corps, radar).
// Bake unique (frames={1}), donc sans coût par frame malgré la résolution.
export const IBL_RESOLUTION = 512

export const LIGHTING = {
  moonColor: '#d6e0ff',    // clair de lune froid mais généreux
  moonIntensity: 2.6,      // fort clair de lune : terrain bien lisible
  skyTint: '#3a4e7a',      // remplissage ciel nuit clair
  groundTint: '#1c2614',   // rebond sol
  hemiIntensity: 0.95,     // ambiance nuit lumineuse
}

// Rendu : exposition nuit remontée (terrain visible) et fond bleu nuit.
export const DAYLIGHT_EXPOSURE = 1.15
export const DAYLIGHT_BACKGROUND = '#0d1730'
