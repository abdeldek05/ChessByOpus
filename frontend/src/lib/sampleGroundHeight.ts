// Hauteur (Y, unités scène) du sol en un point (x, z) — SOURCE DE VÉRITÉ UNIQUE
// du relief, partagée par la géométrie visible du sol ET la collision de la
// fusée. Fonction pure et déterministe : même entrée → même sortie, toujours.
//
// IMPORTANT : tout ce qui a besoin de "où est le sol" (mesh du sol, impact de la
// fusée, pose d'un objet au ras du terrain) DOIT passer par ici — jamais
// recalculer le relief ailleurs, sinon le sol visible et le sol de collision
// divergent (bug classique : fusée qui flotte ou s'enfonce).

import { createValueNoise2D } from '@/lib/valueNoise'

// Grille de bruit LARGE (512 cellules torique) : le motif ne se répète qu'au
// bout de 512 cellules, soit bien au-delà du sol → plus de répétition visible
// (l'ancien bug venait d'une grille de 64 qui bouclait sur la map).
const NOISE = createValueNoise2D(20260717, 512)

// Le relief combine DEUX échelles, présentes partout :
//   - GRANDES collines : longueur d'onde large → douces, visibles jusqu'à
//     l'horizon même avec peu de subdivisions. C'est le « relief partout ».
//   - DÉTAIL fin : petites ondulations, ne ressortent que dans la zone centrale
//     bien subdivisée (au loin, la subdivision les lisse naturellement).
// Les longueurs d'onde sont exprimées en unités scène ; on divise x/z par elles
// pour obtenir les coordonnées de bruit (indépendant de la taille de grille).
const BIG_WAVELENGTH = 22000 // ~5-6 grandes collines sur la largeur du sol
const BIG_AMPLITUDE = 480 // collines RELEVÉES (320 → 480) : casse la platitude
const DETAIL_WAVELENGTH = 3200 // ondulations moyennes
const DETAIL_AMPLITUDE = 110 // relevé (70 → 110) : relief moyen plus présent
const FINE_WAVELENGTH = 900 // micro-relief (visible seulement de près)
const FINE_AMPLITUDE = 22

// Zone plate autour du pas de tir (rayon + fondu) : la base repose à plat, MAIS
// au NIVEAU du relief local (pas forcée à 0 — sinon on creuse un cratère si le
// relief environnant est en bosse). PAS de fondu au bord : relief partout.
const FLAT_RADIUS = 300
const FLAT_FALLOFF = 900

/** Interpolation douce 0→1 entre edge0 et edge1 (smoothstep classique). */
function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/** Bruit signé ∈ [-1,1] à une longueur d'onde donnée (décalage = graine visuelle). */
function signedNoise(x: number, z: number, wavelength: number, offset: number): number {
  return NOISE.noise(x / wavelength + offset, z / wavelength + offset) * 2 - 1
}

/** Relief brut (collines + détail), avant aplanissement du pas de tir. */
function rawRelief(x: number, z: number): number {
  const big = signedNoise(x, z, BIG_WAVELENGTH, 0) * BIG_AMPLITUDE
  const detail = signedNoise(x, z, DETAIL_WAVELENGTH, 40.5) * DETAIL_AMPLITUDE
  const fine = signedNoise(x, z, FINE_WAVELENGTH, 130.25) * FINE_AMPLITUDE
  return big + detail + fine
}

// Hauteur du relief PILE au pas de tir (0,0) : c'est le niveau vers lequel on
// aplanit la zone centrale — le sol y est plat SANS creux (le cratère venait
// d'un aplanissement forcé à 0 alors que le relief autour est en bosse).
const PAD_LEVEL = rawRelief(0, 0)

/** Hauteur du sol (unités scène) au point (x, z). Le pas de tir (0,0) est à
 *  Y=0 pile (référence) ; le relief ondule autour de 0 en s'éloignant. */
export function sampleGroundHeight(x: number, z: number): number {
  const relief = rawRelief(x, z)
  // Au centre : plat au niveau du pas de tir. En s'éloignant : fondu vers le
  // relief plein. On soustrait PAD_LEVEL pour que le centre soit à Y=0 (et non
  // perché à la hauteur du bruit au point central).
  const distance = Math.hypot(x, z)
  const blend = smoothstep(FLAT_RADIUS, FLAT_RADIUS + FLAT_FALLOFF, distance)
  const height = PAD_LEVEL + (relief - PAD_LEVEL) * blend
  return height - PAD_LEVEL
}
