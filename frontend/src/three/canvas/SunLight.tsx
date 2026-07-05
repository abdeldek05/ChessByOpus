import { SUN_LIGHT_POSITION, LIGHTING } from '@/three/constants/launchDaylight'

/**
 * Éclairage extérieur : soleil directionnel chaud (ombres portées sur la
 * dalle et la pelouse) + hémisphérique bleu ciel / vert herbe pour un
 * remplissage doux, aligné sur le soleil du shader de ciel.
 */
export function SunLight() {
  return (
    <>
      <hemisphereLight args={[LIGHTING.skyTint, LIGHTING.groundTint, LIGHTING.hemiIntensity]} />
      <directionalLight
        position={SUN_LIGHT_POSITION}
        color={LIGHTING.sunColor}
        intensity={LIGHTING.sunIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={4}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
    </>
  )
}
