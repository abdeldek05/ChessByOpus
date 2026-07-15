// Conditions NOCTURNES de la scène de lancement : ciel étoilé, clair de lune
// froid, fond et brume bleu nuit, exposition baissée. Pendant du fichier
// `launchDaylight.ts` (jour) — la bascule jour/nuit choisit l'un ou l'autre.

// Rendu : fond, brume et exposition de nuit.
export const NIGHT_BACKGROUND = '#0b1026'
export const NIGHT_FOG_COLOR = '#0d1226'
export const NIGHT_EXPOSURE = 0.55

// Clair de LUNE : directionnelle froide bleutée + remplissage hémisphérique
// très sombre (nuit claire, pas noir total — la scène reste lisible).
export const MOON_LIGHT = {
  color: '#bcd0ff',
  intensity: 1.1,
  skyTint: '#16203a',
  groundTint: '#090c12',
  hemiIntensity: 0.35,
}
// Position de la directionnelle lune (même logique que SUN_LIGHT_POSITION).
export const MOON_LIGHT_POSITION: [number, number, number] = [-55, 34, 38]

// Ciel étoilé (drei <Stars>) : points quasi gratuits qui scintillent doucement.
export const STARS = {
  radius: 640,
  depth: 90,
  count: 3500,
  factor: 5,
  speed: 0.4,
} as const

// Disque de lune émissif à l'horizon : le Bloom le fait rayonner.
export const MOON_DISC = {
  position: [-330, 210, 250] as [number, number, number],
  radius: 17,
  color: '#e9edff',
} as const

// IBL nocturne : reflets froids discrets sur les métaux.
export const NIGHT_ENVIRONMENT_PRESET = 'night' as const
export const NIGHT_ENVIRONMENT_INTENSITY = 0.35
