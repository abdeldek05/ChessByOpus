import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { createTerrainSurfaceTexture } from '@/lib/createTerrainSurfaceTexture'
import { createLawnTextures } from '@/lib/createLawnTextures'
import { createNoiseNormalTexture } from '@/lib/createNoiseNormalTexture'
import {
  SURFACE_DIRT,
  SURFACE_DARK_EARTH,
  SURFACE_GRASS,
  SURFACE_DRY_GRASS,
  SURFACE_ROCK,
} from '@/three/constants/terrainSurfaces'
import { TERRAIN_NORMALS } from '@/three/constants/terrainNormalMaps'
import type { SceneBiome } from '@/types/scene.types'

export interface TerrainSplatTextures {
  dirt: THREE.CanvasTexture
  grass: THREE.CanvasTexture
  dryGrass: THREE.CanvasTexture
  rock: THREE.CanvasTexture
  /** Désert uniquement (5e surface du fragment terre dominante). */
  darkEarth: THREE.CanvasTexture | null
  /** Prairie uniquement : micro-relief par surface (csm_FragNormal). */
  grassNormal: THREE.CanvasTexture | null
  dirtNormal: THREE.CanvasTexture | null
  rockNormal: THREE.CanvasTexture | null
}

// Netteté aux angles rasants (golden hour) — quasi gratuit sur ces 512².
function withAnisotropy(tex: THREE.CanvasTexture): THREE.CanvasTexture {
  tex.anisotropy = 8
  return tex
}

/**
 * Textures de surface du splatting, PAR BIOME. Prairie : le GAZON vient du pack
 * LAWN (albédo fBm riche + sa normal map Sobel), complété par terre/herbe
 * sèche/roche et leurs normal maps procédurales. Désert : les 5 albédos
 * historiques, inchangés (pas de normal maps — refonte séparée plus tard).
 * Répétables (RepeatWrapping) — l'anti-tiling est dans le shader. Libérées au
 * démontage.
 */
export function useTerrainSplatTextures(biome: SceneBiome): TerrainSplatTextures {
  const textures = useMemo<TerrainSplatTextures>(() => {
    if (biome === 'desert') {
      return {
        dirt: withAnisotropy(createTerrainSurfaceTexture(SURFACE_DIRT)),
        darkEarth: withAnisotropy(createTerrainSurfaceTexture(SURFACE_DARK_EARTH)),
        grass: withAnisotropy(createTerrainSurfaceTexture(SURFACE_GRASS)),
        dryGrass: withAnisotropy(createTerrainSurfaceTexture(SURFACE_DRY_GRASS)),
        rock: withAnisotropy(createTerrainSurfaceTexture(SURFACE_ROCK)),
        grassNormal: null,
        dirtNormal: null,
        rockNormal: null,
      }
    }
    // Prairie : gazon = pack LAWN (le repeat de la texture est ignoré par le
    // shader custom — le tiling passe par l'uniform uTexScale). La rugosité
    // passe par csm_Roughness (scalaire par surface) : la roughnessMap du pack
    // est inutile ici, libérée immédiatement.
    const lawn = createLawnTextures(1)
    lawn.roughnessMap.dispose()
    return {
      grass: withAnisotropy(lawn.colorMap),
      grassNormal: withAnisotropy(lawn.normalMap),
      dryGrass: withAnisotropy(createTerrainSurfaceTexture(SURFACE_DRY_GRASS)),
      dirt: withAnisotropy(createTerrainSurfaceTexture(SURFACE_DIRT)),
      dirtNormal: createNoiseNormalTexture(TERRAIN_NORMALS.dirt),
      rock: withAnisotropy(createTerrainSurfaceTexture(SURFACE_ROCK)),
      rockNormal: createNoiseNormalTexture(TERRAIN_NORMALS.rock),
      darkEarth: null,
    }
  }, [biome])

  useEffect(
    () => () => {
      Object.values(textures).forEach((t) => t?.dispose())
    },
    [textures],
  )

  return textures
}
