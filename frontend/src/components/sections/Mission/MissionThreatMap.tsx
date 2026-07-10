import 'maplibre-gl/dist/maplibre-gl.css'
import { useMissionThreatMap } from '@/hooks/useMissionThreatMap'
import { AzimuthTape } from './AzimuthTape'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

interface MissionThreatMapProps {
  site: LaunchSite
  radars: PlacedRadar[]
  azimuthDeg: number
  inclinationDeg: number
  onSetAzimut: (deg: number) => void
}

/**
 * Carte de la menace : pas de tir fixe (= site), étiqueté, comme les radars en
 * contexte. On clique dans la direction visée pour orienter le tir ; un cône
 * fin et arrondi montre la zone d'impact estimée.
 */
export function MissionThreatMap({
  site,
  radars,
  azimuthDeg,
  inclinationDeg,
  onSetAzimut,
}: MissionThreatMapProps) {
  const { containerRef } = useMissionThreatMap({ site, radars, azimuthDeg, inclinationDeg, onSetAzimut })

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      <p className="pointer-events-none absolute top-3 left-3 rounded-lg bg-bg/70 px-2.5 py-1.5 text-[11px] font-medium tracking-wide text-ink-dim backdrop-blur-sm">
        Click in the target direction or drag the cone
      </p>

      <AzimuthTape azimuthDeg={azimuthDeg} />
    </div>
  )
}
