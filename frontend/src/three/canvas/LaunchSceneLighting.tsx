import type { LaunchAmbiance } from '@/three/constants/launchAmbiance'

interface LaunchSceneLightingProps {
  ambiance: LaunchAmbiance
}

/**
 * Éclairage piloté par l'ambiance jour/nuit : lumière-clé rasante (soleil ou
 * clair de lune) + remplissage hémisphérique + ambiance, pour révéler le
 * relief sans tomber dans le noir total la nuit.
 */
export function LaunchSceneLighting({ ambiance }: LaunchSceneLightingProps) {
  return (
    <>
      <ambientLight intensity={ambiance.ambientIntensity} color={ambiance.ambientColor} />
      <hemisphereLight
        color={ambiance.hemiSky}
        groundColor={ambiance.hemiGround}
        intensity={ambiance.hemiIntensity}
      />

      <directionalLight
        position={[-40, 14, 26]}
        intensity={ambiance.keyIntensity}
        color={ambiance.keyColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-60, 60, 60, -60, 0.1, 200]} />
      </directionalLight>
    </>
  )
}
