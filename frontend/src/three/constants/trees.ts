// Arbres procéduraux du décor : tronc effilé + houppier composé de plusieurs
// amas de feuillage (canopée irrégulière, pas une simple boule), SEMÉS en
// bosquets sur toute la map (comme les rochers/l'herbe) — pas de modèle 3D
// externe à charger. Golden hour → feuillage vert profond réchauffé.

// Silhouette d'un arbre : hauteur de tronc, rayons, et amas de feuillage.
export const TREE = {
  trunkHeight: 9,
  trunkRadiusBottom: 0.55,
  trunkRadiusTop: 0.28,
  trunkColor: '#5a4632', // écorce brune
  // Amas de feuillage : décalage (x,y,z) depuis le sommet du tronc + rayon.
  // Plusieurs blobs de tailles variées → houppier touffu et irrégulier.
  blobs: [
    { off: [0, 0.8, 0] as [number, number, number], r: 3.4 },
    { off: [1.7, -0.3, 0.8] as [number, number, number], r: 2.5 },
    { off: [-1.4, 0.1, -1.0] as [number, number, number], r: 2.6 },
    { off: [0.6, 1.5, -1.3] as [number, number, number], r: 2.2 },
    { off: [-0.8, 1.1, 1.4] as [number, number, number], r: 2.1 },
  ],
  leafColor: '#3d5223', // vert feuillage profond
} as const

// Semis : nombre total d'arbres, portée et échelle — même levier que le semis
// des rochers (useScatterInstances), positions posées via sampleGroundHeight.
// Densité RELEVÉE (220 → 420) pour remplir un paysage jugé trop vide : à 6
// blobs de feuillage par arbre ça reste ~2500 instances, très loin du pic
// qui avait grillé le driver (voir feedback_gpu_budget). innerRadius resserré
// (90 → 60) pour peupler aussi les abords proches du pas de tir.
export const TREE_SCATTER = {
  count: 420,
  seed: 4177,
  baseScale: 1,
  scaleJitter: 0.5,
  innerRadius: 60, // dégagement autour du pas de tir
  cutoffRadius: 30000,
} as const
