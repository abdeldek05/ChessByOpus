import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeBufferGeometries } from 'three-stdlib'
import { sampleTerrainHeight } from '@/lib/sampleTerrainHeight'
import { displaceGeometry } from '@/lib/displaceGeometry'
import { TERRAIN_RINGS, TERRAIN_CORE_RADIUS, TERRAIN_THETA_SEGMENTS } from '@/three/constants/terrainMesh'
import { SAND_SHADE } from '@/three/constants/duneRelief'
import { LAWN } from '@/three/constants/lawnField'
import type { SceneBiome } from '@/types/scene.types'

interface UnifiedTerrainParams {
  biome: SceneBiome
  /** Rayon extérieur voulu (unités) — couvre la vraie distance du scénario. */
  outerRadius: number
}

// Léger chevauchement entre couronnes de densités différentes : évite les
// fissures (T-junctions) au raccord de deux résolutions.
const RING_OVERLAP = 2

/**
 * Géométrie du TERRAIN UNIFIÉ : un disque central dense entouré de couronnes de
 * plus en plus grossières (TERRAIN_RINGS), toutes déplacées par la MÊME
 * fonction de hauteur `sampleTerrainHeight` (continuité garantie, aucune
 * couture) puis fusionnées en une seule BufferGeometry. Porte un attribut
 * `color` d'ombrage par pente (crêtes claires / faces raides foncées) et des UV
 * recalculés à l'échelle monde pour une texture répétée sans distorsion.
 */
export function useUnifiedTerrainGeometry({ biome, outerRadius }: UnifiedTerrainParams): THREE.BufferGeometry {
  return useMemo(() => {
    const height = (x: number, z: number) => sampleTerrainHeight(x, z, biome)

    const parts: THREE.BufferGeometry[] = []

    // Tout petit disque plein central (sous le pas de tir, zone aplanie) :
    // MÊME thetaSegments que les anneaux → son bord s'aligne exactement avec
    // le bord intérieur du premier ring (plus de raccord carré/cercle).
    const core = new THREE.CircleGeometry(
      TERRAIN_CORE_RADIUS + RING_OVERLAP,
      TERRAIN_THETA_SEGMENTS,
      0,
      Math.PI * 2,
    )
    displaceGeometry(core, height)
    parts.push(core)

    for (let i = 0; i < TERRAIN_RINGS.length; i++) {
      const ring = TERRAIN_RINGS[i]
      // Le dernier anneau s'étire jusqu'au rayon voulu ; les anneaux entièrement
      // au-delà de outerRadius sont ignorés (scène petite = peu d'anneaux).
      if (ring.inner >= outerRadius) break
      const outer = Math.min(ring.outer, outerRadius) + (i < TERRAIN_RINGS.length - 1 ? RING_OVERLAP : 0)

      // Tous les anneaux (y compris le premier) sont de VRAIS RingGeometry,
      // avec le MÊME thetaSegments (TERRAIN_THETA_SEGMENTS) — leurs sommets de
      // bord tombent aux mêmes angles d'un anneau à l'autre, donc le relief
      // interpolé de chaque côté du raccord coïncide. C'est ce qui élimine les
      // fentes en zigzag (bug « deux sols mal collés ») : avant, le disque
      // central était un PlaneGeometry carré, structurellement incompatible
      // avec le bord circulaire d'un anneau.
      const geo = new THREE.RingGeometry(ring.inner, outer, ring.thetaSegments, ring.radialSegments)
      displaceGeometry(geo, height)
      parts.push(geo)
    }

    const merged = mergeBufferGeometries(parts, false) ?? parts[0]
    parts.forEach((g) => g !== merged && g.dispose())

    applyWorldUv(merged)
    applySlopeColor(merged, biome)
    // Recalcul de la sphère englobante APRÈS displacement + merge : sinon le
    // frustum culling de Three.js se base sur une sphère fausse et masque les
    // couronnes lointaines (le terrain « s'arrête en carré »).
    merged.computeBoundingSphere()
    merged.computeBoundingBox()
    return merged
  }, [biome, outerRadius])
}

// UV dérivées de la position MONDE (X/Z) : la texture se répète à l'échelle
// réelle sur tout le terrain, quelle que soit la couronne — pas de saut d'UV
// entre anneaux. Une unité UV = 1 unité scène ; le material règle son `repeat`.
function applyWorldUv(geometry: THREE.BufferGeometry): void {
  const pos = geometry.attributes.position
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i)
    // Y local = -Z monde (plan tourné) ; on garde une base cohérente.
    uv[i * 2 + 1] = pos.getY(i)
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
}

// Ombrage par pente en vertex color : replats/crêtes clairs, faces raides
// foncées — le modelé du relief se lit même à plat. Palette selon le biome.
function applySlopeColor(geometry: THREE.BufferGeometry, biome: SceneBiome): void {
  const normals = geometry.attributes.normal
  const count = normals.count
  const light = new THREE.Color(biome === 'desert' ? SAND_SHADE.light : LAWN.colorLight)
  const dark = new THREE.Color(biome === 'desert' ? SAND_SHADE.dark : LAWN.colorDark)
  const colors = new Float32Array(count * 3)
  const tint = new THREE.Color()
  for (let i = 0; i < count; i++) {
    // normal.z LOCAL = composante verticale monde (plan tourné -90°).
    const up = Math.abs(normals.getZ(i)) // 1 = plat, 0 = vertical
    const flatness = Math.pow(up, 2.2)
    tint.copy(dark).lerp(light, flatness)
    colors[i * 3] = tint.r
    colors[i * 3 + 1] = tint.g
    colors[i * 3 + 2] = tint.b
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}
