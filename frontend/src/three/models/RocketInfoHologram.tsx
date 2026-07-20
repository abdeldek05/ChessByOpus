import { Html } from '@react-three/drei'
import type * as THREE from 'three'
import { RocketInfoCallout } from '@/components/sections/Lancement/RocketInfoCallout'

interface RocketInfoHologramProps {
  /** Position locale (repère du groupe pad) du bout de la fusée sur la rampe —
   *  même point que FlyingMesange.origin (computeRailRocketOrigin). */
  origin: THREE.Vector3
  elevationDeg: number
  azimuthDeg: number
  rangeKm: number | null
  roleLabel: string
}

/**
 * Ancre le panneau d'infos missile (RocketInfoCallout) au point 3D exact où
 * la fusée repose sur la rampe (même origine que FlyingMesange) — taille
 * écran CONSTANTE (`transform={false}`) pour rester lisible à n'importe
 * quelle distance/zoom, panneau à gauche relié par un trait fin (voir
 * `.hud-callout` dans index.css). N'intercepte jamais l'orbite caméra.
 */
export function RocketInfoHologram({
  origin,
  elevationDeg,
  azimuthDeg,
  rangeKm,
  roleLabel,
}: RocketInfoHologramProps) {
  return (
    <Html position={origin} transform={false} zIndexRange={[10, 0]}>
      <div className="hud-callout hud-callout--right pointer-events-none -translate-x-[calc(100%+110px)] -translate-y-1/2">
        <RocketInfoCallout
          elevationDeg={elevationDeg}
          azimuthDeg={azimuthDeg}
          rangeKm={rangeKm}
          roleLabel={roleLabel}
        />
      </div>
    </Html>
  )
}
