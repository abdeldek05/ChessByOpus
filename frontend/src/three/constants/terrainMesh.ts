// Découpage du terrain unifié en couronnes concentriques à densité DÉGRESSIVE :
// dense au centre (près du pas de tir, la zone regardée de près), de plus en
// plus grossier vers l'extérieur (l'horizon lointain, fondu dans le fog). Même
// principe que leap-for-mankind (256→…→4 segments) : un seul terrain continu,
// jamais de plan géométrique uni, mais sans exploser le nombre de triangles sur
// des kilomètres. Toutes les valeurs sont en UNITÉS SCÈNE (voir sceneLayout,
// 1 unité = 8 m réels).

export interface TerrainRing {
  /** Rayon intérieur de la couronne (0 = disque central plein). */
  inner: number
  /** Rayon extérieur — le facteur d'échelle du terrain l'étend jusqu'à farDistance. */
  outer: number
  /** Nb de subdivisions RADIALES de la couronne (densité du relief). */
  radialSegments: number
  /** Nb de secteurs ANGULAIRES (résolution circulaire). */
  thetaSegments: number
}

// Disque central plein (zone dense, ~TERRAIN_EDGE_RADIUS) + couronnes de plus
// en plus larges et grossières. Les rayons montent géométriquement pour couvrir
// beaucoup de distance avec peu d'anneaux. `outer` du dernier anneau est
// remplacé dynamiquement par le rayon réel du scénario (farDistance) dans le
// hook — ces valeurs sont les proportions de base.
//
// IMPORTANT : thetaSegments (résolution ANGULAIRE) est le MÊME pour tous les
// anneaux (TERRAIN_THETA_SEGMENTS) — seule la densité RADIALE varie. Si deux
// anneaux adjacents avaient des thetaSegments différents, leurs sommets au
// même rayon ne tomberaient pas aux mêmes angles : le relief y serait
// interpolé différemment de chaque côté du raccord, créant des fentes en
// zigzag visibles dès que le terrain a de la pente (bug observé : « deux sols
// mal collés »). Avec un thetaSegments commun, les sommets du bord coïncident
// exactement — plus de désalignement.
export const TERRAIN_THETA_SEGMENTS = 96

// Rayon du tout petit disque plein central (CircleGeometry, sans subdivision
// radiale — un point central en éventail). Assez petit pour que l'absence de
// relief fin en son sein soit invisible (c'est pile sous le pas de tir, une
// zone aplanie par sampleTerrainHeight de toute façon). Tout le reste, y
// compris le premier « ring », est un vrai anneau polaire subdivisé
// radialement, aligné en angle avec ses voisins (voir useUnifiedTerrainGeometry).
export const TERRAIN_CORE_RADIUS = 20

export const TERRAIN_RINGS: TerrainRing[] = [
  { inner: TERRAIN_CORE_RADIUS, outer: 300, radialSegments: 128, thetaSegments: TERRAIN_THETA_SEGMENTS },
  { inner: 300, outer: 900, radialSegments: 40, thetaSegments: TERRAIN_THETA_SEGMENTS },
  { inner: 900, outer: 2600, radialSegments: 16, thetaSegments: TERRAIN_THETA_SEGMENTS },
  { inner: 2600, outer: 8000, radialSegments: 8, thetaSegments: TERRAIN_THETA_SEGMENTS },
  { inner: 8000, outer: 26000, radialSegments: 4, thetaSegments: TERRAIN_THETA_SEGMENTS },
]

// Le terrain déborde toujours d'au moins cette marge (unités) au-delà de la
// distance du radar/impact le plus lointain, pour que son bord soit hors champ
// (et masqué par le fog à l'étape 3).
export const TERRAIN_OUTER_MARGIN = 2000
