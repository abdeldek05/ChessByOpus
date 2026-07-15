import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  FOG_ALTITUDE_START,
  FOG_ALTITUDE_FULL,
  FOG_FAR_ALTITUDE_MULT,
} from '@/three/constants/launchDaylight'

interface AltitudeFogProps {
  /** Distance `far` de base du fog (au sol) — la borne « dense » de la brume. */
  baseFar: number
}

/**
 * Module la distance `far` du fog selon la HAUTEUR de la caméra : dense au ras
 * du sol (horizon caché, immersif), puis le `far` s'élargit progressivement à
 * mesure que la caméra monte (suivi de la fusée) — en altitude le ciel est
 * dégagé et la fusée reste NETTE, plus noyée dans la brume. Le fog `near` est
 * laissé tel quel (le premier plan reste net). N'agit qu'en présence d'un
 * THREE.Fog (linéaire) sur la scène.
 */
export function AltitudeFog({ baseFar }: AltitudeFogProps) {
  const { scene } = useThree()

  useFrame(({ camera }) => {
    const fog = scene.fog
    if (!(fog instanceof THREE.Fog)) return
    const h = camera.position.y
    // t = 0 au sol, 1 au-delà de FOG_ALTITUDE_FULL (courbe douce smoothstep).
    const raw = THREE.MathUtils.clamp(
      (h - FOG_ALTITUDE_START) / (FOG_ALTITUDE_FULL - FOG_ALTITUDE_START),
      0,
      1,
    )
    const t = raw * raw * (3 - 2 * raw)
    const mult = 1 + (FOG_FAR_ALTITUDE_MULT - 1) * t
    fog.far = baseFar * mult
  })

  return null
}
