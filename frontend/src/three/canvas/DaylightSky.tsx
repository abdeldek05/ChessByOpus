import * as THREE from 'three'
import { Sky, Clouds, Cloud } from '@react-three/drei'
import {
  SUN_POSITION,
  SKY,
  CLOUD_PUFFS,
  CLOUD_SEGMENT_LIMIT,
  CLOUD_DRIFT_SPEED,
} from '@/three/constants/launchDaylight'

export function DaylightSky() {
  return (
    <>
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
