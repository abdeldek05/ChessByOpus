import type { FlightData } from '@/lib/api'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar, MesangeLaunchConfig } from '@/types/mission.types'
import type { MissionResult } from '@/types/missionResult.types'

/** State routeur transmis de /lancement vers /analytics (post-simulation). */
export interface AnalyticsPageState {
  site: LaunchSite
  radars: PlacedRadar[]
  mesangeConfigs: MesangeLaunchConfig[]
  detectionThresholdSec: number
  /** Vol RocketPy rejoué (trajectoire + stats + météo). */
  flight: FlightData
  /** Verdict de détection du moteur backend (null si simulation en erreur). */
  result: MissionResult | null
}
