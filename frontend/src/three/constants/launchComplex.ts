// Zone de lancement en BÉTON, à l'échelle de la FUSÉE-SONDE (compacte, pas un
// Saturn V). Une plateforme à gradins surélevée avec une fosse centrale sous la
// rampe, et des voies béton qui rayonnent vers les côtés. Fidèle à la forme de
// la référence lift-off, mais dimensionnée pour notre petite rampe (~7 unités).

// Gradins de la plateforme, du plus large (bas) au plus étroit (haut). Chaque
// niveau : demi-largeur (carré), hauteur du dessus au-dessus du sol.
export interface PadTier {
  half: number
  top: number
}
export const PAD_TIERS: PadTier[] = [
  { half: 26, top: 0.6 }, // socle large, à peine surélevé
  { half: 18, top: 1.6 }, // niveau intermédiaire
  { half: 12, top: 2.4 }, // plateau supérieur (accueille la rampe)
]
// Hauteur du plateau supérieur = référence pour poser la rampe/console dessus.
export const PAD_TOP_Y = 2.4

// Fosse d'éjection des gaz au centre, sous la rampe (trou sombre).
export const FLAME_PIT = { half: 3.2, depth: 2.2, color: '#2a2a2a' } as const

// Détails de la plateforme : rambardes, marquages, bollards, tuyaux, panneaux.
export const PAD_DETAILS = {
  railingEvery: 2.4, // espacement des poteaux de rambarde
  railHeight: 1.1,
  railColor: '#c7ccce', // acier galvanisé
  markingColor: '#d8b23a', // jaune sécurité (marquages au sol)
  hazardDark: '#2b2a26', // rayures sombres des bandes danger
  bollardColor: '#c9a227', // plots jaunes anti-collision
  pipeColor: '#8a8f8b', // tuyauterie métal
  panelColor: '#7d8a6e', // armoires/panneaux techniques
} as const

// Projecteurs sur mâts posés SUR la plateforme (autour du plateau supérieur) :
// position (x,z) locale au plateau, la tête pointe vers la fusée.
export const PAD_FLOODLIGHTS: [number, number][] = [
  [-10, -10],
  [10, -10],
  [-10, 10],
  [10, 10],
]
export const FLOODLIGHT = {
  height: 6.5,
  poleColor: '#5a5e58',
  headColor: '#fff4d6',
  headEmissive: 2.2,
} as const

// Voies béton qui rayonnent depuis la plateforme (largeur, longueur, cap deg).
export interface RoadSpec {
  angleDeg: number
  length: number
  width: number
}
export const ROADS: RoadSpec[] = [
  { angleDeg: 200, length: 70, width: 7 },
  { angleDeg: 340, length: 60, width: 7 },
  { angleDeg: 90, length: 50, width: 6 },
]

// Teinte de base du béton (la texture procédurale la nuance).
export const CONCRETE_COLOR = '#9a978f'

// Installations annexes au BOUT des voies (regroupées, pas éparpillées) :
// bâtiments techniques compacts. Position (x,z), dimensions, teinte.
export interface BuildingSpec {
  pos: [number, number]
  size: [number, number, number]
  color: string
}
export const BUILDINGS: BuildingSpec[] = [
  { pos: [-62, -24], size: [6, 3.5, 5], color: '#b3ac9f' },
  { pos: [-56, -30], size: [4, 2.6, 4], color: '#a49d90' },
  { pos: [50, 44], size: [5, 3, 5], color: '#aaa396' },
]

// Mâts d'éclairage aux coins de la plateforme (posés sur le sol, autour).
export const LIGHT_MASTS: [number, number][] = [
  [-30, -30],
  [30, -30],
  [-30, 30],
  [30, 30],
]
export const MAST = {
  height: 9,
  poleColor: '#5a5e58',
  headColor: '#fff2cf',
  headEmissive: 1.6,
} as const
