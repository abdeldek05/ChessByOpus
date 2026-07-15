import { smoothstep } from '@/lib/smoothstep'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import { TERRAIN_MACRO, TERRAIN_RELIEF } from '@/three/constants/terrainRelief'
import type { SceneBiome } from '@/types/scene.types'

/**
 * Hauteur (Y monde) du terrain en un point (x, z), SOURCE DE VÉRITÉ UNIQUE
 * partagée par la géométrie du sol, la collision (sampleSceneGround) et le
 * placement de TOUTE la végétation. Fonction pure et déterministe, valable à
 * n'importe quelle distance — c'est elle qui garantit un terrain continu, sans
 * la couture proche/lointain de l'ancien système à trois fonctions séparées.
 *
 * Le biome ne change pas la STRUCTURE mais MODULE les couches :
 *   1. macro    — larges ondulations basse fréquence, présentes PARTOUT (continuité) ;
 *   2. locale   — ondulations douces (prairie) OU crêtes de dunes pincées (désert) ;
 *   3. nord     — collines / méga-dunes montant vers -Z ;
 *   4. aplani   — zone plate autour du pas de tir (dalle/collision/caméra intactes).
 */
export function sampleTerrainHeight(x: number, z: number, biome: SceneBiome = 'meadow'): number {
  const cfg = TERRAIN_RELIEF[biome]

  // --- 1. Couche macro longue portée (commune, continue sur toute la map) ---
  const macro =
    TERRAIN_MACRO.amplitude *
    cfg.macroAmp *
    (Math.sin(x * TERRAIN_MACRO.freqA + TERRAIN_MACRO.phaseA) *
      Math.cos(z * TERRAIN_MACRO.freqB + TERRAIN_MACRO.phaseA) +
      0.5 *
        Math.sin(x * TERRAIN_MACRO.freqB * 1.7 + TERRAIN_MACRO.phaseB) *
        Math.cos(z * TERRAIN_MACRO.freqA * 1.3 + TERRAIN_MACRO.phaseB))

  // --- 2. Couche locale, propre au biome ---
  let local = 0
  for (const wave of cfg.localWaves) {
    local +=
      wave.amplitude *
      Math.sin(x * wave.freqX + wave.phase) *
      Math.cos(z * wave.freqZ + wave.phase * 0.5)
  }
  for (const dune of cfg.duneSystems) {
    const along = x * Math.cos(dune.dirRad) + z * Math.sin(dune.dirRad)
    const across = -x * Math.sin(dune.dirRad) + z * Math.cos(dune.dirRad)
    const wander = Math.sin(across * dune.wanderFreq + dune.phase) * dune.wanderAmp
    const s = Math.sin((along + wander) * dune.freq + dune.phase)
    local += dune.amplitude * Math.pow(1 - Math.abs(s), cfg.crestSharpness)
  }
  if (cfg.swell) {
    local += cfg.swell.amplitude * Math.sin(x * cfg.swell.freqX + cfg.swell.phase) * Math.cos(z * cfg.swell.freqZ)
  }

  // --- 4a. Aplanissement de la zone du pas de tir (macro + locale) ---
  const distance = Math.hypot(x - LAUNCH_CENTER[0], z - LAUNCH_CENTER[2])
  const flatness = smoothstep(cfg.flatRadius, cfg.flatRadius + cfg.flatFalloff, distance)
  let y = (macro + local) * flatness

  // --- 3. Crête nord (collines / méga-dunes) qui monte en s'éloignant vers -Z ---
  const ridge = cfg.northRidge
  const dz = LAUNCH_CENTER[2] - z
  if (dz > ridge.startZ) {
    const rise = smoothstep(ridge.startZ, ridge.fullZ, dz)
    const s = Math.sin(x * ridge.ridgeFreqX + ridge.ridgePhase) * Math.cos(z * ridge.ridgeFreqZ)
    // Collines de prairie : profil ½(1+sin) toujours ≥ 0. Méga-dunes : crête
    // pincée (1-|s|)^p. Distinction par la présence de crestSharpness.
    const profile =
      ridge.crestSharpness !== undefined
        ? Math.pow(1 - Math.abs(s), ridge.crestSharpness)
        : 0.5 * (1 + s)
    y += ridge.amplitude * rise * profile
  }

  return y
}
