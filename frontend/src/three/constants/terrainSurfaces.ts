// Palettes des SURFACES du terrain, mélangées par le shader de splatting selon
// la pente et l'altitude. En PRAIRIE le gazon dominant vient du pack LAWN
// (createLawnTextures) — ces surfaces servent d'appoint (herbe sèche, terre,
// roche) ; en DÉSERT elles portent tout le mélange « terre dominante »
// historique. Textures procédurales (createTerrainSurfaceTexture) répétées sur
// tout le terrain, cassées par l'anti-tiling du shader.

export interface SurfacePalette {
  /** Couleur de fond dominante. */
  base: string
  /** Teinte claire (taches, grain clair). */
  light: string
  /** Teinte sombre (creux, grain sombre). */
  dark: string
  /** Accent (cailloux, brins, motifs — dépend de la surface). */
  accent: string
  /** Densité du grain/mottling (0-1). */
  grain: number
}

// TERRE nue réaliste : brun terreux, mottling ocre/sombre, petits cailloux.
export const SURFACE_DIRT: SurfacePalette = {
  base: '#6b5334',
  light: '#8a6d45',
  dark: '#4a3823',
  accent: '#3a2c1c',
  grain: 0.9,
}

// TERRE plus sombre/humide (creux) : renforce le contraste des vallons.
export const SURFACE_DARK_EARTH: SurfacePalette = {
  base: '#4f3d27',
  light: '#67512f',
  dark: '#31261a',
  accent: '#241a10',
  grain: 0.85,
}

// Un peu de VERDURE (herbe clairsemée sur la terre) : vert olive terne, pas vif.
export const SURFACE_GRASS: SurfacePalette = {
  base: '#6a7238',
  light: '#89904a',
  dark: '#49512a',
  accent: '#3c4422',
  grain: 0.7,
}

// VERDURE SÈCHE / paille jaunie : herbe qui a séché, tons paille dorée —
// accordée aux jaunes du pack LAWN (colorYellow/colorDry) pour la prairie,
// reste plausible en désert.
export const SURFACE_DRY_GRASS: SurfacePalette = {
  base: '#a49254',
  light: '#c0b06e',
  dark: '#77683a',
  accent: '#665829',
  grain: 0.7,
}

// ROCHE (pentes raides, crêtes) : gris-brun, cassée, veinée.
export const SURFACE_ROCK: SurfacePalette = {
  base: '#797067',
  light: '#968c82',
  dark: '#4f4842',
  accent: '#3a352f',
  grain: 0.8,
}

// Résolution des textures de surface (répétées : 512 suffit largement).
export const SURFACE_TEXTURE_SIZE = 512
