import { useMemo } from 'react'
import type * as THREE from 'three'
import { PLOT_TIME_TICK_SEC } from '@/three/constants/trajectoryPlot'
import type { TrajectoryPoint } from '@/types/api.types'

/** Une marque temporelle posée sur la trajectoire. */
export interface TrajectoryTimeTick {
  /** Temps de vol (s) — valeur ronde, multiple de l'intervalle. */
  tSec: number
  /** Position du point correspondant dans le repère du graphe. */
  position: THREE.Vector3
  /** Index dans la trajectoire : sert à ne révéler la marque qu'une fois
   *  atteinte par le tracé progressif. */
  index: number
  /** Vitesse (m/s) à cet instant — annotée sur la marque de mi-parcours. */
  speedMs: number
}

/**
 * Marques temporelles régulières (T+20s, T+40s…) le long de la trajectoire.
 *
 * Le graphe est un profil distance sol × altitude : le temps n'y est pas un axe.
 * Sans repères, rien ne montre que la fusée met longtemps à monter puis retombe
 * vite — l'ESPACEMENT entre deux marques consécutives donne la vitesse
 * instantanée à l'œil (marques serrées = lent, écartées = rapide), ce qu'aucune
 * graduation d'axe ne peut dire.
 *
 * On cherche le point dont le temps de vol franchit chaque multiple de
 * l'intervalle, plutôt que d'échantillonner un index sur N : les points RocketPy
 * ne sont pas régulièrement espacés en temps, donc un pas d'index donnerait des
 * marques aux temps bâtards (T+17s, T+33s…).
 */
export function useTrajectoryTimeTicks(
  trajectory: TrajectoryPoint[],
  points: THREE.Vector3[],
): TrajectoryTimeTick[] {
  return useMemo(() => {
    if (trajectory.length === 0 || points.length === 0) return []

    const ticks: TrajectoryTimeTick[] = []
    const lastT = trajectory[trajectory.length - 1].t
    let next = PLOT_TIME_TICK_SEC

    for (let i = 0; i < trajectory.length && i < points.length; i++) {
      // `>=` et boucle `while` : si l'échantillonnage saute plus d'un intervalle
      // d'un point au suivant, on ne perd pas silencieusement la marque
      // intermédiaire (elle tombe sur le même point, ce qui est le comportement
      // correct — mieux qu'un trou dans la série).
      while (next <= lastT && trajectory[i].t >= next) {
        ticks.push({
          tSec: next,
          position: points[i],
          index: i,
          speedMs: trajectory[i].v,
        })
        next += PLOT_TIME_TICK_SEC
      }
    }

    return ticks
  }, [trajectory, points])
}
