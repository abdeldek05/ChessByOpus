// Conditions atmosphériques : JOUR, GOLDEN HOUR (soleil rasant, lumière chaude).
// (Le fichier garde son nom historique `launchDaylight` pour ne pas casser les
// imports.) Objectif : base d'un rendu photo-réaliste — ciel physique, soleil
// bas doré, IBL chaud pour de vrais reflets sur les métaux et l'eau.

// Direction du SOLEIL bas sur l'horizon (golden hour). Vecteur monde ; sert au
// ciel physique (drei <Sky>) ET à la lumière directionnelle (SunLight).
export const SUN_DIRECTION: [number, number, number] = [-38, 14, 26]

// Position de la lumière directionnelle (soleil) : alignée sur SUN_DIRECTION,
// rapprochée pour une shadow-camera exploitable.
export const SUN_LIGHT_POSITION: [number, number, number] = [-60, 22, 40]

// Réglages du ciel physique <Sky> (drei) — Preetham. Turbidité modérée, forte
// diffusion Rayleigh pour un ciel golden hour saturé, soleil bas.
export const SKY = {
  turbidity: 5,
  rayleigh: 2.6,
  mieCoefficient: 0.008,
  mieDirectionalG: 0.86,
  /** Élévation/azimut du soleil (degrés) — bas sur l'horizon. */
  elevationDeg: 7,
  azimuthDeg: 160,
  distance: 2000,
} as const

// Lumière directe + remplissage, teintes chaudes golden hour.
export const LIGHTING = {
  sunColor: '#ffd9a0', // soleil doré chaud
  sunIntensity: 3.4, // fort, rasant
  skyTint: '#bcd3f0', // remplissage hémisphérique : ciel clair
  groundTint: '#3a3320', // rebond sol chaud (terre/herbe sèche)
  hemiIntensity: 1.1,
}

// IBL : preset HDRI d'extérieur au coucher de soleil (reflets chauds réalistes
// sur métaux et eau). Baké une fois — pas de coût continu.
export const ENVIRONMENT_PRESET = 'sunset' as const
// Intensité de l'IBL appliquée globalement aux matériaux.
export const ENVIRONMENT_INTENSITY = 1.1

// Rendu : tone mapping ACES, exposition et fond calés jour.
export const DAYLIGHT_EXPOSURE = 1.0
export const DAYLIGHT_BACKGROUND = '#dcc9a8' // brume chaude d'horizon (fond)

// Brume atmosphérique de profondeur (golden hour) : teinte dorée lumineuse qui
// fond l'horizon et donne l'échelle. Le fog commence à FOG_NEAR_FRAC × terrain
// et sature à FOG_FAR_FRAC × terrain — dosé pour envelopper sans noyer le radar.
export const FOG_COLOR = '#e8d3ac'
export const FOG_NEAR_FRAC = 0.35
export const FOG_FAR_FRAC = 1.15
