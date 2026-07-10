// Rochers procéduraux du décor : icosaèdres déformés par du bruit, posés au sol.
// Répartis sur toute la map (amas épars + affleurements sur les collines nord),
// pour crédibiliser le relief minéral sans modèle externe.

export interface RockSpec {
  /** Position au sol (x, z) en coords scène. */
  pos: [number, number]
  /** Rayon de base du rocher (unités). */
  radius: number
  /** Graine de déformation (forme unique). */
  seed: number
  /** Léger enfoncement dans le sol (unités) pour asseoir le rocher. */
  sink: number
}

// Teintes de la pierre (granit gris chaud sous golden hour).
export const ROCK_COLORS = {
  light: '#8a8377',
  dark: '#4d4842',
} as const

// Amplitude de la déformation par le bruit (fraction du rayon).
export const ROCK_NOISE_AMOUNT = 0.35

export const ROCKS: RockSpec[] = [
  // Amas épars sur le terrain proche/moyen (autour du pas de tir, à distance).
  { pos: [42, -60], radius: 3.4, seed: 1, sink: 0.8 },
  { pos: [50, -52], radius: 2.1, seed: 2, sink: 0.5 },
  { pos: [-64, 44], radius: 4.0, seed: 3, sink: 1.0 },
  { pos: [-56, 52], radius: 2.6, seed: 4, sink: 0.6 },
  { pos: [78, 40], radius: 3.2, seed: 5, sink: 0.8 },
  { pos: [-40, -70], radius: 2.4, seed: 6, sink: 0.5 },
  { pos: [90, -20], radius: 3.8, seed: 7, sink: 0.9 },
  { pos: [-95, -10], radius: 2.9, seed: 8, sink: 0.7 },
  // Affleurements plus gros sur les COLLINES au nord (côté -Z), à distance.
  { pos: [-30, -180], radius: 8.0, seed: 9, sink: 2.0 },
  { pos: [10, -210], radius: 9.5, seed: 10, sink: 2.4 },
  { pos: [55, -175], radius: 6.5, seed: 11, sink: 1.6 },
  { pos: [-70, -200], radius: 7.2, seed: 12, sink: 1.8 },
  { pos: [-10, -250], radius: 10.0, seed: 13, sink: 2.6 },
  { pos: [90, -230], radius: 7.8, seed: 14, sink: 2.0 },
]
