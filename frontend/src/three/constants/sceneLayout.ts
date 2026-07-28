// Implantation de la scène de lancement : les repères et rayons FIXES, en unités
// absolues (pas de tir, caméra de départ, zone dense du terrain, couverture des
// ombres).
//
// ⚠️ L'ÉCHELLE de la scène ne vit PAS ici : elle est calculée PAR SCÉNARIO par
// `computeSceneScale` (voir lib/sceneScale.ts), à partir de la plus grande
// distance à représenter (radar le plus loin ou portée du vol), et circule dans
// la scène sous le nom `metersPerSceneUnit`. Ce fichier a longtemps déclaré une
// constante `METERS_PER_SCENE_UNIT = 8` présentée comme « l'échelle unique de
// toute la scène » : elle n'était en réalité importée NULLE PART, et sa valeur
// contredisait l'échelle réellement appliquée (~24 m/unité sur un scénario type).
// Elle a été supprimée — elle envoyait sur une fausse piste quiconque débogue
// l'échelle.
//
// Le sol est centré sur l'origine monde ; le relief est aplani autour de
// LAUNCH_CENTER pour asseoir la base à plat. Base, fusée, herbe, anneaux et
// radar sont tous placés relativement à LAUNCH_CENTER.
export const LAUNCH_CENTER: [number, number, number] = [0, 0, 0]

// Caméra : légèrement en hauteur, côté +Z, cadrée sur le plateau.
export const CAMERA_POSITION: [number, number, number] = [14, 6, 20]
export const CAMERA_TARGET: [number, number, number] = [0, 3.4, -4]

// Rayon de la zone DENSE du terrain (subdivision fine, herbe/arbres proches,
// ombres nettes) autour du pas de tir — la zone regardée de près au décollage.
// Au-delà, le terrain unifié continue avec une subdivision plus grossière et
// une densité de végétation décroissante (plus de bascule proche/lointain).
// Rayon en unités ABSOLUES : son équivalent en mètres dépend du scénario (voir
// l'avertissement en tête de fichier), il n'est donc pas chiffré ici.
export const TERRAIN_EDGE_RADIUS = 300

// Demi-étendue de la SHADOW-CAMERA du soleil/de la lune : couvre le pad,
// l'herbe 3D (GrassField, rayon 160) et les chênes proches. Volontairement
// SERRÉE : le texel d'ombre vaut 2·R/2048 — à 160 u il fait ~0.156 u, net. Ne
// JAMAIS y mettre le rayon du terrain (des milliers d'unités) : le texel
// dépasserait 2 u et les ombres deviendraient des taches illisibles.
export const SHADOW_COVERAGE_RADIUS = 160
