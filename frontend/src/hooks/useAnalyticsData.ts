import { useMemo } from 'react'
import { useCoverageCut } from '@/hooks/useCoverageCut'
import { buildFleetFlightPlan } from '@/lib/buildFleetFlightPlan'
import type { CoverageCut } from '@/hooks/useCoverageCut'
import type { DecoyTrack } from '@/lib/launchTacticalMap'
import type { AnalyticsPageState } from '@/types/analytics.types'
import type { MesangeLaunchConfig } from '@/types/mission.types'

interface AnalyticsData {
  /** Menace principale (Roi si présent) : cale l'axe de coupe et le temps mission. */
  primary: MesangeLaunchConfig | undefined
  /** Découpage de couverture par radar dans l'axe de tir (géométrie du profil). */
  cut: CoverageCut
  /** Trajectoires des leurres, dérivées du vol du Roi comme dans la scène. */
  decoyTracks: DecoyTrack[]
  kingDelaySec: number
}

/**
 * Données dérivées du débrief, calculées UNE fois pour toute la page Analytics :
 * la coupe de couverture, les trajectoires de leurres et la menace principale.
 *
 * Les leurres sont reconstruits avec `buildFleetFlightPlan`, exactement comme la
 * scène de lancement : le backend ne renvoie que le vol du Roi, les trajectoires
 * de Dame et de Pion en sont dérivées côté client. Passer par la même fonction
 * garantit que le débrief montre les MÊMES courbes que celles qui ont été volées.
 */
export function useAnalyticsData(state: AnalyticsPageState): AnalyticsData {
  const primary = useMemo(
    () => state.mesangeConfigs.find((m) => m.role === 'KING') ?? state.mesangeConfigs[0],
    [state.mesangeConfigs],
  )

  const cut = useCoverageCut({
    flight: state.flight,
    site: state.site,
    radars: state.radars,
    azimuthDeg: primary?.azimuthDeg ?? 0,
  })

  const decoyTracks = useMemo(
    () =>
      buildFleetFlightPlan(state.mesangeConfigs, state.flight)
        .filter((plan) => !plan.isKing)
        .map((plan) => ({
          id: plan.config.id,
          role: plan.config.role,
          flight: plan.flight,
          launchDelaySec: plan.config.launchDelaySec,
        })),
    [state.mesangeConfigs, state.flight],
  )

  return { primary, cut, decoyTracks, kingDelaySec: primary?.launchDelaySec ?? 0 }
}
