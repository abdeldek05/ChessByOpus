import { useEffect, useRef, useState } from 'react'
import type { CoverageCut } from '@/hooks/useCoverageCut'
import type { CutPoint } from '@/lib/coverage/projectToCutAxis'

/** État LIVE du profil à l'instant courant du vol. */
export interface CoverageProfileLive {
  /** Index du point de trajectoire courant (-1 hors vol). */
  index: number
  /** Temps de vol courant (s). */
  tSec: number
  /** Altitude courante (m) et distance sol courante (m). */
  altM: number
  distM: number
  /** ids des radars qui VOIENT la fusée à cet instant (fenêtre en cours). */
  seenBy: string[]
}

const REFRESH_HZ = 12
const REFRESH_MS = 1000 / REFRESH_HZ
const EMPTY: CoverageProfileLive = { index: -1, tSec: 0, altM: 0, distM: 0, seenBy: [] }

/** Point courant vu par ce radar ? (index dans une de ses fenêtres). */
function isSeen(windows: CoverageCut['radarCuts'][number]['windows'], index: number): boolean {
  return windows.some((w) => index >= w.iIn && index <= w.iOut)
}

/**
 * État LIVE du profil de couverture, dérivé de la progression partagée
 * (flightProgressRef, écrite par le moteur 3D) dans une boucle rAF throttlée
 * (REFRESH_HZ). Donne l'index courant + position + quels radars voient la
 * fusée à cet instant — alimente le bandeau live et le récap qui se remplit au
 * fil du vol. `EMPTY` hors vol. Aucun re-render tant que l'index ne change pas.
 */
export function useCoverageProfileLive(
  cut: CoverageCut,
  flightProgressRef: React.RefObject<number>,
): CoverageProfileLive {
  const [live, setLive] = useState<CoverageProfileLive>(EMPTY)
  const lastIdxRef = useRef(-2)

  useEffect(() => {
    const cutPoints: CutPoint[] = cut.cutPoints
    if (cutPoints.length < 2) {
      setLive(EMPTY)
      lastIdxRef.current = -2
      return
    }
    let raf = 0
    let lastMs = 0
    const update = () => {
      raf = requestAnimationFrame(update)
      const now = performance.now()
      if (now - lastMs < REFRESH_MS) return
      lastMs = now

      const progress = flightProgressRef.current
      if (progress < 0) {
        if (lastIdxRef.current !== -1) {
          lastIdxRef.current = -1
          setLive(EMPTY)
        }
        return
      }
      const index = Math.min(cutPoints.length - 1, Math.max(0, Math.floor(progress * (cutPoints.length - 1))))
      if (index === lastIdxRef.current) return
      lastIdxRef.current = index
      const p = cutPoints[index]
      const seenBy = cut.radarCuts.filter((rc) => isSeen(rc.windows, index)).map((rc) => rc.id)
      setLive({ index, tSec: p.t, altM: p.altM, distM: Math.abs(p.sM), seenBy })
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [cut, flightProgressRef])

  return live
}
