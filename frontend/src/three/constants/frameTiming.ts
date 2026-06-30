// Borne le delta entre deux frames : évite un saut brutal d'animation après
// un changement d'onglet ou une chute de framerate.
export const MAX_FRAME_DELTA = 1 / 30
