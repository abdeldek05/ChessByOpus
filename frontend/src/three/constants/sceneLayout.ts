// Implantation de la scène de lancement sur la map. Le banc de tir est au
// centre de la pelouse : le radar peut être projeté dans n'importe quelle
// direction géographique (Nord/Sud/Est/Ouest) et rester sur l'herbe, quel que
// soit son azimut réel (voir computeRadarSceneOffset, rayon borné à 400).
//
// Le sol couvre toute la map centré sur l'origine monde ; le relief est aplani
// autour de LAUNCH_CENTER pour asseoir la base à plat. Base, fusée, herbe et
// radar sont tous placés relativement à LAUNCH_CENTER.

// Banc de tir centré sur la pelouse (LAWN_SIZE vaut 900, bord à ±450 ; le radar
// reste dans un disque de 400 autour du centre, donc toujours sur l'herbe).
export const LAUNCH_CENTER: [number, number, number] = [0, 0, 0]

// Caméra : légèrement en hauteur, côté +Z, cadrée sur le plateau.
export const CAMERA_POSITION: [number, number, number] = [14, 6, 20]
export const CAMERA_TARGET: [number, number, number] = [0, 3.4, -4]
