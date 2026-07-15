// Configuration du relief UNIFIÉ, modulé par biome. Agrège les paramètres
// jadis éparpillés dans lawnRelief.ts (prairie), duneRelief.ts (désert) et
// sampleFarGroundRelief (sol lointain), pour qu'UNE seule fonction de hauteur
// (sampleTerrainHeight) couvre TOUTE la map de façon continue — plus de
// couture proche/lointain. Les valeurs numériques restent portées par leurs
// fichiers d'origine ; ici on les référence et on les organise par biome.
import type { SceneBiome } from '@/types/scene.types'
import type { ReliefWave } from '@/three/constants/lawnRelief'
import { RELIEF_WAVES, FLAT_RADIUS, FLAT_FALLOFF, HILLS } from '@/three/constants/lawnRelief'
import {
  DUNE_SYSTEMS,
  CREST_SHARPNESS,
  SWELL,
  MEGA_DUNES,
  DESERT_FLAT_RADIUS,
  DESERT_FLAT_FALLOFF,
  type DuneSystem,
} from '@/three/constants/duneRelief'

// COUCHE MACRO longue portée, COMMUNE aux deux biomes (ex-sampleFarGroundRelief) :
// de très larges ondulations basse fréquence, présentes PARTOUT — c'est elle qui
// donne au terrain lointain un relief continu avec la zone proche (fin du plan
// géométrique uni). Modulée en amplitude par biome (voir `macroAmp`).
export const TERRAIN_MACRO = {
  amplitude: 18,
  freqA: 0.00035,
  freqB: 0.00061,
  phaseA: 1.7,
  phaseB: 4.2,
} as const

// Collines/méga-dunes montant vers le nord (-Z) : profil commun (montée
// progressive startZ→fullZ + crête ondulée), paramètres pris du biome.
export interface TerrainNorthRidge {
  amplitude: number
  startZ: number
  fullZ: number
  ridgeFreqX: number
  ridgeFreqZ: number
  ridgePhase: number
  /** Exposant de pincement de la crête (1 = doux, 2+ = vif). undefined = pas de pincement (collines de prairie). */
  crestSharpness?: number
}

// Relief d'un biome : couche locale (ondulations douces OU crêtes de dunes),
// aplanissement autour du pas de tir, crête nord, et facteurs de modulation.
export interface TerrainBiomeRelief {
  /** Ondulations locales douces (prairie). Vide si le biome utilise des dunes. */
  localWaves: ReliefWave[]
  /** Systèmes de dunes directionnels (désert). Vide si le biome utilise des ondulations. */
  duneSystems: DuneSystem[]
  /** Exposant de pincement des crêtes de dunes (désert). */
  crestSharpness: number
  /** Houle de fond très large (désert). null = absente (prairie). */
  swell: { amplitude: number; freqX: number; freqZ: number; phase: number } | null
  /** Crête montant au nord (collines de prairie ou méga-dunes). */
  northRidge: TerrainNorthRidge
  /** Zone plate sous le complexe : rayon + longueur de transition. */
  flatRadius: number
  flatFalloff: number
  /** Facteur d'amplitude de la couche macro commune pour ce biome. */
  macroAmp: number
}

export const TERRAIN_RELIEF: Record<SceneBiome, TerrainBiomeRelief> = {
  meadow: {
    localWaves: RELIEF_WAVES,
    duneSystems: [],
    crestSharpness: 1,
    swell: null,
    northRidge: {
      amplitude: HILLS.amplitude,
      startZ: HILLS.startZ,
      fullZ: HILLS.fullZ,
      ridgeFreqX: HILLS.ridgeFreqX,
      ridgeFreqZ: HILLS.ridgeFreqZ,
      ridgePhase: HILLS.ridgePhase,
    },
    flatRadius: FLAT_RADIUS,
    flatFalloff: FLAT_FALLOFF,
    macroAmp: 1,
  },
  desert: {
    localWaves: [],
    duneSystems: DUNE_SYSTEMS,
    crestSharpness: CREST_SHARPNESS,
    swell: SWELL,
    northRidge: {
      amplitude: MEGA_DUNES.amplitude,
      startZ: MEGA_DUNES.startZ,
      fullZ: MEGA_DUNES.fullZ,
      ridgeFreqX: MEGA_DUNES.ridgeFreqX,
      ridgeFreqZ: MEGA_DUNES.ridgeFreqZ,
      ridgePhase: MEGA_DUNES.ridgePhase,
      crestSharpness: MEGA_DUNES.crestSharpness,
    },
    flatRadius: DESERT_FLAT_RADIUS,
    flatFalloff: DESERT_FLAT_FALLOFF,
    macroAmp: 0.8,
  },
}
