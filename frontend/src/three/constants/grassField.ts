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
export const GRASS_STREAM_RADIUS = 600

// Densité d'herbe (touffes par unité² de tuile) — LA MÊME PARTOUT, aucune
// décroissance avec la distance : c'est le streaming (pas la densité) qui
// gère le coût.
export const GRASS_DENSITY = 0.16
// Plafond d'instances PAR TUILE (garde-fou, ne devrait jamais être atteint à
// cette taille de tuile).
export const GRASS_MAX_PER_TILE = 4000

// Rayon intérieur laissé TOTALEMENT libre autour de la dalle du pas de tir
// (pas d'herbe qui traverse la plateforme) — calé sur le demi-côté du gradin
// le plus large (PAD_TIERS[0].half = 26 * PAD_SCALE, voir launchComplex.ts),
// + marge. Appliqué uniquement aux tuiles qui chevauchent l'origine.
export const GRASS_INNER_RADIUS = 46

// Zone tampon juste après le pad : densité légèrement réduite (raccord plus
// doux entre la dalle nue et l'herbe pleine densité) plutôt qu'un passage net.
export const GRASS_LOW_DENSITY_RADIUS = 90
export const GRASS_LOW_DENSITY_FACTOR = 0.55

// Taille d'une touffe (unités) : hauteur et largeur, avec variation aléatoire.
// Prairie fraîche (abaissée depuis 4.5) : touffes plus courtes et fines,
// aspect entretenu plutôt que savane haute.
export const GRASS_HEIGHT = 3.5
export const GRASS_WIDTH = 1.9
export const GRASS_SIZE_JITTER = 0.5

// Palette des brins (prairie VERTE luxuriante), ACCORDÉE au gazon du sol (pack
// LAWN) : même dominante verte fraîche — les touffes 3D se fondent dans le
// splat au lieu de trancher dessus.
export const GRASS_COLORS = {
  // Luminosité remontée (le pied occupe la plus grande surface du triangle de
  // brin — trop sombre au pied assombrissait toute la touffe à l'écran).
  base: '#2f4a1f', // pied : vert ombré mais lisible (pas quasi-noir)
  mid: '#4f7d38', // milieu : vert franc lumineux, identique à LAWN.colorMid
  tip: '#96c95f', // pointe : vert clair vif, identique à LAWN.colorLight
} as const

// Résolution de la texture de touffe (alpha) et graine du semis (dérivée par
// tuile — voir generateGrassTile).
export const GRASS_TEXTURE_SIZE = 128
export const GRASS_SEED = 7
