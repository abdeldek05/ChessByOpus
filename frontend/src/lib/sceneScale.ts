// FONDATION D'ÉCHELLE de la scène de lancement 3D — source de vérité UNIQUE.
//
// Principe (map FIXE) : le sol 3D a une taille CONSTANTE (SCENE_RADIUS unités).
// La trajectoire du vol et le radar sont NORMALISÉS par un même facteur, calculé
// par scénario, pour que la plus grande distance à montrer (portée du vol OU
// distance du radar) occupe une fraction confortable de la map. Résultat : la
// fusée reste toujours dans le cadre et tombe visuellement au bon endroit PAR
// RAPPORT au radar (les deux partagent le même facteur), quelle que soit la
// vraie portée en km. La distance métrique EXACTE vit sur la carte tactique 2D.

// Le sol est structuré en DEUX couches concentriques (approche « centre
// détaillé + reste plat », la plus stable) :
//   1. zone DÉTAILLÉE (DETAIL_RADIUS) : relief + subdivision fine, autour du pas
//      de tir — là où la caméra regarde le décollage et où la fusée évolue ;
//   2. sol PLAT lointain (FAR_GROUND_RADIUS) : un simple grand plan à Y=0 qui
//      remplit l'horizon pour presque zéro coût (2 triangles), fondu dans le fog.
// Le relief (sampleGroundHeight) s'éteint à 0 au bord de la zone détaillée, donc
// les deux couches se raccordent à la même hauteur, sans marche ni z-fighting.

/** Rayon de la zone détaillée (relief + subdivision fine) autour du pas de tir. */
export const DETAIL_RADIUS = 4000

/** Rayon du sol plat lointain qui remplit l'horizon (bien au-delà du détaillé). */
export const FAR_GROUND_RADIUS = 60000

/** Référence de NORMALISATION de la trajectoire : la fusée (et le radar) sont
 *  ramenés dans la zone détaillée, donc la portée max occupe une fraction de
 *  DETAIL_RADIUS (pas du plat lointain, qui n'est que du décor). */
export const SCENE_RADIUS = DETAIL_RADIUS

/** Fraction du rayon que la plus grande distance du scénario doit occuper :
 *  garde une marge pour que rien ne touche le bord (impact, radar, cadrage). */
const USABLE_FRACTION = 0.8

/** Distance scène cible pour la plus grande distance réelle du scénario. */
const TARGET_SCENE_DISTANCE = SCENE_RADIUS * USABLE_FRACTION

/**
 * Facteur de normalisation (mètres réels → unités scène) partagé par le radar
 * et la trajectoire d'un MÊME scénario. `maxRealDistanceM` = la plus grande
 * distance réelle à représenter (portée/apogée du vol OU distance du radar le
 * plus loin, le plus grand des deux).
 *
 * unités_scène = mètres_réels × facteur
 */
export function computeSceneScale(maxRealDistanceM: number): number {
  if (maxRealDistanceM < 1) return TARGET_SCENE_DISTANCE // évite division par ~0
  return TARGET_SCENE_DISTANCE / maxRealDistanceM
}
