import 'maplibre-gl/dist/maplibre-gl.css'
import { useMissionPlacementMap } from '@/hooks/useMissionPlacementMap'
import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition, PlacedRadar } from '@/types/mission.types'

interface MissionPlacementMapProps {
  site: LaunchSite
  radars: PlacedRadar[]
  activeRadarId: string
  onSelectActive: (id: string) => void
  onPlaceRadar: (id: string, position: RadarPosition) => void
}

/**
 * Carte de placement des 1-2 radars, autour du pas de tir fixe (= le site). Des
 * onglets choisissent le radar qu'on positionne ; cliquer la carte le place.
 * Chaque point est étiqueté (Pas de tir / Radar 1…). L'azimut se règle plus
 * tard, à l'étape Menaces — pas ici.
 */
export function MissionPlacementMap({
  site,
  radars,
  activeRadarId,
  onSelectActive,
  onPlaceRadar,
}: MissionPlacementMapProps) {
  const { containerRef, radarsOutOfRange } = useMissionPlacementMap({
    site,
    radars,
    activeRadarId,
    onPlaceRadar,
  })

  const active = radars.find((r) => r.id === activeRadarId) ?? radars[0]

  // Une ligne d'alerte par radar hors portée : numéro + distances exactes.
  const outOfRangeLines = radarsOutOfRange.map((excess) => {
    const index = radars.findIndex((radar) => radar.id === excess.id)
    return {
      id: excess.id,
      text: `Radar ${index + 1} hors de portée — ${excess.distanceKm.toFixed(2).replace('.', ',')} km mesurés / ${excess.maxKm} km de portée`,
    }
  })

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {radars.length > 1 && (
        <div className="pointer-events-auto absolute top-3 left-3 flex gap-1.5">
          {radars.map((radar, index) => (
            <button
              key={radar.id}
              type="button"
              onClick={() => onSelectActive(radar.id)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium backdrop-blur-sm transition-colors ${
                radar.id === activeRadarId ? 'bg-radar text-bg' : 'bg-bg/70 text-ink-dim hover:bg-bg/90'
              }`}
            >
              Radar {index + 1}
            </button>
          ))}
        </div>
      )}

      <p
        className={`pointer-events-none absolute left-3 rounded-lg bg-bg/70 px-2.5 py-1.5 text-[11px] font-medium tracking-wide text-ink-dim backdrop-blur-sm ${
          radars.length > 1 ? 'top-14' : 'top-3'
        }`}
      >
        Cliquez sur la carte pour placer {radars.length > 1 ? `le radar ${radars.indexOf(active!) + 1}` : 'le radar'}
      </p>

      {outOfRangeLines.length > 0 && (
        <div className="pointer-events-none absolute top-3 right-3 space-y-1 rounded-lg bg-alert/20 px-3 py-2 backdrop-blur-sm">
          {outOfRangeLines.map((line) => (
            <p key={line.id} className="text-[11px] font-semibold tracking-wide text-alert">
              {line.text}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
