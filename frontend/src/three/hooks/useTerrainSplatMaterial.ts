import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { useTerrainSplatTextures } from '@/three/hooks/useTerrainSplatTextures'
import {
  TERRAIN_VERTEX,
  TERRAIN_FRAGMENT_MEADOW,
  SPLAT_CONFIG_MEADOW,
} from '@/three/constants/terrainShaders'
import {
  TERRAIN_FRAGMENT_DESERT,
  SPLAT_CONFIG_DESERT,
} from '@/three/constants/terrainShadersDesert'
import { TERRAIN_NORMALS } from '@/three/constants/terrainNormalMaps'
import type { SceneBiome } from '@/types/scene.types'

/**
 * Matériau de SPLATTING du terrain via three-custom-shader-material, PAR BIOME.
 * Prairie : GAZON dominant (pack LAWN) + plaques sèches/terre discrètes + roche
 * sur pentes raides, avec micro-relief (normal maps par surface, csm_FragNormal)
 * et rugosité PBR par surface. Désert : mélange « terre dominante » historique,
 * inchangé. Bâti sur MeshStandardMaterial → fog, ombres et éclairage PBR restent
 * gérés nativement. Libéré au démontage.
 */
export function useTerrainSplatMaterial(biome: SceneBiome): CustomShaderMaterial {
  const tex = useTerrainSplatTextures(biome)

  const material = useMemo(() => {
    const desert = biome === 'desert'
    const config = desert ? SPLAT_CONFIG_DESERT : SPLAT_CONFIG_MEADOW

    const uniforms: Record<string, { value: unknown }> = {
      uGrass: { value: tex.grass },
      uDryGrass: { value: tex.dryGrass },
      uDirt: { value: tex.dirt },
      uRock: { value: tex.rock },
      uTexScale: { value: config.texScale },
      uRockSlope: { value: config.rockSlope },
      uHighAltitude: { value: config.highAltitude },
      uPatchScale: { value: config.patchScale },
    }
    if (desert) {
      uniforms.uDarkEarth = { value: tex.darkEarth }
    } else {
      uniforms.uGrassNormal = { value: tex.grassNormal }
      uniforms.uDirtNormal = { value: tex.dirtNormal }
      uniforms.uRockNormal = { value: tex.rockNormal }
      uniforms.uNormalScale = { value: TERRAIN_NORMALS.normalScale }
    }

    return new CustomShaderMaterial({
      baseMaterial: THREE.MeshStandardMaterial,
      vertexShader: TERRAIN_VERTEX,
      fragmentShader: desert ? TERRAIN_FRAGMENT_DESERT : TERRAIN_FRAGMENT_MEADOW,
      uniforms,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.35,
    })
  }, [tex, biome])

  useEffect(() => () => material.dispose(), [material])

  return material
}
