// Pack de texture terrain procédural (herbe de champ, fBm) : palette + réglages.
// `unitsPerRepeat` : combien d'unités de scène couvre une tuile de texture.

export const LAWN = {
  // Palette d'herbe VERTE luxuriante : dominante verte fraîche et saturée,
  // le soleil golden hour vient juste réchauffer les crêtes exposées (colorLight)
  // sans jamais virer au jaune/doré. ACCORDÉE à GRASS_COLORS (three/models).
  // Luminosité remontée (colorDark était proche du noir → sol trop sombre).
  colorDark: '#274a1c', // vert ombré (creux à l'ombre), lisible mais sombre
  colorMid: '#4f7d38', // vert franc moyen, dominant
  colorLight: '#96c95f', // vert clair lumineux (crêtes exposées au soleil)
  colorYellow: '#a8a94c', // vert-jaune discret (variation naturelle, pas dominant)
  colorDry: '#8a7a3a', // patchs secs occasionnels (jamais dominant sur une prairie fraîche)
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
