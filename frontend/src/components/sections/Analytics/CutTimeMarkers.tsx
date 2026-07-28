import { useMemo } from 'react'
import type { CutPoint } from '@/lib/coverage/projectToCutAxis'

interface CutTimeMarkersProps {
  cutPoints: CutPoint[]
  /** Échelles m → px du graphe parent. */
  sx: (m: number) => number
  sy: (m: number) => number
}

/** Nombre de repères de temps posés le long de la trajectoire. */
const MARKER_COUNT = 6

/** Pas de temps « ronds » candidats (s) : on prend le plus petit qui tient dans
 *  le budget de repères, pour toujours annoter des valeurs lisibles (T+30 s
 *  plutôt que T+27 s). */
const TIME_STEPS_SEC = [10, 20, 30, 60, 120, 300]

/**
 * Graduations de TEMPS le long de la trajectoire projetée : la coupe croise
 * distance et altitude, mais ne disait nulle part QUAND la menace est passée par
 * un point. Sans ça, on lit une géométrie sans savoir si l'accroche a eu lieu au
 * bout de dix secondes ou de deux minutes — l'information même que mesure un
 * préavis.
 *
 * Les repères sont posés à des instants ronds (voir TIME_STEPS_SEC), pas à
 * intervalle d'index : un échantillonnage régulier en index tomberait sur des
 * valeurs arbitraires, et la trajectoire n'est pas parcourue à vitesse constante.
 */
export function CutTimeMarkers({ cutPoints, sx, sy }: CutTimeMarkersProps) {
  const markers = useMemo(() => {
    if (cutPoints.length < 2) return []
    const totalSec = cutPoints[cutPoints.length - 1].t
    const stepSec =
      TIME_STEPS_SEC.find((step) => totalSec / step <= MARKER_COUNT) ??
      TIME_STEPS_SEC[TIME_STEPS_SEC.length - 1]

    const picked: CutPoint[] = []
    for (let target = stepSec; target < totalSec; target += stepSec) {
      // Point le plus proche de l'instant visé (la trajectoire est échantillonnée
      // en temps, mais pas forcément sur des valeurs rondes).
      const point = cutPoints.reduce((best, candidate) =>
        Math.abs(candidate.t - target) < Math.abs(best.t - target) ? candidate : best,
      )
      picked.push(point)
    }
    return picked
  }, [cutPoints])

  return (
    <g className="font-mono" pointerEvents="none">
      {markers.map((point) => (
        <g key={point.t}>
          <circle cx={sx(point.sM)} cy={sy(point.altM)} r={2} className="fill-ink-dim" fillOpacity={0.7} />
          <text
            x={sx(point.sM)}
            y={sy(point.altM) + 13}
            textAnchor="middle"
            fontSize={9}
            className="fill-ink-dim"
            fillOpacity={0.8}
          >
            T+{Math.round(point.t)}s
          </text>
        </g>
      ))}
    </g>
  )
}
