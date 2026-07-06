// Pack de texture terrain procédural (herbe de champ, fBm) : palette + réglages.
// `unitsPerRepeat` : combien d'unités de scène couvre une tuile de texture.

export const LAWN = {
  // Palette d'herbe lisible sous clair de lune : du sombre au clair + touche sèche.
  colorDark: '#24361a',
  colorMid: '#375223',
  colorLight: '#4d6f30',
  colorDry: '#6b6a3a',
  unitsPerRepeat: 6,
}

// Résolution de la texture générée (albédo/normal/rugosité). 512 suffit une
// fois répétée sur le terrain et divise par 4 le coût de génération au chargement.
export const LAWN_TEXTURE_SIZE = 512
// Cellules de la grille de bruit torique (répétition sans couture).
export const LAWN_NOISE_GRID = 16
// Force du relief encodé dans la normal map (plus haut = micro-bosses marquées).
export const LAWN_NORMAL_STRENGTH = 2.2
export const LAWN_TEXTURE_SEED = 1337
