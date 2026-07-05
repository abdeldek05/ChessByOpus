// Palette et densité de la pelouse procédurale (texture canvas répétée).
// `unitsPerRepeat` : combien d'unités de scène couvre une tuile de texture.

export const LAWN = {
  base: '#4d7731',
  blades: ['#3d6427', '#5d8a3c', '#6e9a48', '#456d2c', '#82a457'],
  patchDark: 'rgba(37, 63, 22, 0.16)',
  patchLight: 'rgba(148, 178, 92, 0.13)',
  unitsPerRepeat: 7,
}

export const LAWN_TEXTURE_SIZE = 1024
export const LAWN_BLADE_COUNT = 24000
export const LAWN_PATCH_COUNT = 42
export const LAWN_TEXTURE_SEED = 1337
