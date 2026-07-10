// Herbe instanciée autour du pas de tir : touffes en plans croisés (billboards)
// texturés, réparties sur un disque. Dense près de la base, s'éclaircit au loin
// pour rester performant. Golden hour → teintes vertes chaudes.

// Densité d'herbe (touffes par unité² de terrain) : le nombre d'instances est
// calculé à partir de la surface réellement couverte, pour peupler TOUT le
// terrain visible et pas seulement un îlot central.
export const GRASS_DENSITY = 0.9
// Plafond d'instances (garde-fou perf sur très grand terrain).
export const GRASS_MAX_COUNT = 60000
// Rayon minimal de semis (petit terrain) — au-delà on suit la taille du sol.
export const GRASS_MIN_RADIUS = 130
// Rayon intérieur laissé libre autour de la dalle du pas de tir (pas d'herbe
// qui traverse la plateforme).
export const GRASS_INNER_RADIUS = 9

// Taille d'une touffe (unités) : hauteur et largeur, avec variation aléatoire.
export const GRASS_HEIGHT = 1.4
export const GRASS_WIDTH = 1.2
export const GRASS_SIZE_JITTER = 0.5

// Palette des brins (golden hour) : base vert foncé → pointe jaune-vert claire,
// pour accompagner la variété du sol (vert, clair, jaune).
export const GRASS_COLORS = {
  base: '#33421f',
  mid: '#5c7330',
  tip: '#a6a852',
} as const

// Résolution de la texture de touffe (alpha) et graine du semis.
export const GRASS_TEXTURE_SIZE = 128
export const GRASS_SEED = 7

// Nombre de SECTEURS angulaires du champ d'herbe : chaque secteur est un
// InstancedMesh séparé avec sa propre bounding sphere → le frustum culling ne
// dessine que ce que la caméra regarde (gain perf, rendu identique).
export const GRASS_CHUNKS = 14
