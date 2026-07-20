import { LaunchPad } from './LaunchPad'
import { PadDetails } from './PadDetails'
import { LaunchRoads } from './LaunchRoads'
import { ComplexBuildings } from './ComplexBuildings'
import { ComplexLightMasts } from './ComplexLightMasts'

/**
 * Zone de lancement en béton autour de la rampe : la plateforme à gradins avec
 * sa fosse centrale, ses détails techniques (rambardes, marquages, projecteurs,
 * tuyauterie), les voies béton qui rayonnent, les bâtiments techniques regroupés
 * au bout des voies et les mâts d'éclairage. Adapté à la fusée-sonde (compact).
 * Orchestration seule ; chaque élément vit dans son composant.
 */
export function LaunchComplex() {
  return (
    <group>
      <LaunchPad />
      <PadDetails />
      <LaunchRoads />
      <ComplexBuildings />
      <ComplexLightMasts />
    </group>
  )
}
