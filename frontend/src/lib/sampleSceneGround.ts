import { sampleGroundHeight } from '@/lib/sampleGroundHeight'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import { PAD_TIERS } from '@/three/constants/launchComplex'

/**
 * Hauteur du SOL de la scène (Y monde) en un point (x, z) : le relief
 * (sampleGroundHeight, source de vérité unique), RELEVÉ au niveau des gradins
 * béton sous l'emprise de la plateforme de lancement. Sert de sol de
 * COLLISION unique : le vol se brise dessus (dalle comprise) et la caméra ne
 * passe ni sous la map ni sous la plateforme. Fonction pure et déterministe.
 * Le pas de tir est dans la zone plate de sampleGroundHeight (Y=0 pile), donc
 * les gradins reposent directement sur un sol plat sans relèvement nécessaire.
 */
export function sampleSceneGround(x: number, z: number): number {
  let ground = sampleGroundHeight(x, z)
  // Distance « carrée » (Chebyshev) au centre du pas de tir : les gradins sont
  // des carrés concentriques — le plus étroit (le plus haut) gagne.
  const chebyshev = Math.max(Math.abs(x - LAUNCH_CENTER[0]), Math.abs(z - LAUNCH_CENTER[2]))
  for (const tier of PAD_TIERS) {
    if (chebyshev <= tier.half) ground = Math.max(ground, tier.top)
  }
  return ground
}
