import { CoverageLobe } from '@/components/sections/Analytics/CoverageLobe'
import { computeNiceTicks } from '@/lib/coverage/computeNiceTicks'
import { CUT_TRAJECTORY_COLOR, CUT_TRAJECTORY_WIDTH } from '@/constants/coverage'
import { ROLE_COLOR } from '@/constants/tacticalMapTheme'
import type { CoverageCut } from '@/hooks/useCoverageCut'
import type { LiveCutHead } from '@/hooks/useLiveCoverageProfile'

interface LaunchVerticalProfileProps {
  cut: CoverageCut
  head: LiveCutHead | null
}

// Géométrie du graphe (px de viewBox — SVG responsive au-dessus), gabarit
// resserré pour tenir dans le panneau tactique (voir CoverageCutChart pour
// l'équivalent plein écran d'Analytics, mêmes calculs, marges plus larges).
const WIDTH = 420
const HEIGHT = 300
const MARGIN = { left: 40, right: 14, top: 14, bottom: 30 }

/**
 * Onglet PROFIL de la carte tactique : la coupe de couverture verticale
 * (VCD) EN VOL — même géométrie que le débrief Analytics (CoverageLobe,
 * lobes + fenêtres de visibilité déjà calculés), avec en plus la TÊTE DE
 * PISTE LIVE (voir useLiveCoverageProfile) qui avance pendant le vol. C'est
 * l'écran qui rend le cône de silence et le décrochage en altitude
 * GÉOMÉTRIQUEMENT évidents — l'axe que la vue PLAN (carte de dessus) écrase.
 */
export function LaunchVerticalProfile({ cut, head }: LaunchVerticalProfileProps) {
  const innerW = WIDTH - MARGIN.left - MARGIN.right
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom
  const sPad = (cut.sMaxM - cut.sMinM) * 0.05 || 1000
  const s0 = cut.sMinM - sPad
  const s1 = cut.sMaxM + sPad
  const alt1 = cut.altMaxM * 1.1 || 1000

  const sx = (m: number) => MARGIN.left + ((m - s0) / (s1 - s0)) * innerW
  const sy = (m: number) => MARGIN.top + innerH - (m / alt1) * innerH

  const sTicksKm = computeNiceTicks(s0 / 1000, s1 / 1000, 4)
  const altTicksKm = computeNiceTicks(0, alt1 / 1000, 3)

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full font-mono">
      {sTicksKm.map((km) => (
        <line
          key={`s${km}`}
          x1={sx(km * 1000)}
          y1={MARGIN.top}
          x2={sx(km * 1000)}
          y2={MARGIN.top + innerH}
          className="stroke-ink-dim"
          strokeOpacity={0.12}
        />
      ))}
      {altTicksKm.map((km) => (
        <g key={`a${km}`}>
          <line
            x1={MARGIN.left}
            y1={sy(km * 1000)}
            x2={MARGIN.left + innerW}
            y2={sy(km * 1000)}
            className="stroke-ink-dim"
            strokeOpacity={0.12}
          />
          <text x={MARGIN.left - 6} y={sy(km * 1000) + 3} textAnchor="end" fontSize={9} className="fill-ink-faint">
            {km}
          </text>
        </g>
      ))}

      <line x1={MARGIN.left} y1={sy(0)} x2={MARGIN.left + innerW} y2={sy(0)} className="stroke-ink" strokeOpacity={0.5} />

      {cut.radarCuts.map((radarCut) => (
        <CoverageLobe key={radarCut.id} radarCut={radarCut} cutPoints={cut.cutPoints} sx={sx} sy={sy} />
      ))}

      <path
        d={cut.cutPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.sM).toFixed(1)},${sy(p.altM).toFixed(1)}`).join(' ')}
        fill="none"
        stroke={CUT_TRAJECTORY_COLOR}
        strokeWidth={CUT_TRAJECTORY_WIDTH}
      />

      {/* Pas de tir */}
      <path d={`M${sx(0) - 5},${sy(0)} L${sx(0)},${sy(0) - 8} L${sx(0) + 5},${sy(0)} Z`} className="fill-warning" />

      {/* Tête de piste LIVE (voir useLiveCoverageProfile) : halo pulsant +
          cœur net, couleur du Roi (ROLE_COLOR.KING) — l'instant présent du
          vol, superposé au lobe déjà tracé. */}
      {head && (
        <g>
          <circle cx={sx(head.sM)} cy={sy(head.altM)} r={7} fill={ROLE_COLOR.KING} fillOpacity={0.3} />
          <circle cx={sx(head.sM)} cy={sy(head.altM)} r={3} fill={ROLE_COLOR.KING} />
        </g>
      )}
    </svg>
  )
}
