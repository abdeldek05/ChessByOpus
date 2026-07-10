// Implantation de la scène de lancement. Le banc de tir est à l'origine ; le
// radar est projeté dans sa direction géographique réelle, à sa VRAIE distance
// (échelle FIXE 1:200, voir computeRadarSceneOffset). Le terrain n'est plus de
// taille fixe : il s'étend pour englober le radar quelle que soit sa distance
// (voir LaunchSceneCanvas), on ne compresse jamais la distance.
//
// Le sol est centré sur l'origine monde ; le relief est aplani autour de
// LAUNCH_CENTER pour asseoir la base à plat. Base, fusée, herbe, anneaux et
// radar sont tous placés relativement à LAUNCH_CENTER.
export const LAUNCH_CENTER: [number, number, number] = [0, 0, 0]

// Caméra : légèrement en hauteur, côté +Z, cadrée sur le plateau.
export const CAMERA_POSITION: [number, number, number] = [14, 6, 20]
export const CAMERA_TARGET: [number, number, number] = [0, 3.4, -4]

// Rayon du terrain autour du pas de tir : herbe et rochers se répartissent
// jusque-là. Dimensionné pour COUVRIR le vol entier (portée normalisée ~320 u,
// cf. TARGET_FLIGHT_EXTENT) : la fusée atterrit toujours SUR la map.
export const TERRAIN_EDGE_RADIUS = 420
