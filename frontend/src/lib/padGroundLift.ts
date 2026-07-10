import { sampleLawnRelief } from '@/lib/sampleLawnRelief'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import { PAD_TIERS } from '@/three/constants/launchComplex'

/**
 * Hauteurs du relief sous l'emprise de la plateforme de lancement (carré de
 * demi-côté `half` autour du pas de tir), échantillonnées sur une grille. Sert à
 * asseoir la plateforme : on descend son socle jusqu'au relief le plus BAS (pas
 * de trou dessous) et on la relève au-dessus du plus HAUT (jamais enfoncée).
 * Fonction pure.
 */
export function padGroundExtent(half: number): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  const steps = 6
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= steps; j++) {
      const x = LAUNCH_CENTER[0] + (i / steps - 0.5) * 2 * half
      const z = LAUNCH_CENTER[2] + (j / steps - 0.5) * 2 * half
      const y = sampleLawnRelief(x, z)
      if (y < min) min = y
      if (y > max) max = y
    }
  }
  return { min, max }
}

/**
 * Relèvement (unités) appliqué à toute la zone de lancement pour que le socle
 * dépasse toujours le relief le plus haut sous son emprise. Formule PARTAGÉE
 * entre LaunchPad (qui relève la plateforme) et le canvas (qui relève rampe +
 * console + vol de la même quantité), pour rester alignés.
 */
export function computePadLift(): number {
  const extent = padGroundExtent(PAD_TIERS[0].half)
  return Math.max(0, extent.max + 0.3 - PAD_TIERS[0].top)
}
