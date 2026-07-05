import * as THREE from 'three'
import { Sky, Clouds, Cloud } from '@react-three/drei'
import {
  SUN_POSITION,
  SKY,
  HAZE_COLOR,
  CLOUD_PUFFS,
  CLOUD_SEGMENT_LIMIT,
  CLOUD_DRIFT_SPEED,
} from '@/three/constants/launchDaylight'

interface DaylightSkyProps {
  fogNear: number
  fogFar: number
}

/**
 * Ciel de beau temps : shader de diffusion atmosphérique (bleu physique,
 * halo solaire), cumulus volumétriques épars qui dérivent lentement, et
 * brume d'horizon qui fond la pelouse dans le ciel au loin.
 */
export function DaylightSky({ fogNear, fogFar }: DaylightSkyProps) {
  return (
    <>
      <fog attach="fog" args={[HAZE_COLOR, fogNear, fogFar]} />
      <Sky
        distance={SKY.distance}
        sunPosition={SUN_POSITION}
        turbidity={SKY.turbidity}
        rayleigh={SKY.rayleigh}
        mieCoefficient={SKY.mieCoefficient}
        mieDirectionalG={SKY.mieDirectionalG}
      />
      {/* MeshBasicMaterial : nuages blancs non éclairés (comme surexposés par
          le soleil), seulement fondus par la brume au loin. */}
      <Clouds material={THREE.MeshBasicMaterial} limit={CLOUD_SEGMENT_LIMIT}>
        {CLOUD_PUFFS.map((puff) => (
          <Cloud
            key={puff.seed}
            seed={puff.seed}
            position={puff.position}
            bounds={puff.bounds}
            segments={puff.segments}
            volume={puff.volume}
            opacity={puff.opacity}
            growth={puff.growth}
            speed={CLOUD_DRIFT_SPEED}
            color="#ffffff"
          />
        ))}
      </Clouds>
    </>
  )
}
