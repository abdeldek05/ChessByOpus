// Arbres procéduraux réalistes : tronc effilé + houppier composé de plusieurs
// amas de feuillage (canopée irrégulière, pas une simple boule). Répartis en
// bosquets sur la map, jamais sur la zone du pas de tir. Golden hour → feuillage
// vert profond réchauffé.

// Silhouette d'un arbre : hauteur de tronc, rayons, et amas de feuillage.
export const TREE = {
  trunkHeight: 5.5,
  trunkRadiusBottom: 0.45,
  trunkRadiusTop: 0.22,
  trunkColor: '#5a4632', // écorce brune
  // Amas de feuillage : décalage (x,y,z) depuis le sommet du tronc + rayon.
  // Plusieurs blobs de tailles variées → houppier touffu et irrégulier.
  blobs: [
    { off: [0, 0.4, 0] as [number, number, number], r: 2.6 },
    { off: [1.3, -0.2, 0.6] as [number, number, number], r: 1.9 },
    { off: [-1.1, 0.1, -0.8] as [number, number, number], r: 2.0 },
    { off: [0.5, 1.2, -1.0] as [number, number, number], r: 1.7 },
    { off: [-0.6, 0.9, 1.1] as [number, number, number], r: 1.6 },
  ],
  leafColor: '#3d5223', // vert feuillage profond
  leafColorLight: '#5c7a30', // reflets plus clairs
} as const

// Nombre d'arbres et zone de semis : anneau autour du pas de tir (pas trop
// près), en évitant la plateforme. Groupés en bosquets par du bruit de position.
export const TREE_COUNT = 140
export const TREE_INNER_RADIUS = 55 // pas d'arbres avant ce rayon (dégagement)
export const TREE_SEED = 313
export const TREE_SIZE_JITTER = 0.35
