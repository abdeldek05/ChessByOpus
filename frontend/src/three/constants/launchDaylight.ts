// Conditions atmosphériques : JOUR, GOLDEN HOUR (soleil bas, lumière chaude).
// (Le fichier garde son nom historique `launchDaylight` pour ne pas casser les
// imports.) Ciel + IBL fournis par une VRAIE HDRI photographique (voir
// EnvironmentSky) — plus de ciel procédural Preetham : le rendu (couleurs,
// nuages, halo solaire) vient d'une capture réelle, alignée avec l'éclairage
// direct (SunLight) pour que les ombres portées correspondent au soleil visible
// dans le ciel.

/** Chemin de l'HDRI (public/, servi tel quel) : golden hour, soleil bas sur l'horizon. */
export const HDRI_PATH = '/hdri/golden_hour_sky.hdr'

// Position du soleil DANS CETTE HDRI PRÉCISE (déterminée par analyse du pixel
// le plus lumineux du fichier — voir décodage RGBE). SOURCE UNIQUE de la
// direction du soleil : SunLight en dérive sa position (getSunDirection
// ci-dessous), pour que les ombres portées et le halo visible dans le ciel
// restent alignés. Si l'HDRI change, ces deux valeurs doivent être re-mesurées.
export const SKY = {
  elevationDeg: 5,
  azimuthDeg: 49,
} as const

/** Direction unitaire du soleil (même convention sphérique que l'equirect HDRI). */
export function getSunDirection(): [number, number, number] {
  const phi = (Math.PI / 180) * (90 - SKY.elevationDeg)
  const theta = (Math.PI / 180) * SKY.azimuthDeg
  const sinPhi = Math.sin(phi)
  return [sinPhi * Math.sin(theta), Math.cos(phi), sinPhi * Math.cos(theta)]
}

// Lumière directe + remplissage, teintes chaudes golden hour (accent qui vient
// s'ajouter à l'éclairage ambiant de l'IBL — sert surtout à porter des ombres
// nettes et cohérentes avec le soleil visible dans l'HDRI, l'IBL seul n'en
// projette pas).
export const LIGHTING = {
  sunColor: '#ffcf94', // soleil doré chaud, légèrement plus saturé
  sunIntensity: 1.75,
  skyTint: '#bcd3f0', // remplissage hémisphérique : ciel clair
  groundTint: '#3c5a2a', // rebond sol vert (prairie luxuriante, cf. LAWN/GRASS_COLORS)
  hemiIntensity: 1.2,
  // Rim/fill light en contre-jour : froid (bleu-violet crépusculaire) —
  // débouche les faces à l'ombre (contre-jour) sans les éclairer aussi fort
  // que le soleil, pour garder du modelé.
  rimColor: '#c9d4ea',
  rimIntensity: 0.85,
}

// Intensité de l'IBL (éclairage image) appliquée globalement aux matériaux —
// reflets réalistes sur métaux/béton depuis la vraie HDRI. Baké une fois par
// chargement, pas de coût continu. MODÉRÉMENT remontée (rendu maximal, voir
// feedback_gpu_budget) : une valeur trop haute cumulée aux god rays/bloom a
// fait cramer toute l'image en blanc uniforme (constaté à 1.35) — le gain de
// qualité doit rester perceptible sans saturer le tone mapping AgX.
export const ENVIRONMENT_INTENSITY = 1.15

// Rendu : tone mapping AgX (voir LaunchSceneCanvas), exposition calée jour.
// AgX gérant déjà le roll-off des hautes lumières, l'exposition reste neutre
// (1.0) — à ajuster à l'œil si la scène paraît trop sombre/claire.
export const DAYLIGHT_EXPOSURE = 1.0

// Couleur du fog de distance : ÉCHANTILLONNÉE depuis la bande horizon de
// l'HDRI (moyenne des pixels autour de l'équateur de l'image, tone-mappée) —
// pour que le sol lointain se fonde dans le ciel sans « mur » de couleur au
// bord du monde, quelle que soit l'HDRI utilisée.
export const FOG_COLOR = '#baada6'
