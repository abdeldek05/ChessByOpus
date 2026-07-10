import { Sparkles } from '@react-three/drei'
import {
  PARTICLE_COUNT,
  PARTICLE_VOLUME,
  PARTICLE_CENTER_Y,
  PARTICLE_SIZE,
  PARTICLE_SPEED,
  PARTICLE_OPACITY,
  PARTICLE_NOISE,
  PARTICLE_COLOR,
} from '@/three/constants/atmosphereParticles'

/**
 * Poussière / pollen flottant dans l'air autour du pas de tir : de fins grains
 * dorés qui dérivent doucement et accrochent la lumière golden hour, donnant de
 * la vie à l'air (signature Leap For Mankind). Rendu léger via <Sparkles> de
 * drei ; réglages dans les constantes. Volume large au sol, bas en hauteur.
 */
export function AtmosphereParticles() {
  return (
    <group position={[0, PARTICLE_CENTER_Y, 0]}>
      <Sparkles
        count={PARTICLE_COUNT}
        scale={PARTICLE_VOLUME}
        size={PARTICLE_SIZE}
        speed={PARTICLE_SPEED}
        opacity={PARTICLE_OPACITY}
        noise={PARTICLE_NOISE}
        color={PARTICLE_COLOR}
      />
    </group>
  )
}
