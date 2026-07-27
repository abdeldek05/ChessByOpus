// Conditions atmosphériques : NUIT (lune basse, lumière froide faible, ciel
// étoilé). Pendant du jour golden hour (launchDaylight.ts) : le bouton ☀/☾
// (DayNightToggle) bascule entre les deux jeux de constantes, lus par
// LaunchSceneCanvas selon `mode`. Pas de HDRI nuit disponible (une seule HDRI
// golden hour dans public/) → le fond de ciel nuit est une COULEUR sombre +
// des étoiles (drei <Stars>), pas une image ; l'IBL nuit se limite donc à un
// éclairage direct froid faible.

/** Couleur de fond du ciel nuit (bleu nuit profond, pas noir pur — un noir
 *  total écraserait tout relief et donnerait un rendu plat/vide). */
export const NIGHT_SKY_COLOR = '#05080f'

// Direction de la « lune » (source lumineuse directe de nuit) : plus HAUTE que
// le soleil golden hour rasant (élévation 5°), pour un éclairage vertical doux
// façon clair de lune, sans les ombres démesurées d'une source rasante.
export const NIGHT_MOON = {
  elevationDeg: 55,
  azimuthDeg: 40,
} as const

/** Direction unitaire de la lune (même convention sphérique que getSunDirection). */
export function getMoonDirection(): [number, number, number] {
  const phi = (Math.PI / 180) * (90 - NIGHT_MOON.elevationDeg)
  const theta = (Math.PI / 180) * NIGHT_MOON.azimuthDeg
  const sinPhi = Math.sin(phi)
  return [sinPhi * Math.sin(theta), Math.cos(phi), sinPhi * Math.cos(theta)]
}

// Éclairage nuit : bien plus FAIBLE et FROID que le jour (clair de lune bleuté).
// Pas d'IBL HDRI la nuit → l'hémisphérique porte l'essentiel de l'ambiance.
export const NIGHT_LIGHTING = {
  moonColor: '#9db4d8', // clair de lune bleu-argent
  moonIntensity: 0.5,
  skyTint: '#2a3d5c', // remplissage hémisphérique : ciel nuit
  groundTint: '#12161c', // rebond sol très sombre
  hemiIntensity: 0.5,
  // Rim/fill léger, froid : garde un filet de modelé sur les faces à l'ombre.
  rimColor: '#3a4a66',
  rimIntensity: 0.25,
}

/** Brume d'horizon la nuit (voir useHorizonHazeMaterial) : bien plus DISCRÈTE
 *  que le jour (une bande claire délaverait le ciel étoilé) et teintée froid
 *  lunaire au lieu du golden hour chaud. */
export const NIGHT_HAZE = {
  densityFactor: 0.45, // brume beaucoup plus légère qu'en plein jour
  moonTint: '#4a5f85', // reflet lunaire froid (remplace le golden hour chaud)
}

/** Intensité de l'IBL la nuit : quasi nulle (pas d'HDRI éclairante) — les
 *  reflets métalliques restent discrets, cohérents avec l'ambiance sombre. */
export const NIGHT_ENVIRONMENT_INTENSITY = 0.12

/** Exposition nuit : abaissée (scène sombre) — AgX gère le roll-off, on
 *  descend juste le niveau global sans écraser les hautes lumières. */
export const NIGHT_EXPOSURE = 0.75

/** Couleur du fog de distance la nuit : bleu nuit, se fond avec NIGHT_SKY_COLOR. */
export const NIGHT_FOG_COLOR = '#0e1a2e'
