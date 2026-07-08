// Rampe de tir en treillis (lattice) inclinée, façon rail de lancement réel :
// un cadre de base au sol + un fût-treillis incliné le long duquel la Mesange
// est dressée. Dimensions en unités de scène (la Mesange fait ~5,6 de haut).

export const RAIL = {
  // Fût-treillis (le rail).
  boomLength: 7.2,
  boomWidth: 0.72, // côté de la section carrée du treillis
  chordRadius: 0.05, // membrures (les 4 arêtes)
  braceRadius: 0.032, // diagonales et traverses
  bays: 6, // nombre de travées le long du fût

  // Cadre de base au sol.
  baseWidth: 3.4,
  baseDepth: 2.4,
  plateThickness: 0.18,
  legRadius: 0.09,
  legHeight: 0.35,

  // Bloc de pivot où le fût s'articule sur la base.
  pivot: { width: 0.9, height: 0.5, depth: 0.9 },
}

export const RAIL_COLORS = {
  boom: '#c9cfd6', // acier galvanisé clair
  plate: '#4a525b', // plateau sombre
  frame: '#8b939b', // cadre / pieds
  pivot: '#5a626b',
}
