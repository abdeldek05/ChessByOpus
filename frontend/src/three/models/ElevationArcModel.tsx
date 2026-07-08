import { Line, Html } from '@react-three/drei'
import { useElevationArc } from '@/three/hooks/useElevationArc'
import { ARC_COLOR } from '@/three/constants/inclinationScene'

/**
 * Arc gradué 70–90° autour du pivot de la fusée : la règle fixe sur laquelle le
 * marqueur (porté par le pivot, cf. SoundingRocketModel) vient se lire. Ticks
 * tous les 5°, labels uniquement aux crans principaux (70/80/90), écartés de
 * l'arc pour rester lisibles. Rendu uniquement — géométrie dans useElevationArc.
 */
export function ElevationArcModel() {
  const { arcPoints, ticks } = useElevationArc()

  return (
    <group>
      <Line points={arcPoints} color={ARC_COLOR} lineWidth={1.6} transparent opacity={0.6} />
      {ticks.map((tick) => (
        <group key={tick.deg}>
          <Line
            points={[tick.from, tick.to]}
            color={ARC_COLOR}
            lineWidth={tick.major ? 2.2 : 1.2}
            transparent
            opacity={tick.major ? 0.95 : 0.5}
          />
          {tick.major && (
            <Html position={tick.labelPosition} center className="pointer-events-none select-none">
              <span className="rounded bg-bg/60 px-1 font-display text-xs font-bold whitespace-nowrap text-accent-bright">
                {tick.deg}°
              </span>
            </Html>
          )}
        </group>
      ))}
    </group>
  )
}
