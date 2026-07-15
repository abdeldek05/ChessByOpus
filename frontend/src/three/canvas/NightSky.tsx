import { Stars } from '@react-three/drei'
import { STARS, MOON_DISC } from '@/three/constants/launchNight'

/**
 * Ciel de NUIT : voûte étoilée (drei <Stars>, points scintillants quasi
 * gratuits) + disque de lune émissif à l'horizon que le Bloom fait rayonner.
 * Pendant nocturne de DaylightSky — la bascule jour/nuit choisit l'un des deux.
 */
export function NightSky() {
  return (
    <>
      <Stars
        radius={STARS.radius}
        depth={STARS.depth}
        count={STARS.count}
        factor={STARS.factor}
        speed={STARS.speed}
        fade
      />
      {/* Lune : sphère émissive (toneMapped off → capte le Bloom). fog=false :
          même raison que le soleil de DaylightSky (le fog dépend de
          terrainRadius, potentiellement plus proche que la lune). */}
      <mesh position={MOON_DISC.position}>
        <sphereGeometry args={[MOON_DISC.radius, 24, 24]} />
        <meshBasicMaterial color={MOON_DISC.color} toneMapped={false} fog={false} />
      </mesh>
    </>
  )
}
