// Implantation de la scène de lancement sur la map. Le banc de tir n'est plus
// au centre : on le pousse vers un bord de la pelouse (grand espace dégagé
// devant, vers -Z) et la caméra démarre dos à ce bord.
//
// Le sol couvre toute la map centré sur l'origine monde ; le relief est aplani
// autour de LAUNCH_CENTER (et non (0,0)) pour asseoir la base à plat. La base,
// la fusée, l'herbe et le radar sont tous placés relativement à LAUNCH_CENTER.

// Le banc de tir est décalé vers +Z, proche du bord de la pelouse (LAWN_SIZE
// vaut 900, donc bord à ±450 ; on garde une marge).
export const LAUNCH_CENTER: [number, number, number] = [0, 0, 360]

// Caméra : légèrement en hauteur, côté +Z (dos au bord), cadrée sur le plateau.
export const CAMERA_POSITION: [number, number, number] = [14, 6, 380]
export const CAMERA_TARGET: [number, number, number] = [0, 3.4, 356]
