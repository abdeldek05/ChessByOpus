import 'maplibre-gl/dist/maplibre-gl.css'
import { useMissionThreatMap } from '@/hooks/useMissionThreatMap'
import { AzimuthTape } from './AzimuthTape'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar, MesangeLaunchConfig } from '@/types/mission.types'

interface MissionThreatMapProps {
  site: LaunchSite
  radars: PlacedRadar[]
  mesangeConfigs: MesangeLaunchConfig[]
  selectedId: string
  selectedAzimuthDeg: number
  onSetAzimut: (id: string, deg: number) => void
  onSelect: (id: string) => void
}

/**
 * Carte de la flotte de menaces : pas de tir fixe (= site), partagé par
 * toutes les Mesanges. Un cône par Mesange, teinté par rôle — TOUS
 * saisissables directement (attraper un cône quelconque le sélectionne aussi,
 * pas seulement celui déjà actif dans le panneau de réglages).
 */
export function MissionThreatMap({
  site,
  radars,
  mesangeConfigs,
  selectedId,
  selectedAzimuthDeg,
  onSetAzimut,
  onSelect,
}: MissionThreatMapProps) {
  const { containerRef } = useMissionThreatMap({
    site,
    radars,
    mesangeConfigs,
    selectedId,
    onSetAzimut,
    onSelect,
  })

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      <p className="hud-glass pointer-events-none absolute top-3 left-3 z-10 rounded-lg px-2.5 py-1.5 text-label font-medium tracking-wide text-ink-dim">
        Drag any cone to aim it, or click in its direction
      </p>

      <AzimuthTape azimuthDeg={selectedAzimuthDeg} />
    </div>
  )
}
