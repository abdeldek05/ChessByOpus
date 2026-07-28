import type { RadarCut } from '@/hooks/useCoverageCut'
import type { CutPoint } from '@/lib/coverage/projectToCutAxis'
import { CUT_VISIBILITY_WIDTH } from '@/constants/coverage'

interface CoverageLobeProps {
  radarCut: RadarCut
  cutPoints: CutPoint[]
  /** Échelles m → px du graphe parent. */
  sx: (m: number) => number
  sy: (m: number) => number
}

/** Hauteur (px de viewBox) de la cote de portée au-dessus du sol : assez haut
 *  pour ne pas se confondre avec l'axe, assez bas pour rester sous le lobe. */
const RANGE_TICK_OFFSET_PX = 18

/** Chemin SVG d'une moitié de lobe (miroir gauche/droite autour du radar). */
function halfPath(radarCut: RadarCut, side: 1 | -1, sx: (m: number) => number, sy: (m: number) => number): string {
  const points = radarCut.lobeHalf!
  return (
    points
      .map(([u, alt], i) => `${i === 0 ? 'M' : 'L'}${sx(radarCut.sRadarM + side * u).toFixed(1)},${sy(alt).toFixed(1)}`)
      .join(' ') + ' Z'
  )
}

/**
 * UN radar sur la coupe Thales : lobe de couverture instrumentée (deux
 * moitiés en miroir, pincées au site radar — le cône de silence au zénith
 * reste vide), segments de trajectoire EN VISIBILITÉ surlignés, marqueurs de
 * première/dernière visibilité (T+ et position) et symbole du radar au sol.
 */
export function CoverageLobe({ radarCut, cutPoints, sx, sy }: CoverageLobeProps) {
  const { color, windows, rangeM, ceilingM } = radarCut
  const groundX = sx(radarCut.sRadarM)
  const groundY = sy(0)
  // Cote de portée posée juste au-dessus du sol, sous le lobe.
  const rangeY = groundY - RANGE_TICK_OFFSET_PX

  return (
    <g>
      {radarCut.lobeHalf && (
        <path
          d={`${halfPath(radarCut, 1, sx, sy)} ${halfPath(radarCut, -1, sx, sy)}`}
          fill={color}
          fillOpacity={0.08}
          stroke={color}
          strokeOpacity={0.55}
          strokeWidth={1.2}
          strokeDasharray="6 4"
        />
      )}

      {/* Segments de trajectoire en visibilité (par-dessus la trajectoire de base). */}
      {windows.map((window) => (
        <path
          key={`${window.iIn}-${window.iOut}`}
          d={cutPoints
            .slice(window.iIn, window.iOut + 1)
            .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.sM).toFixed(1)},${sy(p.altM).toFixed(1)}`)
            .join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={CUT_VISIBILITY_WIDTH}
          strokeLinecap="round"
        />
      ))}

      {/* Marqueurs première/dernière visibilité : TEMPS + POSITION (distance
          sol / altitude, en km) — exigence Thales : lire l'instant ET l'endroit
          exacts de l'acquisition et de la perte, directement sur la coupe. */}
      {windows.map((window) => (
        <g key={`markers-${window.iIn}`} className="font-mono">
          <circle cx={sx(window.sInM)} cy={sy(window.altInM)} r={4} fill={color} />
          <text x={sx(window.sInM)} y={sy(window.altInM) - 9} textAnchor="middle" fontSize={9} fill={color}>
            ▲ T+{Math.round(window.tIn)}s · {(Math.abs(window.sInM) / 1000).toFixed(1)}/{(window.altInM / 1000).toFixed(1)} km
          </text>
          <circle cx={sx(window.sOutM)} cy={sy(window.altOutM)} r={4} fill={color} fillOpacity={0.45} stroke={color} />
          <text x={sx(window.sOutM)} y={sy(window.altOutM) - 9} textAnchor="middle" fontSize={9} fill={color}>
            ▼ T+{Math.round(window.tOut)}s · {(Math.abs(window.sOutM) / 1000).toFixed(1)}/{(window.altOutM / 1000).toFixed(1)} km
          </text>
        </g>
      ))}

      {/* PORTÉE chiffrée : le lobe montrait l'étendue de la couverture sans jamais
          en donner la valeur. Une cote au sol de part et d'autre du radar, plus le
          rayon en clair — on lit la portée réglée directement sur la coupe, sans
          aller la chercher dans les réglages du scénario. */}
      {rangeM > 0 && (
        <g className="font-mono" pointerEvents="none">
          <line
            x1={sx(radarCut.sRadarM - rangeM)}
            y1={rangeY}
            x2={sx(radarCut.sRadarM + rangeM)}
            y2={rangeY}
            stroke={color}
            strokeOpacity={0.35}
            strokeWidth={1}
            strokeDasharray="2 3"
          />
          {[-1, 1].map((side) => (
            <line
              key={side}
              x1={sx(radarCut.sRadarM + side * rangeM)}
              y1={rangeY - 4}
              x2={sx(radarCut.sRadarM + side * rangeM)}
              y2={rangeY + 4}
              stroke={color}
              strokeOpacity={0.6}
              strokeWidth={1}
            />
          ))}
          <text
            x={sx(radarCut.sRadarM + rangeM) - 4}
            y={rangeY - 7}
            textAnchor="end"
            fontSize={9}
            fill={color}
            fillOpacity={0.85}
          >
            portée {(rangeM / 1000).toFixed(0)} km
          </text>
        </g>
      )}

      {/* Symbole radar au sol (position projetée sur l'axe) + ses caractéristiques
          réglées : la portée et le plafond expliquent la forme du lobe juste
          au-dessus, autant les afficher là. */}
      <g className="font-mono">
        <path
          d={`M${groundX - 6},${groundY} L${groundX},${groundY - 10} L${groundX + 6},${groundY} Z`}
          fill={color}
        />
        <text x={groundX} y={groundY + 14} textAnchor="middle" fontSize={11} fill={color}>
          {radarCut.name}
          {radarCut.offAxisM > 500 ? ` (écart ${(radarCut.offAxisM / 1000).toFixed(1)} km)` : ''}
        </text>
        <text x={groundX} y={groundY + 26} textAnchor="middle" fontSize={9} fill={color} fillOpacity={0.65}>
          {(rangeM / 1000).toFixed(0)} km · plafond {(ceilingM / 1000).toFixed(0)} km
        </text>
      </g>
    </g>
  )
}
