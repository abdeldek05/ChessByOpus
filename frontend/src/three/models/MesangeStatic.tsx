import { useMesangeScene } from '@/three/hooks/useMesangeScene'
import { useMesangeMaterialQuality } from '@/three/hooks/useMesangeMaterialQuality'
import { MESANGE_MODEL_PATH } from '@/three/constants/modelPaths'

/**
 * Mesange dressée et immobile pour la scène de lancement (contrairement à
 * `MesangeModel` qui tourne sur lui-même pour la vitrine de l'accueil). Même
 * chargement/orientation, sans rotation ni inclinaison au pointeur.
 */
export function MesangeStatic() {
  const { scene } = useMesangeScene(MESANGE_MODEL_PATH)
  useMesangeMaterialQuality(scene)
  return <primitive object={scene} />
}
