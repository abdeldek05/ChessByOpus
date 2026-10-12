// Borne le delta entre deux frames : évite un saut brutal d'animation après
// un changement d'onglet ou une chute de framerate.
export const MAX_FRAME_DELTA = 1 / 30

// --- Horloge LISSÉE du rejeu de vol (voir useSmoothedFrameDelta) ---
// La position de la fusée est lue PAR LE TEMPS (animElapsed × TIME_SCALE) :
// toute irrégularité de frame devient un pas spatial inégal, et une seule
// frame longue (compilation de shader, GC) se lisait comme une téléportation.

// Plafond ABSOLU d'avance de l'horloge de vol par frame (s) : même après un
// freeze complet (onglet masqué), le vol n'avance jamais plus que ça d'un coup.
export const MAX_PLAYBACK_DELTA = 1 / 20

// Poids de la moyenne mobile exponentielle de la cadence : un changement
// DURABLE de framerate est suivi en ~10-15 frames (la vitesse de lecture reste
// juste sur machine lente), un pic isolé est absorbé.
export const DELTA_SMOOTHING = 0.12

// Une frame ne peut avancer plus de X× la cadence lissée courante — la borne
// anti-téléportation : un spike de 100 ms à 60 FPS avance ~26 ms, pas 100.
export const DELTA_SPIKE_RATIO = 1.6
