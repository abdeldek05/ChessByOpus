import { useRef } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'
import { MesangeStatic } from './MesangeStatic'
import { EngineFlame } from './EngineFlame'
import { useRestOnSurface } from '@/three/hooks/useRestOnSurface'
import { useMesangeFlight } from '@/three/hooks/useMesangeFlight'
import { DECK_TOP_Y, ROCKET_POSITION, ROCKET_FALLBACK_HALF_HEIGHT } from '@/three/constants/launcherRig'

interface RocketOnLauncherProps {
  /** Début de vol (performance.now) ; null = posée sur le mât. */
  startRef: RefObject<number | null>
  azimuthDeg: number
  inclinationDeg: number
  /** Position live de l'engin (monde) pour la caméra de poursuite. */
  worldPosRef: RefObject<THREE.Vector3>
}

/**
 * La VRAIE Mesange (GLB) : posée sur le mât au repos, elle décolle et suit sa
 * trajectoire balistique réelle au tir (useMesangeFlight), puis disparaît une
 * fois retombée. Sa position est publiée pour la caméra de poursuite.
 *
 * La flamme moteur (EngineFlame) est un groupe FRÈRE, pas un enfant : si elle
 * était nichée dans `seatRef`, sa géométrie (même invisible) fausserait la
 * mesure de bounding box de `useRestOnSurface` et décollerait la fusée du
 * plateau. Elle est donc synchronisée en position/rotation par useMesangeFlight.
 */
export function RocketOnLauncher({ startRef, azimuthDeg, inclinationDeg, worldPosRef }: RocketOnLauncherProps) {
  const seatRef = useRef<THREE.Group>(null)
  const flameRef = useRef<THREE.Group>(null)
  useRestOnSurface(seatRef, DECK_TOP_Y)
  useMesangeFlight({ groupRef: seatRef, startRef, azimuthDeg, inclinationDeg, worldPosRef, flameRef })

  return (
    <>
      <group
        ref={seatRef}
        position={[ROCKET_POSITION.x, DECK_TOP_Y + ROCKET_FALLBACK_HALF_HEIGHT, ROCKET_POSITION.z]}
      >
        <MesangeStatic />
      </group>
      <EngineFlame ref={flameRef} />
    </>
  )
}
