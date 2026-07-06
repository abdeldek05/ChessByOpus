// Relief léger de la pelouse : ondulations douces obtenues en sommant
// quelques sinusoïdes (pas de vraie fonction de bruit, mais suffisant pour
// casser l'aspect « billard »). Un disque central reste plat pour asseoir le
// banc de tir, avec un anneau de transition pour un raccord invisible.

export interface ReliefWave {
  amplitude: number
  freqX: number
  freqZ: number
  phase: number
}

// Longueurs d'onde volontairement grandes (basses fréquences) : de larges
// bosses de terrain, pas des vaguelettes.
export const RELIEF_WAVES: ReliefWave[] = [
  { amplitude: 2.4, freqX: 0.013, freqZ: 0.016, phase: 0.0 },
  { amplitude: 1.2, freqX: 0.034, freqZ: 0.028, phase: 1.7 },
  { amplitude: 0.5, freqX: 0.066, freqZ: 0.081, phase: 3.4 },
]

// Nombre de subdivisions du plan de sol : allégé (moins de triangles) tout en
// gardant un relief lisse à ces basses fréquences. 96² = ~9k quads, largement
// suffisant pour ces ondulations douces.
export const RELIEF_SEGMENTS = 96

// Zone plate sous la plateforme (rayon) et fin de la transition vers le relief.
// La zone plate est centrée sur le banc de tir, décalé du monde par
// LAUNCH_ORIGIN — le relief est échantillonné en repère local à ce groupe,
// donc ce centrage sur (0,0) reste correct.
export const FLAT_RADIUS = 10
export const FLAT_FALLOFF = 26
