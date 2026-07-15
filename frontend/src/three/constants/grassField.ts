// Herbe instanciée à DENSITÉ UNIFORME et dense PARTOUT sur la map, via un
// STREAMING PAR TUILES autour de la caméra : la map est découpée en tuiles
// carrées fixes ; seules les tuiles dans un rayon autour de la caméra sont
// générées/montées à un instant donné (voir useGrassTiles). Le coût reste
// borné quelle que soit l'étendue totale du terrain — l'herbe est dense
// partout où la caméra se trouve, pas seulement près du pas de tir.

// Taille d'une tuile (unités) : assez grande pour peu de tuiles actives à la
// fois (peu de composants React montés), assez petite pour un chargement fin
// quand la caméra se déplace.
export const GRASS_TILE_SIZE = 80

// Rayon de STREAMING (unités) autour de la caméra : les tuiles dont le centre
// est à moins de cette distance sont actives. Borne le nombre de tuiles vivantes
// à tout instant : ~ (2×radius/tileSize)² tuiles au maximum.
export const GRASS_STREAM_RADIUS = 260

// Densité d'herbe (touffes par unité² de tuile) — LA MÊME PARTOUT, aucune
// décroissance avec la distance : c'est le streaming (pas la densité) qui
// gère le coût.
export const GRASS_DENSITY = 0.5
// Plafond d'instances PAR TUILE (garde-fou, ne devrait jamais être atteint à
// cette taille de tuile).
export const GRASS_MAX_PER_TILE = 4000

// Rayon intérieur laissé libre autour de la dalle du pas de tir (pas d'herbe
// qui traverse la plateforme) — appliqué uniquement aux tuiles qui chevauchent
// l'origine.
export const GRASS_INNER_RADIUS = 9

// Taille d'une touffe (unités) : hauteur et largeur, avec variation aléatoire.
export const GRASS_HEIGHT = 1.4
export const GRASS_WIDTH = 1.2
export const GRASS_SIZE_JITTER = 0.5

// Palette des brins (golden hour), ACCORDÉE au gazon du sol (pack LAWN) : même
// vert foncé de base, vert moyen = LAWN.colorMid, pointe = LAWN.colorYellow —
// les touffes 3D se fondent dans le splat au lieu de trancher dessus.
export const GRASS_COLORS = {
  base: '#33421f',
  mid: '#556b2c',
  tip: '#a8a24e',
} as const

// Résolution de la texture de touffe (alpha) et graine du semis (dérivée par
// tuile — voir generateGrassTile).
export const GRASS_TEXTURE_SIZE = 128
export const GRASS_SEED = 7
