import { useCoverageCut } from '@/hooks/useCoverageCut'
import { computeNiceTicks } from '@/lib/coverage/computeNiceTicks'
import { CoverageLobe } from './CoverageLobe'
import { CUT_TRAJECTORY_COLOR, CUT_TRAJECTORY_WIDTH } from '@/constants/coverage'
import type { FlightData } from '@/lib/api'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

interface CoverageCutChartProps {
  flight: FlightData
  site: LaunchSite
  radars: PlacedRadar[]
  azimuthDeg: number
}

// Géométrie du graphe (px de viewBox — le SVG est responsive au-dessus).
const WIDTH = 960
const HEIGHT = 440
const MARGIN = { left: 64, right: 24, top: 28, bottom: 48 }

/**
 * Coupe Thales : distance au sol dans l'axe de tir × altitude, avec la
 * trajectoire projetée, les lobes de couverture instrumentée de chaque radar
 * et les fenêtres de visibilité (première/dernière, T+ et position). Rendu
 * SVG pur — tous les calculs vivent dans useCoverageCut/lib.
 */
export function CoverageCutChart({ flight, site, radars, azimuthDeg }: CoverageCutChartProps) {
  const cut = useCoverageCut({ flight, site, radars, azimuthDeg })

  const innerW = WIDTH - MARGIN.left - MARGIN.right
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom
  // Domaines avec marge (5 % en s, 10 % en altitude).
  const sPad = (cut.sMaxM - cut.sMinM) * 0.05 || 1000
  const s0 = cut.sMinM - sPad
  const s1 = cut.sMaxM + sPad
  const alt1 = cut.altMaxM * 1.1 || 1000

  const sx = (m: number) => MARGIN.left + ((m - s0) / (s1 - s0)) * innerW
  const sy = (m: number) => MARGIN.top + innerH - (m / alt1) * innerH

  const sTicksKm = computeNiceTicks(s0 / 1000, s1 / 1000, 8)
  const altTicksKm = computeNiceTicks(0, alt1 / 1000, 5)

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full font-mono">
      {/* Grille + graduations */}
      {sTicksKm.map((km) => (
        <g key={`s${km}`}>
          <line
            x1={sx(km * 1000)}
            y1={MARGIN.top}
            x2={sx(km * 1000)}
            y2={MARGIN.top + innerH}
            className="stroke-ink-dim"
            strokeOpacity={0.15}
          />
          <text x={sx(km * 1000)} y={HEIGHT - MARGIN.bottom + 18} textAnchor="middle" fontSize={11} className="fill-ink-dim">
            {km}
          </text>
        </g>
      ))}
      {altTicksKm.map((km) => (
        <g key={`a${km}`}>
          <line
            x1={MARGIN.left}
            y1={sy(km * 1000)}
            x2={MARGIN.left + innerW}
            y2={sy(km * 1000)}
            className="stroke-ink-dim"
            strokeOpacity={0.15}
          />
          <text x={MARGIN.left - 8} y={sy(km * 1000) + 4} textAnchor="end" fontSize={11} className="fill-ink-dim">
            {km}
          </text>
        </g>
      ))}

      {/* Axes + libellés */}
      <line x1={MARGIN.left} y1={sy(0)} x2={MARGIN.left + innerW} y2={sy(0)} className="stroke-ink" strokeOpacity={0.6} />
      <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={sy(0)} className="stroke-ink" strokeOpacity={0.6} />
      <text x={MARGIN.left + innerW / 2} y={HEIGHT - 8} textAnchor="middle" fontSize={12} className="fill-ink-dim">
        DISTANCE DANS L'AXE DE TIR (km)
      </text>
      <text
        x={16}
        y={MARGIN.top + innerH / 2}
        textAnchor="middle"
        fontSize={12}
        className="fill-ink-dim"
        transform={`rotate(-90 16 ${MARGIN.top + innerH / 2})`}
      >
        ALTITUDE (km)
      </text>

      {/* Lobes + visibilité par radar (sous la trajectoire pour les lobes,
          les segments surlignés repassent par-dessus). */}
      {cut.radarCuts.map((radarCut) => (
        <CoverageLobe key={radarCut.id} radarCut={radarCut} cutPoints={cut.cutPoints} sx={sx} sy={sy} />
      ))}

      {/* Trajectoire projetée */}
      <path
        d={cut.cutPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.sM).toFixed(1)},${sy(p.altM).toFixed(1)}`).join(' ')}
        fill="none"
        stroke={CUT_TRAJECTORY_COLOR}
        strokeWidth={CUT_TRAJECTORY_WIDTH}
      />

      {/* Pas de tir à l'origine */}
      <g>
        <path d={`M${sx(0) - 6},${sy(0)} L${sx(0)},${sy(0) - 10} L${sx(0) + 6},${sy(0)} Z`} className="fill-warning" />
        <text x={sx(0)} y={sy(0) + 14} textAnchor="middle" fontSize={11} className="fill-warning">
          PAS DE TIR
        </text>
      </g>
    </svg>
  )
}
