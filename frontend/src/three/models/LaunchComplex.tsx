import { LaunchPad } from './LaunchPad'
import { PadDetails } from './PadDetails'
import { LaunchRoads } from './LaunchRoads'
import { ComplexBuildings } from './ComplexBuildings'
import { ComplexLightMasts } from './ComplexLightMasts'
import type { SceneBiome } from '@/types/scene.types'

interface LaunchComplexProps {
  /** Biome du terrain : bâtiments et mâts se posent sur le sol correspondant. */
  biome?: SceneBiome
}

/**
 * Zone de lancement en béton autour de la rampe : la plateforme à gradins avec
 * sa fosse centrale, ses détails techniques (rambardes, marquages, projecteurs,
 * tuyauterie), les voies béton qui rayonnent, les bâtiments techniques regroupés
 * au bout des voies et les mâts d'éclairage. Adapté à la fusée-sonde (compact).
 * Orchestration seule ; chaque élément vit dans son composant.
 */
export function LaunchComplex({ biome }: LaunchComplexProps) {
  return (
    <group>
      <LaunchPad />
      <PadDetails />
      <LaunchRoads />
      <ComplexBuildings biome={biome} />
      <ComplexLightMasts biome={biome} />
    </group>
  )
}
