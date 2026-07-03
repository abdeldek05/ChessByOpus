import { MesangeStatic } from './MesangeStatic'
import { MESANGE_GROUND_LIFT } from '@/three/constants/launchSceneOffsets'
import { LAUNCH_PAD_HEIGHT } from '@/three/constants/launchScene'

/**
 * Mesange dressée sur le pas de tir, prête au lancement — immobile, pas de
 * trajectoire (la vraie trajectographie viendra de RocketPy). Le décalage
 * interne pose la base de la fusée sur le sommet du pad.
 */
export function MesangeErected() {
  return (
    <group position={[0, LAUNCH_PAD_HEIGHT, 0]}>
      <group position={[0, MESANGE_GROUND_LIFT, 0]}>
        <MesangeStatic />
      </group>
    </group>
  )
}
