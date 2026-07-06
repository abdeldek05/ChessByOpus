// Palette et densité de la pelouse procédurale (texture canvas répétée).
// `unitsPerRepeat` : combien d'unités de scène couvre une tuile de texture.

export const LAWN = {
  // Sol visible entre les brins
  soilBase: '#1a2d0e',
  // Brins : du plus sombre (base) au plus clair (milieu)
  blades: ['#2a4d14', '#346018', '#3e711c', '#4a8223', '#558c2a', '#62982f', '#4d7520', '#3a5918'],
  // Pointe des brins : plus claire, légèrement jaunâtre
  bladeTip: '#8eb84a',
  // Grandes variations de densité
  patchDark: 'rgba(20, 45, 10, 0.22)',
  patchLight: 'rgba(110, 155, 55, 0.14)',
  // Taches sèches / jaunies
  patchDry: 'rgba(130, 120, 40, 0.10)',
  unitsPerRepeat: 5,
}

export const LAWN_TEXTURE_SIZE = 2048
export const LAWN_BLADE_COUNT = 80000
export const LAWN_PATCH_COUNT = 60
export const LAWN_TEXTURE_SEED = 1337
