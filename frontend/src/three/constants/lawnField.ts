// Pack de texture terrain procédural (herbe de champ, fBm) : palette + réglages.
// `unitsPerRepeat` : combien d'unités de scène couvre une tuile de texture.

export const LAWN = {
  // Palette d'herbe RÉALISTE et variée (golden hour) : du vert foncé humide au
  // vert clair, puis jaune-vert et taches sèches jaunies/brunies — un vrai champ
  // n'est jamais d'un vert uniforme.
  colorDark: '#33421f', // vert foncé (creux humides)
  colorMid: '#556b2c', // vert moyen dominant
  colorLight: '#7c8f3e', // vert clair (crêtes exposées)
  colorYellow: '#a8a24e', // jaune-vert (herbe qui jaunit)
  colorDry: '#9c8348', // sec / paille (patchs)
  unitsPerRepeat: 5,
}

// Résolution de la texture générée (albédo/normal/rugosité). 512 suffit une
// fois répétée sur le terrain et divise par 4 le coût de génération au chargement.
export const LAWN_TEXTURE_SIZE = 512
// Cellules de la grille de bruit torique (répétition sans couture).
export const LAWN_NOISE_GRID = 16
// Force du relief encodé dans la normal map (plus haut = micro-bosses marquées).
export const LAWN_NORMAL_STRENGTH = 2.2
export const LAWN_TEXTURE_SEED = 1337
