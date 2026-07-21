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
 * onglets choisissent le radar qu'on positionne ; cliquer la carte le place —
 * LIBREMENT, n'importe où : aucun clic n'est jamais refusé. Un radar dont le
 * cercle de couverture ne CHEVAUCHE MÊME PAS le cercle de portée max de la
 * Mesange (les deux cercles ne se touchent nulle part) est signalé en rouge —
 * il ne pourra jamais rien détecter, quel que soit l'azimut/élévation choisis
 * ensuite. Chaque point est étiqueté (Pas de tir / Radar 1…). L'azimut se
 * règle plus tard, à l'étape Menaces — pas ici.
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

  // Une ligne d'alerte par radar dont le cercle de couverture ne chevauche pas
  // du tout le cercle de portée de la Mesange : signalement visuel seul,
  // jamais un blocage — le placement reste libre.
  const outOfRangeLines = radarsOutOfRange.map((excess) => {
    const index = radars.findIndex((radar) => radar.id === excess.id)
    return {
      id: excess.id,
      text: `Radar ${index + 1} can never overlap the rocket's reach — ${excess.distanceKm.toFixed(2).replace('.', ',')} km measured / ${excess.maxKm.toFixed(0)} km max`,
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
        Click the map to place {radars.length > 1 ? `radar ${radars.indexOf(active!) + 1}` : 'the radar'}
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
