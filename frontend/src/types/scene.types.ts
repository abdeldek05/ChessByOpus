// Ambiance de la scène de lancement : jour (golden hour) ou nuit (lune + étoiles).
export type SceneMode = 'day' | 'night'

// Mode de caméra pendant le vol :
// - 'follow' : suit le King de près, orbite libre (défaut).
// - 'radar'  : posée au radar, regarde les fusées monter (vue du défenseur).
// - 'wide'   : fixe en recul, cadre tout (pas de tir + trajectoires + radars).
export type CameraMode = 'follow' | 'radar' | 'wide'

// Biome du décor selon le site de lancement : prairie (défaut) ou désert
// (sable, dunes, cactus, oasis — ex. midāna en Arabie saoudite).
export type SceneBiome = 'meadow' | 'desert'
