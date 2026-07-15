// Implantation de la scène de lancement. Le banc de tir est à l'origine ; le
// radar et la trajectoire du vol sont projetés dans leur direction géographique
// réelle, à leur VRAIE distance — une seule échelle LINÉAIRE pour toute la
// scène (voir METERS_PER_SCENE_UNIT), plus de compression en racine carrée ni
// de normalisation différente par vol. Le terrain détaillé (relief, herbe,
// arbres) reste une zone PROCHE de taille fixe autour du pas de tir ; au-delà,
// un sol lointain simplifié (FarGround) s'étend jusqu'à la vraie distance du
// radar ou du point d'impact (voir LaunchSceneCanvas).
//
// Le sol est centré sur l'origine monde ; le relief est aplani autour de
// LAUNCH_CENTER pour asseoir la base à plat. Base, fusée, herbe, anneaux et
// radar sont tous placés relativement à LAUNCH_CENTER.
export const LAUNCH_CENTER: [number, number, number] = [0, 0, 0]

// Caméra : légèrement en hauteur, côté +Z, cadrée sur le plateau.
export const CAMERA_POSITION: [number, number, number] = [14, 6, 20]
export const CAMERA_TARGET: [number, number, number] = [0, 3.4, -4]

// Échelle UNIQUE de toute la scène : 1 unité scène = 8 mètres réels. Choisie
// COMPACTE pour le réalisme à grande distance : un radar à 60 km réels tombe à
// ~7500 unités (et non 300 000 comme à l'ancienne échelle 0.2), ce qui garde
// les coordonnées GPU sous le seuil où les flottants 32-bit se mettent à
// trembler (jitter des vertices, ombres qui sautent). Radar
// (computeRadarSceneOffset), trajectoire (useTrajectoryPlayback) et terrain
// partagent tous cette constante — un radar à 50 km et un impact à 50 km
// tombent au même endroit visuel. Le complexe de lancement, la rampe et la
// végétation sont dimensionnés en unités ABSOLUES (indépendantes de cette
// échelle) : les changer ici ne les redimensionne PAS, ne déplace que les
// objets projetés à leur distance réelle (radars, trajectoire).
export const METERS_PER_SCENE_UNIT = 8

// Rayon de la zone DENSE du terrain (subdivision fine, herbe/arbres proches,
// ombres nettes) autour du pas de tir — la zone regardée de près au décollage.
// Au-delà, le terrain unifié continue avec une subdivision plus grossière et
// une densité de végétation décroissante (plus de bascule proche/lointain).
// ~300 unités ≈ 2.4 km réels de terrain soigné autour de la base.
export const TERRAIN_EDGE_RADIUS = 300

// Demi-étendue de la SHADOW-CAMERA du soleil/de la lune : couvre le pad,
// l'herbe 3D (GrassField, rayon 160) et les chênes proches. Volontairement
// SERRÉE : le texel d'ombre vaut 2·R/2048 — à 160 u ≈ 0.156 u ≈ 1.25 m réel,
// net. Ne JAMAIS y mettre le rayon du terrain (des milliers d'unités) : le
// texel dépasserait 2 u et les ombres deviendraient des taches illisibles.
export const SHADOW_COVERAGE_RADIUS = 160
