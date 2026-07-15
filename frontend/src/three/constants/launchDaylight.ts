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

// Position du disque solaire (DaylightSky) : élévation/azimut, bas sur l'horizon.
export const SKY = {
  elevationDeg: 7,
  azimuthDeg: 160,
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

// Brume atmosphérique de profondeur (golden hour) : MÊME couleur que le fond
// (DAYLIGHT_BACKGROUND) et que l'horizon du SkyDome — c'est cette égalité qui
// rend le bord du terrain invisible (il se dissout dans le ciel). Le fog
// (linéaire) commence à FOG_NEAR_FRAC × terrainRadius et sature à
// FOG_FAR_FRAC × terrainRadius : le pas de tir reste net, l'horizon fond pile
// au bord du terrain, quel que soit le scénario (radar proche ou à 60 km).
export const FOG_COLOR = '#dcc9a8'
export const FOG_NEAR_FRAC = 0.3
export const FOG_FAR_FRAC = 1.0

// Dégagement du fog EN ALTITUDE : quand la caméra suit la fusée qui monte, la
// brume dense de l'horizon au sol masquerait la fusée et le vol. Le fog `far`
// s'ÉLARGIT progressivement avec la hauteur de la caméra (AltitudeFog) — dense
// au ras du sol (horizon caché, immersif), quasi dégagé en l'air (fusée nette).
// `FOG_ALTITUDE_START` : hauteur (unités) où le dégagement commence.
// `FOG_ALTITUDE_FULL` : hauteur où le fog far est à son maximum étendu.
// `FOG_FAR_ALTITUDE_MULT` : facteur d'élargissement max du far à haute altitude.
export const FOG_ALTITUDE_START = 40
export const FOG_ALTITUDE_FULL = 600
export const FOG_FAR_ALTITUDE_MULT = 6

// Dégradé du dôme de ciel (SkyDome) : zénith bleu doux → horizon brume chaude.
// L'horizon DOIT rester égal à FOG_COLOR/DAYLIGHT_BACKGROUND (fondu invisible).
export const SKY_GRADIENT = {
  zenith: '#8aa8cf',
  horizon: '#dcc9a8',
} as const
