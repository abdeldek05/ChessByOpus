import { useMemo } from 'react'
import { ARC, INCLINATION_MIN_DEG, INCLINATION_MAX_DEG } from '@/three/constants/inclinationScene'

const TICK_STEP_DEG = 5

export interface ElevationTick {
  deg: number
  /** Cran principal (multiple de 10) : tick plus long + label. */
  major: boolean
  /** Segment radial [x1,y1,z1] → [x2,y2,z2] sur l'arc. */
  from: [number, number, number]
  to: [number, number, number]
  /** Position du label (crans principaux seulement), écartée de l'arc. */
  labelPosition: [number, number, number]
}

interface UseElevationArcResult {
  /** Points de l'arc 70→90° dans le plan XY (pivot à l'origine). */
  arcPoints: [number, number, number][]
  ticks: ElevationTick[]
}

/** Point du plan de rotation à `deg` d'élévation (90 = vertical) et rayon r. */
function onArc(deg: number, radius: number): [number, number, number] {
  const fromVertical = ((90 - deg) * Math.PI) / 180
  return [radius * Math.sin(fromVertical), radius * Math.cos(fromVertical), 0]
}

/**
 * Géométrie de l'arc gradué d'élévation : la portion 70–90° autour du pivot,
 * échantillonnée finement, un tick tous les 5°. Seuls les crans principaux
 * (70/80/90) portent un label, bien écarté de l'arc — les intermédiaires
 * restent des traits fins, pour une règle lisible sans texte tassé.
 * Pur calcul mémoïsé — le rendu vit dans ElevationArcModel.
 */
export function useElevationArc(): UseElevationArcResult {
  return useMemo(() => {
    const arcPoints: [number, number, number][] = []
    for (let deg = INCLINATION_MIN_DEG; deg <= INCLINATION_MAX_DEG; deg += 0.5) {
      arcPoints.push(onArc(deg, ARC.radius))
    }

    const ticks: ElevationTick[] = []
    for (let deg = INCLINATION_MIN_DEG; deg <= INCLINATION_MAX_DEG; deg += TICK_STEP_DEG) {
      const major = deg % 10 === 0
      ticks.push({
        deg,
        major,
        from: onArc(deg, ARC.radius),
        to: onArc(deg, ARC.radius + (major ? ARC.tickLength : ARC.tickLength * 0.55)),
        labelPosition: onArc(deg, ARC.radius + ARC.tickLength + 0.6),
      })
    }

    return { arcPoints, ticks }
  }, [])
}
